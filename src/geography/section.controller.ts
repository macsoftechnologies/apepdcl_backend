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
import { SectionService } from './section.service';
import { SectionPaginationDto } from './dto/section-pagination.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Geography - Sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('geography/section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  create(@Body() createDto: CreateSectionDto) {
    return this.sectionService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: SectionPaginationDto) {
    return this.sectionService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateSectionDto>,
  ) {
    return this.sectionService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionService.remove(+id);
  }
}
