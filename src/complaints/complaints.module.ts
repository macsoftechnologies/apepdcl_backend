import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Complaint } from './entities/complaint.entity';
import { Consumer } from './entities/consumer.entity';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { StaffComplaintsController } from './staff-complaints.controller';
import { StaffComplaintsService } from './staff-complaints.service';
import { StaffJurisdiction } from '../staff/entities/staff-jurisdiction.entity';
import { LinemanDetails } from '../staff/entities/lineman-details.entity';
import { StaffModule } from '../staff/staff.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, Consumer, StaffJurisdiction, LinemanDetails]),
    StaffModule,
    NotificationsModule
  ],
  controllers: [ComplaintsController, StaffComplaintsController],
  providers: [ComplaintsService, StaffComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
