import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/patient.entity.js';

// BACKUP: configure pg_dump automatic daily via cron in docker-compose
// REPLICATION: add PostgreSQL read replica for production reads
// MONITORING: integrate with Sentry or DataDog for production error tracking

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
  ) {}

  async checkHealth() {
    try {
      await this.patientRepo.query('SELECT 1');
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getStats() {
    const tables = [
      'patients', 'pregnancies', 'consultations', 'lab_results',
      'prescriptions', 'vaccines', 'ultrasound_summaries',
      'bp_readings', 'glucose_readings', 'users', 'audit_logs',
    ];

    const counts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const [row] = await this.patientRepo.query(
          `SELECT COUNT(*)::int AS count FROM "${table}"`,
        );
        counts[table] = row.count;
      } catch {
        counts[table] = -1;
      }
    }

    const [dbSize] = await this.patientRepo.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`,
    );

    return {
      databaseSize: dbSize?.size ?? 'unknown',
      tableCounts: counts,
      timestamp: new Date().toISOString(),
    };
  }

  async triggerBackup() {
    // In production: trigger pg_dump via child_process or cloud API
    return {
      message: 'Backup agendado. Implemente pg_dump via cron ou cloud backup API.',
      triggeredAt: new Date().toISOString(),
    };
  }
}
