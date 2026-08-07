import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConsumerComplaintsService } from './complaints.service';
import { CreateConsumerComplaintDto } from './dto/create-consumer-complaint.dto';
import { ConsumerAuthGuard } from '../common/guards/consumer-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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

  @Get()
  findAllMyComplaints(@Request() req: any) {
    return this.complaintsService.findAllMyComplaints(req.user.consumer_id);
  }

  @Get(':id')
  findOneMyComplaint(@Param('id') id: string, @Request() req: any) {
    return this.complaintsService.findOneMyComplaint(req.user.consumer_id, +id);
  }
}
