import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
  patientId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'fallback-secret'),
    });
  }

  validate(payload: AuthTokenPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      patientId: payload.patientId,
    };
  }
}
