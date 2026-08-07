import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DropdownsService } from './dropdowns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Geography Dropdowns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geography/dropdowns')
export class DropdownsController {
  constructor(private readonly dropdownsService: DropdownsService) {}

  @Get()
  getDropdowns(@Query() query: any) {
    return this.dropdownsService.getDropdowns(query);
  }
}
