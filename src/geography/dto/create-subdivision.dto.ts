import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateSubdivisionDto {
  @IsInt()
  @IsNotEmpty()
  division_id: number;

  @IsString()
  @IsNotEmpty()
  subdivision_name: string;

  @IsString()
  @IsNotEmpty()
  subdivision_code: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
