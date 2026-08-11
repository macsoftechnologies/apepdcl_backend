import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  ComplaintStatus,
  ComplaintCategory,
} from '../entities/complaint.entity';
import { IsOptional, IsEnum, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ComplaintsPaginationDto extends PaginationDto {
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @IsEnum(ComplaintCategory)
  @IsOptional()
  category_key?: ComplaintCategory;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  circle_id?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  division_id?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  subdivision_id?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  section_id?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  lineman_id?: number;

}
