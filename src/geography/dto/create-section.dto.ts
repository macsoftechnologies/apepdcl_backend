import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  IsNumber,
  Length,
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
  @Length(16, 16, { message: 'Service number must be exactly 16 digits' })
  service_number_from?: string;

  @IsString()
  @IsOptional()
  @Length(16, 16, { message: 'Service number must be exactly 16 digits' })
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
