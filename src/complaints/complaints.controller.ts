import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsPaginationDto } from './dto/complaints-pagination.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  findAll(@Query() paginationDto: ComplaintsPaginationDto) {
    return this.complaintsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateComplaintStatusDto,
    @Request() req: any,
  ) {
    return this.complaintsService.updateStatus(
      +id,
      updateDto,
      req.user?.staff_id,
    );
  }
}
