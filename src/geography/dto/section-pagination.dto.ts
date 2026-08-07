import { PaginationDto } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class SectionPaginationDto extends PaginationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  subdivision_id?: number;
}
