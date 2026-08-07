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

  @Get('tree')
  getGeographyTree(@Query('level') level: string, @Query('id') id: string) {
    return this.dropdownsService.getGeographyTree(level, Number(id));
  }

  @Get('node-details')
  getNodeDetails(@Query('level') level: string, @Query('id') id: string) {
    return this.dropdownsService.getNodeDetails(level, Number(id));
  }
}
