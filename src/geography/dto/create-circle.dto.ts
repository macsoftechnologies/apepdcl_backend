import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateCircleDto {
  @IsString()
  @IsNotEmpty()
  circle_name: string;

  @IsString()
  @IsNotEmpty()
  circle_code: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
