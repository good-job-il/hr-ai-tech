import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Request } from 'express';
import { EmailService } from './services/email.service';
import { LlmService } from './services/llm.service';
import { SendEmailDto, InvokeLLMDto } from './dto/integrations.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/user.entity';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

/**
 * IntegrationsController — replaces `base44.integrations.Core.*` calls
 * (UploadFile, SendEmail, InvokeLLM) used directly by the frontend.
 * Mirrors Base44's compatibility surface for the Phase 5 shim.
 */
@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly emailService: EmailService,
    private readonly llmService: LlmService,
    private readonly config: ConfigService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = randomUUID();
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file provided');

    const host = `${req.protocol}://${req.get('host')}`;
    const file_url = `${host}/uploads/${file.filename}`;

    return {
      file_url,
      filename: file.originalname,
      size: file.size,
      mime_type: file.mimetype,
    };
  }

  @Post('send-email')
  sendEmail(@Body() dto: SendEmailDto, @CurrentUser() user: UserEntity) {
    return this.emailService.send(dto.to, dto.subject, dto.body, dto.from_name || user?.full_name);
  }

  @Post('invoke-llm')
  invokeLlm(@Body() dto: InvokeLLMDto) {
    return this.llmService.invoke(dto.prompt, dto.response_json_schema, dto.model);
  }
}

