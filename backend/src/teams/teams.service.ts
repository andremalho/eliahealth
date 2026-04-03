import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './team-member.entity.js';
import { PregnancyShare } from './pregnancy-share.entity.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';
import { SharePregnancyDto } from './dto/share-pregnancy.dto.js';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamMember) private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(PregnancyShare) private readonly shareRepo: Repository<PregnancyShare>,
  ) {}

  // ── Team Members ──

  async invite(ownerId: string, dto: InviteMemberDto): Promise<TeamMember> {
    const member = this.memberRepo.create({ ...dto, ownerId });
    return this.memberRepo.save(member);
  }

  async findTeam(ownerId: string): Promise<TeamMember[]> {
    return this.memberRepo.find({
      where: { ownerId, isActive: true },
      relations: ['member'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateMember(id: string, dto: UpdateMemberDto): Promise<TeamMember> {
    const member = await this.memberRepo.findOneBy({ id });
    if (!member) throw new NotFoundException(`Membro ${id} nao encontrado`);
    Object.assign(member, dto);
    return this.memberRepo.save(member);
  }

  async removeMember(id: string): Promise<void> {
    const member = await this.memberRepo.findOneBy({ id });
    if (!member) throw new NotFoundException(`Membro ${id} nao encontrado`);
    await this.memberRepo.remove(member);
  }

  // ── Pregnancy Shares ──

  async sharePregnancy(pregnancyId: string, sharedBy: string, dto: SharePregnancyDto): Promise<PregnancyShare> {
    const share = this.shareRepo.create({
      pregnancyId,
      sharedBy,
      sharedWith: dto.sharedWith,
      permission: dto.permission,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.shareRepo.save(share);
  }

  async findShares(pregnancyId: string): Promise<PregnancyShare[]> {
    return this.shareRepo.find({
      where: { pregnancyId },
      relations: ['sharedWithUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeShare(pregnancyId: string, shareId: string): Promise<void> {
    const share = await this.shareRepo.findOneBy({ id: shareId, pregnancyId });
    if (!share) throw new NotFoundException(`Compartilhamento ${shareId} nao encontrado`);
    await this.shareRepo.remove(share);
  }
}
