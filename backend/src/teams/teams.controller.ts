import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';
import { SharePregnancyDto } from './dto/share-pregnancy.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller()
@Roles(UserRole.PHYSICIAN, UserRole.ADMIN)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Post('teams/invite')
  invite(@CurrentUser('userId') ownerId: string, @Body() dto: InviteMemberDto) {
    return this.service.invite(ownerId, dto);
  }

  @Get('teams')
  findTeam(@CurrentUser('userId') ownerId: string) {
    return this.service.findTeam(ownerId);
  }

  @Patch('teams/:id')
  updateMember(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMemberDto) {
    return this.service.updateMember(id, dto);
  }

  @Delete('teams/:id')
  removeMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeMember(id);
  }

  @Post('pregnancies/:pregnancyId/share')
  sharePregnancy(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @CurrentUser('userId') sharedBy: string,
    @Body() dto: SharePregnancyDto,
  ) { return this.service.sharePregnancy(pregnancyId, sharedBy, dto); }

  @Get('pregnancies/:pregnancyId/shares')
  findShares(@Param('pregnancyId', ParseUUIDPipe) pregnancyId: string) {
    return this.service.findShares(pregnancyId);
  }

  @Delete('pregnancies/:pregnancyId/shares/:id')
  revokeShare(
    @Param('pregnancyId', ParseUUIDPipe) pregnancyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) { return this.service.revokeShare(pregnancyId, id); }
}
