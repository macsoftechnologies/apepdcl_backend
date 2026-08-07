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
import { SubdivisionService } from './subdivision.service';
import { SubdivisionPaginationDto } from './dto/subdivision-pagination.dto';
import { CreateSubdivisionDto } from './dto/create-subdivision.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Geography - Subdivisions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('geography/subdivision')
export class SubdivisionController {
  constructor(private readonly subdivService: SubdivisionService) {}

  @Post()
  create(@Body() createDto: CreateSubdivisionDto) {
    return this.subdivService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: SubdivisionPaginationDto) {
    return this.subdivService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subdivService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateSubdivisionDto>,
  ) {
    return this.subdivService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subdivService.remove(+id);
  }
}
