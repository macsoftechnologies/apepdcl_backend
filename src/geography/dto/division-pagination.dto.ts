import { PaginationDto } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class DivisionPaginationDto extends PaginationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  circle_id?: number;
}
