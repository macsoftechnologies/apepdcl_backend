import { IsInt, IsNotEmpty, IsEnum } from 'class-validator';
import { JurisdictionLevel } from '../entities/staff-jurisdiction.entity';

export class AssignJurisdictionDto {
  @IsInt()
  @IsNotEmpty()
  staff_id: number;

  @IsEnum(JurisdictionLevel)
  @IsNotEmpty()
  jurisdiction_level: JurisdictionLevel;

  @IsInt()
  @IsNotEmpty()
  jurisdiction_id: number;
}
