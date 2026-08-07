import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ComplaintCategory } from '../../complaints/entities/complaint.entity';

export class CreateConsumerComplaintDto {
  @IsEnum(ComplaintCategory)
  @IsNotEmpty()
  category_key: ComplaintCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsNumber()
  @IsNotEmpty()
  gps_lat: number;

  @IsNumber()
  @IsNotEmpty()
  gps_lng: number;

  @IsString()
  @IsOptional()
  gps_address?: string;
}
