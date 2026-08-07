import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Staff - Settings')
@ApiBearerAuth()
@UseGuards(StaffAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch()
  updateSetting(@Body('key') key: string, @Body('value') value: string) {
    return this.settingsService.updateSetting(key, value);
  }
}
