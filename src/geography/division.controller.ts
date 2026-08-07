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
import { DivisionService } from './division.service';
import { DivisionPaginationDto } from './dto/division-pagination.dto';
import { CreateDivisionDto } from './dto/create-division.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Geography - Divisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('geography/division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Post()
  create(@Body() createDto: CreateDivisionDto) {
    return this.divisionService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: DivisionPaginationDto) {
    return this.divisionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.divisionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateDivisionDto>,
  ) {
    return this.divisionService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.divisionService.remove(+id);
  }
}
