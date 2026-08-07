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
import { StaffService, StaffPaginationDto } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Staff - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@Body() createDto: CreateStaffDto) {
    return this.staffService.create(createDto);
  }

  @Get()
  findAll(@Query() paginationDto: StaffPaginationDto) {
    return this.staffService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateStaffDto) {
    return this.staffService.update(+id, updateDto);
  }

  @Patch(':id/toggle-status')
  toggleActive(@Param('id') id: string) {
    return this.staffService.toggleActive(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(+id);
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.staffService.resetPassword(+id, password);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id') id: string) {
    return this.staffService.getPermissions(+id);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.staffService.updatePermissions(+id, permissions);
  }
}
