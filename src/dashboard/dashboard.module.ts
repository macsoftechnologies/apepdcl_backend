import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from '../complaints/entities/complaint.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { StaffDashboardController } from './staff-dashboard.controller';
import { StaffDashboardService } from './staff-dashboard.service';
import { StaffJurisdiction } from '../staff/entities/staff-jurisdiction.entity';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, StaffJurisdiction]),
    StaffModule
  ],
  providers: [DashboardService, StaffDashboardService],
  controllers: [DashboardController, StaffDashboardController]
})
export class DashboardModule {}
