import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { TelemedicineSession, CallStatus } from './telemedicine.entity.js';

@Injectable()
export class TelemedicineService {
  private readonly logger = new Logger(TelemedicineService.name);
  private readonly dailyApiKey: string;
  private readonly dailyApiUrl = 'https://api.daily.co/v1';

  constructor(
    @InjectRepository(TelemedicineSession)
    private readonly repo: Repository<TelemedicineSession>,
    private readonly config: ConfigService,
  ) {
    this.dailyApiKey = this.config.get<string>('DAILY_API_KEY', '');
  }

  async createSession(dto: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    tenantId?: string;
  }): Promise<TelemedicineSession> {
    const roomName = `elia-${randomUUID().slice(0, 8)}`;

    let roomUrl: string | null = null;
    let doctorToken: string | null = null;
    let patientToken: string | null = null;

    if (this.dailyApiKey) {
      try {
        // Create Daily.co room
        const roomRes = await fetch(`${this.dailyApiUrl}/rooms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.dailyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'private',
            properties: {
              exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
              enable_chat: true,
              enable_screenshare: true,
              max_participants: 4,
              enable_recording: false,
            },
          }),
        });
        const room = await roomRes.json();
        roomUrl = room.url;

        // Create meeting tokens
        const createToken = async (isOwner: boolean) => {
          const res = await fetch(`${this.dailyApiUrl}/meeting-tokens`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.dailyApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: {
                room_name: roomName,
                is_owner: isOwner,
                exp: Math.floor(Date.now() / 1000) + 3600,
              },
            }),
          });
          const data = await res.json();
          return data.token;
        };

        doctorToken = await createToken(true);
        patientToken = await createToken(false);
      } catch (err) {
        this.logger.error(`Falha ao criar sala Daily.co: ${err}`);
        // Fallback: use room name without Daily.co
        roomUrl = `https://eliahealth.daily.co/${roomName}`;
      }
    } else {
      this.logger.warn('DAILY_API_KEY nao configurada — sessao sem video real');
      roomUrl = `https://eliahealth.daily.co/${roomName}`;
    }

    const session = this.repo.create({
      ...dto,
      roomName,
      roomUrl,
      doctorToken,
      patientToken,
      appointmentId: dto.appointmentId ?? null,
      tenantId: dto.tenantId ?? null,
      status: CallStatus.WAITING,
    });

    return this.repo.save(session);
  }

  async findById(id: string): Promise<TelemedicineSession> {
    const session = await this.repo.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!session) throw new NotFoundException('Sessao nao encontrada');
    return session;
  }

  async findByDoctor(doctorId: string) {
    return this.repo.find({
      where: { doctorId },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async findByPatient(patientId: string) {
    return this.repo.find({
      where: { patientId },
      relations: ['doctor'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async startCall(id: string): Promise<TelemedicineSession> {
    const session = await this.findById(id);
    session.status = CallStatus.IN_PROGRESS;
    session.startedAt = new Date();
    return this.repo.save(session);
  }

  async endCall(id: string, notes?: string): Promise<TelemedicineSession> {
    const session = await this.findById(id);
    session.status = CallStatus.COMPLETED;
    session.endedAt = new Date();
    if (session.startedAt) {
      session.durationSeconds = Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    }
    if (notes) session.notes = notes;
    return this.repo.save(session);
  }

  async getPatientSession(patientId: string, sessionId: string): Promise<{
    roomUrl: string | null;
    token: string | null;
    status: string;
    doctorName: string | null;
  }> {
    const session = await this.repo.findOne({
      where: { id: sessionId, patientId },
      relations: ['doctor'],
    });
    if (!session) throw new NotFoundException('Sessao nao encontrada');
    return {
      roomUrl: session.roomUrl,
      token: session.patientToken,
      status: session.status,
      doctorName: session.doctor?.name ?? null,
    };
  }
}
