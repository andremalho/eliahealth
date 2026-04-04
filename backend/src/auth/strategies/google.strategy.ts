import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const enabled = configService.get('GOOGLE_OAUTH_ENABLED', 'false') === 'true';
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID', enabled ? '' : 'placeholder'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET', enabled ? '' : 'placeholder'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: { emails?: { value: string }[]; displayName?: string },
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName ?? email ?? 'Google User';
    done(null, { email, name, provider: 'google' });
  }
}
