import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ChatMessage } from './chat.entity.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repo: Repository<ChatMessage>,
  ) {}

  async sendMessage(dto: {
    patientId: string;
    doctorId: string;
    senderType: 'doctor' | 'patient';
    content: string;
    attachmentUrl?: string;
    tenantId?: string;
  }): Promise<ChatMessage> {
    const msg = this.repo.create({
      ...dto,
      attachmentUrl: dto.attachmentUrl ?? null,
      tenantId: dto.tenantId ?? null,
    });
    return this.repo.save(msg);
  }

  async getConversation(patientId: string, doctorId: string, page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      where: { patientId, doctorId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: data.reverse(), total, page, limit };
  }

  async getPatientConversations(patientId: string) {
    const conversations = await this.repo.query(
      `SELECT DISTINCT ON (doctor_id) doctor_id, content, created_at, sender_type,
              (SELECT name FROM users WHERE id = cm.doctor_id) AS doctor_name,
              (SELECT COUNT(*)::int FROM chat_messages WHERE patient_id = $1 AND doctor_id = cm.doctor_id AND read_at IS NULL AND sender_type = 'doctor') AS unread
       FROM chat_messages cm WHERE patient_id = $1
       ORDER BY doctor_id, created_at DESC`,
      [patientId],
    );
    return conversations;
  }

  async getDoctorConversations(doctorId: string) {
    const conversations = await this.repo.query(
      `SELECT DISTINCT ON (patient_id) patient_id, content, created_at, sender_type,
              (SELECT full_name FROM patients WHERE id = cm.patient_id) AS patient_name,
              (SELECT COUNT(*)::int FROM chat_messages WHERE doctor_id = $1 AND patient_id = cm.patient_id AND read_at IS NULL AND sender_type = 'patient') AS unread
       FROM chat_messages cm WHERE doctor_id = $1
       ORDER BY patient_id, created_at DESC`,
      [doctorId],
    );
    return conversations;
  }

  async markRead(patientId: string, doctorId: string, readerType: 'doctor' | 'patient') {
    const senderType = readerType === 'doctor' ? 'patient' : 'doctor';
    await this.repo.update(
      { patientId, doctorId, senderType, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { marked: true };
  }

  async getUnreadCount(userId: string, role: 'doctor' | 'patient'): Promise<number> {
    if (role === 'doctor') {
      const [result] = await this.repo.query(
        `SELECT COUNT(*)::int AS count FROM chat_messages WHERE doctor_id = $1 AND sender_type = 'patient' AND read_at IS NULL`,
        [userId],
      );
      return result?.count ?? 0;
    }
    const [result] = await this.repo.query(
      `SELECT COUNT(*)::int AS count FROM chat_messages WHERE patient_id = $1 AND sender_type = 'doctor' AND read_at IS NULL`,
      [userId],
    );
    return result?.count ?? 0;
  }
}
