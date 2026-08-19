import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger"
import { diskStorage } from "multer"
import { randomUUID } from "crypto"
import { extname } from "path"
import { existsSync, mkdirSync } from "fs"
import { Request } from "express"

const uploadDir = process.env.UPLOAD_DIR || "./uploads"

if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true })
}

@ApiTags("Files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_request, file, callback) =>
          callback(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }

    const host =
      process.env.API_PUBLIC_URL ||
      (process.env.NODE_ENV === "production"
        ? `${request.protocol}://${request.get("host")}`
        : `http://localhost:${process.env.PORT || 3001}`)

    return {
      file_url: `${host}/uploads/${file.filename}`,
      filename: file.originalname,
      size: file.size,
      mime_type: file.mimetype,
    }
  }
}
