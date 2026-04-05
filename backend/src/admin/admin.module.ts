import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/patient.entity.js';
import { User } from '../auth/user.entity.js';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AdminSeedService } from '../seeds/admin.seed.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, User]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminSeedService],
})
export class AdminModule {}
