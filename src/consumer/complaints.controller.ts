import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ConsumerComplaintsService } from './complaints.service';
import { CreateConsumerComplaintDto } from './dto/create-consumer-complaint.dto';
import { ConsumerAuthGuard } from '../common/guards/consumer-auth.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Consumer - Complaints')
@ApiBearerAuth()
@UseGuards(ConsumerAuthGuard)
@Controller('consumer/complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ConsumerComplaintsService) {}

  @Post()
  create(@Body() dto: CreateConsumerComplaintDto, @Request() req: any) {
    return this.complaintsService.create(req.user.consumer_id, dto);
  }

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAllMyComplaints(
    @Request() req: any, 
    @Query('page') page?: string, 
    @Query('limit') limit?: string
  ) {
    return this.complaintsService.findAllMyComplaints(
      req.user.consumer_id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Get(':id')
  findOneMyComplaint(@Param('id') id: string, @Request() req: any) {
    return this.complaintsService.findOneMyComplaint(req.user.consumer_id, +id);
  }
}
