import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StaffJwtStrategy extends PassportStrategy(Strategy, 'staff-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret',
    });
  }

  async validate(payload: any) {
    if (!payload.is_staff) {
      throw new UnauthorizedException('Token is not a valid staff token');
    }
    return {
      staff_id: payload.sub,
      email: payload.email,
      phone_number: payload.phone_number,
      role_level: payload.role_level,
      lineman_id: payload.lineman_id,
      section_id: payload.section_id,
    };
  }
}
