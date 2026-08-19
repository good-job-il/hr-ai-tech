import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { join } from "path"
import { AppModule } from "./app.module"
import { ConfigService } from "@nestjs/config"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { ZodValidationPipe } from "nestjs-zod"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { TransformInterceptor } from "./common/interceptors/transform.interceptor"
import { randomUUID } from "crypto"
import { OperationalMetricsService } from "./common/monitoring/operational-metrics.service"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  })

  const configService = app.get(ConfigService)

  const port = configService.get<number>("PORT", 3001)

  const frontendUrl = configService.get<string>("FRONTEND_URL", "http://localhost:5173")

  const metrics = app.get(OperationalMetricsService)

  app.use((request, response, next) => {
    const incoming = request.header("x-request-id")

    const requestId = incoming && /^[A-Za-z0-9._-]{1,100}$/.test(incoming) ? incoming : randomUUID()

    request.requestId = requestId
    response.setHeader("X-Request-Id", requestId)
    response.on("finish", () => metrics.recordHttp(request.path, response.statusCode))
    next()
  })

  // ─── Static file serving (uploads) ────────────────────────────────────
  // Served OUTSIDE the /api prefix so file_url values are directly usable
  // by <img>/<a> tags without going through the REST interceptors.
  const uploadDir = configService.get<string>("UPLOAD_DIR", "./uploads")

  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: "/uploads/" })

  // ─── Global prefix ────────────────────────────────────────────────────
  app.setGlobalPrefix("api")

  // ─── CORS ─────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [frontendUrl, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
    exposedHeaders: ["X-Access-Token", "X-Request-Id"],
  })

  // ─── Global pipes ─────────────────────────────────────────────────────
  app.useGlobalPipes(new ZodValidationPipe())

  // ─── Global filters ───────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter())

  // ─── Global interceptors ──────────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor())

  // ─── Swagger ──────────────────────────────────────────────────────────
  if (configService.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Hire Israel API")
      .setDescription("NestJS API for the Hire Israel platform")
      .setVersion("1.0")
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)

    SwaggerModule.setup("api/docs", app, document)
  }

  await app.listen(port)
  console.log(`🚀 Hire Israel Backend running on http://localhost:${port}/api`)
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`)
}

void bootstrap()
