import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/user.entity.js';
import { UserRole } from '../auth/auth.enums.js';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const existing = await this.userRepo.findOneBy({ email: 'admin@eliahealth.com' });
    if (existing) return;

    const hash = await bcrypt.hash('Admin@Elia2026!', 12);
    await this.userRepo.save(
      this.userRepo.create({
        name: 'Administrador EliaHealth',
        email: 'admin@eliahealth.com',
        password: hash,
        role: UserRole.SUPERADMIN,
        isActive: true,
      }),
    );
    this.logger.log('Admin seed: usuario admin@eliahealth.com criado');
  }
}
