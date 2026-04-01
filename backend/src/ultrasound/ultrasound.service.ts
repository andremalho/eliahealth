import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Ultrasound } from './ultrasound.entity.js';
import { FetalBiometry } from './fetal-biometry.entity.js';
import { DopplerData } from './doppler-data.entity.js';
import { BiophysicalProfile } from './biophysical-profile.entity.js';
import { PregnanciesService } from '../pregnancies/pregnancies.service.js';
import { CreateUltrasoundDto } from './dto/create-ultrasound.dto.js';
import { UpdateUltrasoundDto } from './dto/update-ultrasound.dto.js';
import { CreateBiometryDto } from './dto/create-biometry.dto.js';
import { UpdateBiometryDto } from './dto/update-biometry.dto.js';
import { CreateDopplerDto } from './dto/create-doppler.dto.js';
import { UpdateDopplerDto } from './dto/update-doppler.dto.js';
import { CreateBiophysicalDto } from './dto/create-biophysical.dto.js';
import { UpdateBiophysicalDto } from './dto/update-biophysical.dto.js';
import { ReferenceTableService, PercentileResult } from './reference-table.service.js';
import { BiometryParameter } from './biometry-parameter.enum.js';

const US_REPORT_SYSTEM_PROMPT = `Você é um médico especialista em ultrassonografia obstétrica e medicina fetal. Gere um laudo de ultrassom obstétrico em português médico formal, estruturado nas seguintes seções:

1. DADOS DO EXAME (tipo, data, IG)
2. BIOMETRIA FETAL (medidas com percentis quando disponíveis)
3. ANATOMIA FETAL (avaliação morfológica)
4. LÍQUIDO AMNIÓTICO (ILA e aspecto)
5. PLACENTA (localização, grau, inserção do cordão)
6. DOPPLER (quando aplicável — índices com interpretação)
7. COLO UTERINO (quando medido)
8. CONCLUSÃO (resumo com IG estimada e peso fetal)
9. OBSERVAÇÕES E RECOMENDAÇÕES

Baseie-se nos dados fornecidos. Onde não houver dados, omita a seção. Seja preciso e objetivo.`;

@Injectable()
export class UltrasoundService {
  private readonly logger = new Logger(UltrasoundService.name);
  private anthropicClient: Anthropic | null = null;

  constructor(
    @InjectRepository(Ultrasound)
    private readonly usRepo: Repository<Ultrasound>,
    @InjectRepository(FetalBiometry)
    private readonly biometryRepo: Repository<FetalBiometry>,
    @InjectRepository(DopplerData)
    private readonly dopplerRepo: Repository<DopplerData>,
    @InjectRepository(BiophysicalProfile)
    private readonly bpRepo: Repository<BiophysicalProfile>,
    private readonly pregnanciesService: PregnanciesService,
    private readonly referenceTableService: ReferenceTableService,
    private readonly configService: ConfigService,
  ) {}

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
      });
    }
    return this.anthropicClient;
  }

  // ── Ultrasound CRUD ──

  async create(pregnancyId: string, dto: CreateUltrasoundDto): Promise<Ultrasound> {
    const pregnancy = await this.pregnanciesService.findOne(pregnancyId);
    const ga = this.pregnanciesService.getGestationalAge(pregnancy, new Date(dto.examDate));

    const us = this.usRepo.create({
      ...dto,
      pregnancyId,
      gestationalAgeDays: ga.totalDays,
    });
    return this.usRepo.save(us);
  }

  async findAllByPregnancy(pregnancyId: string): Promise<Ultrasound[]> {
    return this.usRepo.find({
      where: { pregnancyId },
      order: { examDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Ultrasound> {
    const us = await this.usRepo.findOne({
      where: { id },
      relations: ['biometries', 'dopplers', 'biophysicalProfiles'],
    });
    if (!us) throw new NotFoundException(`Ultrassom ${id} nao encontrado`);
    return us;
  }

  async update(id: string, dto: UpdateUltrasoundDto): Promise<Ultrasound> {
    const us = await this.findOne(id);
    Object.assign(us, dto);
    return this.usRepo.save(us);
  }

  // ── Sub-entidades ──

  async addBiometry(ultrasoundId: string, dto: CreateBiometryDto): Promise<{ biometry: FetalBiometry; percentiles: PercentileResult[] }> {
    const us = await this.findOne(ultrasoundId);
    const gaWeeks = Math.floor(us.gestationalAgeDays / 7);

    const biometry = this.biometryRepo.create({ ...dto, ultrasoundId });

    // Calcular percentis automaticamente
    const measures: { parameter: BiometryParameter; value: number }[] = [];
    if (dto.bpd != null) measures.push({ parameter: BiometryParameter.BPD, value: dto.bpd });
    if (dto.hc != null) measures.push({ parameter: BiometryParameter.HC, value: dto.hc });
    if (dto.ac != null) measures.push({ parameter: BiometryParameter.AC, value: dto.ac });
    if (dto.fl != null) measures.push({ parameter: BiometryParameter.FL, value: dto.fl });
    if (dto.efw != null) measures.push({ parameter: BiometryParameter.EFW, value: dto.efw });
    if (dto.crownRumpLength != null) measures.push({ parameter: BiometryParameter.CRL, value: dto.crownRumpLength });
    if (dto.nuchalTranslucency != null) measures.push({ parameter: BiometryParameter.NT, value: dto.nuchalTranslucency });
    if (dto.cervicalLength != null) measures.push({ parameter: BiometryParameter.CERVICAL_LENGTH, value: dto.cervicalLength });

    const percentiles = await this.referenceTableService.calculateBiometryPercentiles(gaWeeks, measures);

    // Preencher efwPercentile se disponível
    const efwResult = percentiles.find((p) => p.parameter === BiometryParameter.EFW);
    if (efwResult && efwResult.percentile >= 0) {
      biometry.efwPercentile = efwResult.percentile;
    }

    const saved = await this.biometryRepo.save(biometry);
    return { biometry: saved, percentiles };
  }

  async addDoppler(ultrasoundId: string, dto: CreateDopplerDto): Promise<DopplerData> {
    await this.findOne(ultrasoundId);
    const doppler = this.dopplerRepo.create({ ...dto, ultrasoundId });
    return this.dopplerRepo.save(doppler);
  }

  async addBiophysical(ultrasoundId: string, dto: CreateBiophysicalDto): Promise<BiophysicalProfile> {
    await this.findOne(ultrasoundId);
    const bp = this.bpRepo.create({ ...dto, ultrasoundId });
    return this.bpRepo.save(bp);
  }

  async updateBiometry(ultrasoundId: string, dto: UpdateBiometryDto): Promise<FetalBiometry> {
    const us = await this.findOne(ultrasoundId);
    const biometry = us.biometries[0];
    if (!biometry) throw new NotFoundException(`Biometria nao encontrada para ultrassom ${ultrasoundId}`);
    Object.assign(biometry, dto);
    return this.biometryRepo.save(biometry);
  }

  async updateDoppler(ultrasoundId: string, dto: UpdateDopplerDto): Promise<DopplerData> {
    const us = await this.findOne(ultrasoundId);
    const doppler = us.dopplers[0];
    if (!doppler) throw new NotFoundException(`Doppler nao encontrado para ultrassom ${ultrasoundId}`);
    Object.assign(doppler, dto);
    return this.dopplerRepo.save(doppler);
  }

  async updateBiophysical(ultrasoundId: string, dto: UpdateBiophysicalDto): Promise<BiophysicalProfile> {
    const us = await this.findOne(ultrasoundId);
    const bp = us.biophysicalProfiles[0];
    if (!bp) throw new NotFoundException(`Perfil biofisico nao encontrado para ultrassom ${ultrasoundId}`);
    Object.assign(bp, dto);
    return this.bpRepo.save(bp);
  }

  // ── Generate Report ──

  async generateReport(id: string): Promise<Ultrasound> {
    const us = await this.findOne(id);
    const gaWeeks = Math.floor(us.gestationalAgeDays / 7);
    const gaDays = us.gestationalAgeDays % 7;

    const context = JSON.stringify({
      examType: us.examType,
      examDate: us.examDate,
      gestationalAge: `${gaWeeks} semanas e ${gaDays} dias`,
      imageQuality: us.imageQuality,
      voiceTranscript: us.voiceTranscript,
      biometries: us.biometries.map((b) => ({
        fetusNumber: b.fetusNumber,
        bpd: b.bpd, hc: b.hc, ac: b.ac, fl: b.fl,
        efw: b.efw, efwPercentile: b.efwPercentile,
        crownRumpLength: b.crownRumpLength,
        nuchalTranslucency: b.nuchalTranslucency,
        nasalBone: b.nasalBone,
        amnioticFluidIndex: b.amnioticFluidIndex,
        placentaLocation: b.placentaLocation,
        placentaGrade: b.placentaGrade,
        cervicalLength: b.cervicalLength,
      })),
      dopplers: us.dopplers.map((d) => ({
        fetusNumber: d.fetusNumber,
        umbilicalArteryPI: d.umbilicalArteryPI,
        umbilicalArteryRI: d.umbilicalArteryRI,
        umbilicalArterySD: d.umbilicalArterySD,
        umbilicalArteryEDF: d.umbilicalArteryEDF,
        mcaPSV: d.mcaPSV, mcaPI: d.mcaPI,
        uterineArteryPI: d.uterineArteryPI,
        uterineArteryNotch: d.uterineArteryNotch,
        ductusVenosusPI: d.ductusVenosusPI,
        ductusVenosusAwave: d.ductusVenosusAwave,
      })),
      biophysicalProfiles: us.biophysicalProfiles.map((p) => ({
        fetusNumber: p.fetusNumber,
        fetalBreathing: p.fetalBreathing,
        fetalMovement: p.fetalMovement,
        fetalTone: p.fetalTone,
        amnioticFluid: p.amnioticFluid,
        nstResult: p.nstResult,
        totalScore: p.totalScore,
      })),
    });

    try {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        this.logger.error('ANTHROPIC_API_KEY nao configurada');
        us.aiInterpretation = 'Erro: API key nao configurada.';
        return this.usRepo.save(us);
      }

      const response = await this.getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: US_REPORT_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Gere o laudo para o seguinte exame de ultrassom obstétrico:\n\n${context}` },
        ],
      });

      const report = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      us.aiInterpretation = report;
      return this.usRepo.save(us);
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.error(`Erro ao gerar laudo: [${err.status ?? 'N/A'}] ${err.message}`, err.stack);
      us.aiInterpretation = `Erro ao gerar laudo: ${err.message}`;
      return this.usRepo.save(us);
    }
  }
}
