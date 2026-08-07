import { IsEnum, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { ComplaintStatus } from '../entities/complaint.entity';

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  @IsNotEmpty()
  status: ComplaintStatus;

  @IsInt()
  @IsOptional()
  assigned_lineman_id?: number; // Optional if assigning
}
