import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JurisdictionService } from './jurisdiction.service';
import { AssignJurisdictionDto } from './dto/assign-jurisdiction.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Jurisdictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('staff/jurisdiction')
export class JurisdictionController {
  constructor(private readonly jurisdictionService: JurisdictionService) {}

  @Post()
  assign(@Body() assignDto: AssignJurisdictionDto) {
    return this.jurisdictionService.assignJurisdiction(assignDto);
  }

  @Get('staff/:staffId')
  getByStaff(@Param('staffId') staffId: string) {
    return this.jurisdictionService.getStaffJurisdictions(+staffId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jurisdictionService.removeJurisdiction(+id);
  }
}
