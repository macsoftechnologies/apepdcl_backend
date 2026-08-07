import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateSectionDto {
  @IsInt()
  @IsNotEmpty()
  subdivision_id: number;

  @IsString()
  @IsNotEmpty()
  section_name: string;

  @IsString()
  @IsNotEmpty()
  section_code: string;

  @IsString()
  @IsOptional()
  substation_name?: string;

  @IsString()
  @IsOptional()
  service_number_from?: string;

  @IsString()
  @IsOptional()
  service_number_to?: string;

  @IsNumber()
  @IsOptional()
  gps_center_lat?: number;

  @IsNumber()
  @IsOptional()
  gps_center_lng?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
