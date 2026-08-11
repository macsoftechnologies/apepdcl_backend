import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Consumer } from '../complaints/entities/consumer.entity';
import { Section } from '../geography/entities/section.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConsumerComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { ConsumerJwtStrategy } from './consumer-jwt.strategy';
import { StaffUser } from '../staff/entities/staff-user.entity';
import { StaffPermission } from '../staff/entities/staff-permission.entity';
import { Permission } from '../staff/entities/permission.entity';
import { StaffJurisdiction } from '../staff/entities/staff-jurisdiction.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consumer, Section, Complaint, StaffUser, StaffPermission, Permission, StaffJurisdiction]),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [AuthService, ConsumerComplaintsService, ConsumerJwtStrategy],
  controllers: [AuthController, ComplaintsController],
})
export class ConsumerModule {}
