import { PaginationDto } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class SubdivisionPaginationDto extends PaginationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  division_id?: number;
}
