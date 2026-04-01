import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { PatientLoginDto } from './dto/patient-login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RolesGuard } from './guards/roles.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('patient/login')
  patientLogin(@Body() dto: PatientLoginDto) {
    return this.authService.patientLogin(dto);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  me(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.authService.me(userId, role);
  }
}
