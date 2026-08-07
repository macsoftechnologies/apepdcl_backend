import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consumer } from '../complaints/entities/consumer.entity';

@Injectable()
export class ConsumerJwtStrategy extends PassportStrategy(Strategy, 'jwt-consumer') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Consumer)
    private consumerRepo: Repository<Consumer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: { sub: number; is_consumer: boolean }) {
    if (!payload.is_consumer) {
      throw new UnauthorizedException('Access restricted to consumers only.');
    }
    const consumer = await this.consumerRepo.findOne({
      where: { consumer_id: payload.sub },
    });
    if (!consumer || !consumer.is_active) {
      throw new UnauthorizedException('Consumer inactive or not found.');
    }
    return consumer;
  }
}
