import { Controller, Get, Post, Delete, Patch, Body, Query, Param, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PortalService } from './portal.service.js';
import { PortalDataService } from './portal-data.service.js';
import { UpdatePortalProfileDto } from './dto/update-portal-profile.dto.js';
import { CompleteProfileDto } from './dto/complete-profile.dto.js';
import { CreatePortalBpDto } from './dto/portal-bp.dto.js';
import { CreatePortalGlucoseDto } from './dto/portal-glucose.dto.js';
import { CreatePublicShareDto } from './dto/create-public-share.dto.js';
import { CreateGuestAccessDto } from './dto/create-guest-access.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/auth.enums.js';

@Controller('portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly dataService: PortalDataService,
  ) {}

  // ── Auth OTP ──

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('auth/request-otp')
  requestOtp(@Body() body: { cpf: string }) {
    return this.portalService.requestOtp(body.cpf);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('auth/verify-otp')
  verifyOtp(@Body() body: { cpf: string; code: string }) {
    return this.portalService.verifyOtp(body.cpf, body.code);
  }

  // ── Auth / Onboarding ──

  @Public()
  @Post('verify')
  verify(@Query('token') token: string) {
    return this.portalService.verify(token);
  }

  @Post('complete-profile')
  @Roles(UserRole.PATIENT)
  completeProfile(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.portalService.completeProfile(patientId, dto);
  }

  @Patch('profile')
  @Roles(UserRole.PATIENT)
  updateProfile(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: UpdatePortalProfileDto,
  ) {
    return this.portalService.updateProfile(patientId, dto);
  }

  // ── Module 1: Dashboard ──

  @Get('dashboard')
  @Roles(UserRole.PATIENT)
  getDashboard(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getDashboard(patientId);
  }

  // ── Module 2: Consultations ──

  @Get('consultations')
  @Roles(UserRole.PATIENT)
  getConsultations(
    @CurrentUser('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.dataService.getConsultations(patientId, p, l);
  }

  // ── Module 3: Blood Pressure ──

  @Get('blood-pressure')
  @Roles(UserRole.PATIENT)
  getBloodPressure(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getBloodPressure(patientId);
  }

  @Post('blood-pressure')
  @Roles(UserRole.PATIENT)
  createBloodPressure(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: CreatePortalBpDto,
  ) {
    return this.dataService.createBloodPressure(patientId, dto);
  }

  @Get('blood-pressure/chart')
  @Roles(UserRole.PATIENT)
  getBloodPressureChart(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getBloodPressureChart(patientId);
  }

  // ── Module 4: Glucose ──

  @Get('glucose')
  @Roles(UserRole.PATIENT)
  getGlucose(
    @CurrentUser('patientId') patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dataService.getGlucose(patientId, startDate, endDate);
  }

  @Post('glucose')
  @Roles(UserRole.PATIENT)
  createGlucose(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: CreatePortalGlucoseDto,
  ) {
    return this.dataService.createGlucose(patientId, dto);
  }

  // ── Module 5: Profile ──

  @Get('profile-data')
  @Roles(UserRole.PATIENT)
  getProfile(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getProfile(patientId);
  }

  // ── Module 6: Vaccines ──

  @Get('vaccines')
  @Roles(UserRole.PATIENT)
  getVaccines(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getVaccines(patientId);
  }

  // ── Module 7: Vaginal Swabs ──

  @Get('vaginal-swabs')
  @Roles(UserRole.PATIENT)
  getVaginalSwabs(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getVaginalSwabs(patientId);
  }

  // ── Module 8: Lab Results ──

  @Get('lab-results')
  @Roles(UserRole.PATIENT)
  getLabResults(
    @CurrentUser('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    return this.dataService.getLabResults(patientId, p, l);
  }

  // ── Module 9: Ultrasounds ──

  @Get('ultrasounds')
  @Roles(UserRole.PATIENT)
  getUltrasounds(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getUltrasounds(patientId);
  }

  // ── Module 10: Public Share ──

  @Post('share/public')
  @Roles(UserRole.PATIENT)
  createPublicShare(
    @CurrentUser('patientId') patientId: string,
    @Body() dto: CreatePublicShareDto,
  ) {
    return this.dataService.createPublicShare(patientId, dto.expiresAt);
  }

  @Post('share/public/by-pregnancy/:pregnancyId')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  createPublicShareForPregnancy(
    @Param('pregnancyId') pregnancyId: string,
    @Body() body: { expiresAt?: string },
  ) {
    return this.dataService.createPublicShareForPregnancy(pregnancyId, body?.expiresAt);
  }

  @Public()
  @Get('share/public/:shareToken')
  getPublicShareData(@Param('shareToken') shareToken: string, @Req() req: any) {
    return this.dataService.getPublicShareData(shareToken, req.ip ?? req.socket?.remoteAddress);
  }

  @Delete('share/public/:shareToken')
  @Roles(UserRole.PATIENT)
  revokePublicShare(
    @CurrentUser('patientId') patientId: string,
    @Param('shareToken') shareToken: string,
  ) {
    return this.dataService.revokePublicShare(patientId, shareToken);
  }

  @Get('share/public')
  @Roles(UserRole.PATIENT)
  listPublicShares(@CurrentUser('patientId') patientId: string) {
    return this.dataService.listPublicShares(patientId);
  }

  // ── Guests ──

  @Post('guests')
  @Roles(UserRole.PATIENT)
  createGuestAccess(@CurrentUser('patientId') patientId: string, @Body() dto: CreateGuestAccessDto) {
    return this.dataService.createGuestAccess(patientId, dto);
  }

  @Get('guests')
  @Roles(UserRole.PATIENT)
  listGuests(@CurrentUser('patientId') patientId: string) {
    return this.dataService.listGuests(patientId);
  }

  @Delete('guests/:id')
  @Roles(UserRole.PATIENT)
  revokeGuest(@CurrentUser('patientId') patientId: string, @Param('id') id: string) {
    return this.dataService.revokeGuestAccess(patientId, id);
  }

  @Public()
  @Get('guests/:accessToken')
  getGuestData(@Param('accessToken') accessToken: string, @Req() req: any) {
    return this.dataService.getGuestData(accessToken, req.ip ?? req.socket?.remoteAddress);
  }

  // ── Patient Exams ──

  @Post('patient-exams')
  @Roles(UserRole.PATIENT)
  createPatientExam(@CurrentUser('patientId') patientId: string, @Body() body: Record<string, unknown>) {
    return this.dataService.createPatientExam(patientId, body as any);
  }

  @Get('patient-exams')
  @Roles(UserRole.PATIENT)
  listPatientExams(@CurrentUser('patientId') patientId: string) {
    return this.dataService.listPatientExams(patientId);
  }

  @Delete('patient-exams/:id')
  @Roles(UserRole.PATIENT)
  deletePatientExam(@CurrentUser('patientId') patientId: string, @Param('id') id: string) {
    return this.dataService.deletePatientExam(patientId, id);
  }

  // ── Module 11: Postpartum Consultations ──

  @Get('postpartum')
  @Roles(UserRole.PATIENT)
  getPostpartum(@CurrentUser('patientId') patientId: string) {
    return this.dataService.getPostpartumConsultations(patientId);
  }

  // ── Doctor Exam Review ──

  @Get('patient-exams/pending/:pregnancyId')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  listPendingPatientExams(@Param('pregnancyId') pregnancyId: string) {
    return this.dataService.listPendingPatientExams(pregnancyId);
  }

  @Patch('patient-exams/:id/review')
  @Roles(UserRole.PHYSICIAN, UserRole.NURSE, UserRole.ADMIN)
  reviewPatientExam(
    @Param('id') id: string,
    @Body() body: { status: 'confirmed' | 'rejected'; notes?: string },
  ) {
    return this.dataService.reviewPatientExam(id, body.status, body.notes);
  }
}
