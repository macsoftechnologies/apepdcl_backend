import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private settingRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    await this.initDefaultSettings();
  }

  private async initDefaultSettings() {
    const defaults = [
      {
        setting_key: 'escalation_time_minutes',
        setting_value: '240', // 4 hours default
        description: 'Time in minutes before an assigned ticket is escalated back to the AE',
      }
    ];

    for (const s of defaults) {
      const exists = await this.settingRepo.findOne({ where: { setting_key: s.setting_key } });
      if (!exists) {
        await this.settingRepo.save(s);
      }
    }
  }

  async getSetting(key: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { setting_key: key } });
    return setting?.setting_value || '';
  }

  async getAllSettings() {
    return this.settingRepo.find();
  }

  async updateSetting(key: string, value: string) {
    const setting = await this.settingRepo.findOne({ where: { setting_key: key } });
    if (setting) {
      setting.setting_value = value;
      return this.settingRepo.save(setting);
    }
    return null;
  }
}
