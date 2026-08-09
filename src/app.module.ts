// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { GeographyModule } from './geography/geography.module';
import { StaffModule } from './staff/staff.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeederService } from './config/seeder.service';
import { Designation } from './staff/entities/designation.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './config/settings.module';
import { EscalationModule } from './escalation/escalation.module';
import { StaffUser } from './staff/entities/staff-user.entity';
import { Permission } from './staff/entities/permission.entity';
import { ConsumerModule } from './consumer/consumer.module';
import { LinemanModule } from './lineman/lineman.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    TypeOrmModule.forFeature([Designation, StaffUser, Permission]),
    AuthModule,
    GeographyModule,
    ComplaintsModule,
    NotificationsModule,
    SettingsModule,
    StaffModule,
    DashboardModule,
    ConsumerModule,
    LinemanModule,
    UploadModule,
    EscalationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  providers: [],
})
export class AppModule {}
