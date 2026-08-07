import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CircleService } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Geography - Circles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('geography/circle')
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Post()
  create(@Body() createCircleDto: CreateCircleDto) {
    return this.circleService.create(createCircleDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.circleService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.circleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCircleDto: Partial<CreateCircleDto>,
  ) {
    return this.circleService.update(+id, updateCircleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.circleService.remove(+id);
  }
}
