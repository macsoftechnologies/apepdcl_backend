import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinemanController } from './lineman.controller';
import { LinemanService } from './lineman.service';
import { Complaint } from '../complaints/entities/complaint.entity';
import { LinemanDetails } from '../staff/entities/lineman-details.entity';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, LinemanDetails]),
    StaffModule, // For StaffAuthGuard and PermissionsGuard
  ],
  controllers: [LinemanController],
  providers: [LinemanService],
})
export class LinemanModule {}
