import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateDivisionDto {
  @IsInt()
  @IsNotEmpty()
  circle_id: number;

  @IsString()
  @IsNotEmpty()
  division_name: string;

  @IsString()
  @IsNotEmpty()
  division_code: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
