import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { EscalationService } from './escalation.service';
import { SettingsModule } from '../config/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Complaint]),
    SettingsModule,
    NotificationsModule,
  ],
  providers: [EscalationService],
})
export class EscalationModule {}
