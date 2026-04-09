import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const LAB_RESULT_PROMPT = `Você é um assistente médico que extrai dados estruturados de resultados de exames laboratoriais. Analise o documento e retorne APENAS um JSON válido (sem markdown, sem texto adicional) com a estrutura:
{
  "exams": [
    {
      "examName": "string (nome do exame em português, ex: Hemoglobina)",
      "examCategory": "hematology|biochemistry|serology|urinalysis|hormonal|microbiology|genetics|other",
      "value": number | null,
      "unit": "string (ex: g/dL)",
      "referenceMin": number | null,
      "referenceMax": number | null,
      "resultText": "string (apenas se for resultado qualitativo, ex: positivo/negativo)",
      "labName": "string ou null",
      "resultDate": "YYYY-MM-DD ou null"
    }
  ]
}
Se o documento contiver múltiplos exames, retorne todos no array. Se não conseguir identificar um campo, retorne null. Se o documento não for um exame laboratorial, retorne {"exams":[]}.`;

const ULTRASOUND_PROMPT = `Você é um assistente médico especializado em obstetrícia que extrai dados estruturados de laudos de ultrassonografia. Analise o documento e retorne APENAS um JSON válido (sem markdown, sem texto adicional) com a estrutura:
{
  "examType": "first_trimester|morphology|morphology_3t|obstetric|doppler|transvaginal|biophysical_profile|other",
  "examDate": "YYYY-MM-DD ou null",
  "operatorName": "string ou null",
  "equipmentModel": "string ou null",
  "gestationalAgeWeeks": number | null,
  "gestationalAgeDays": number | null,
  "fetalWeight": "string ou null (ex: 1850g)",
  "biometry": {
    "bpd": number | null,
    "hc": number | null,
    "ac": number | null,
    "fl": number | null
  },
  "findings": "string (achados principais resumidos)",
  "finalReport": "string (laudo completo em texto)"
}
Se o documento não for um laudo de ultrassonografia, retorne {"examType":"other","finalReport":""}.`;

@Controller('uploads')
@Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN, UserRole.PATIENT)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);
  private client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) throw new BadRequestException('ANTHROPIC_API_KEY nao configurada');
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          cb(new BadRequestException(`Tipo nao permitido: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async extract(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'lab_result' | 'ultrasound',
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    if (type !== 'lab_result' && type !== 'ultrasound') {
      throw new BadRequestException('type deve ser lab_result ou ultrasound');
    }

    const prompt = type === 'lab_result' ? LAB_RESULT_PROMPT : ULTRASOUND_PROMPT;
    const isPdf = file.mimetype === 'application/pdf';
    const base64 = file.buffer.toString('base64');

    try {
      const content: any[] = [
        isPdf
          ? {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            }
          : {
              type: 'image',
              source: { type: 'base64', media_type: file.mimetype, data: base64 },
            },
        { type: 'text', text: 'Extraia os dados conforme as instrucoes do system prompt.' },
      ];

      const response = await this.getClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: prompt,
        messages: [{ role: 'user', content }],
      });

      const rawText = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      const cleanJson = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanJson);

      // Arquivo descartado: estava em memoria, sera coletado pelo GC ao final do request
      return parsed;
    } catch (err) {
      const e = err as Error & { status?: number };
      this.logger.error(`Falha na extracao ${type}: ${e.message}`);
      throw new BadRequestException(
        `Nao foi possivel extrair dados do arquivo: ${e.message}`,
      );
    }
  }

  // ── Anexo genérico (foto/PDF) — armazenamento persistente ──
  // Usado por módulos que precisam guardar arquivos clínicos vinculados a
  // entidades (ex: histeroscopias do módulo de Ciclo/SUA). Salva em disco e
  // retorna URL relativa servida estaticamente em /uploads/<filename>.
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.bin';
          const safeName = `${randomUUID()}${ext}`;
          cb(null, safeName);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          cb(new BadRequestException(`Tipo nao permitido: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return {
      url: `/uploads/${file.filename}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }
}
