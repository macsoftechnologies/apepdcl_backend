// src/config/seeder.service.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Designation } from '../staff/entities/designation.entity';
import { StaffUser } from '../staff/entities/staff-user.entity';
import { Permission } from '../staff/entities/permission.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Designation)
    private designationRepo: Repository<Designation>,
    @InjectRepository(StaffUser)
    private staffRepo: Repository<StaffUser>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedPermissions();
    await this.seedDesignations();
    await this.seedSuperAdmin();
  }

  private async seedPermissions() {
    const permissions = [
      { permission_key: 'VIEW_COMPLAINTS', description: 'Can view complaints in their jurisdiction' },
      { permission_key: 'EDIT_COMPLAINTS', description: 'Can update complaint status' },
      { permission_key: 'MANAGE_STAFF', description: 'Can create and manage staff' },
      { permission_key: 'VIEW_DASHBOARD', description: 'Can view analytics dashboard' },
      { permission_key: 'MANAGE_GEOGRAPHY', description: 'Can manage geography settings' },
      { permission_key: 'VIEW_ASSIGNED_COMPLAINTS', description: 'Can view assigned complaints (Lineman)' },
      { permission_key: 'UPDATE_COMPLAINT_STATUS', description: 'Can update complaint status to working/resolved (Lineman)' },
      { permission_key: 'UPLOAD_RESOLUTION_PHOTO', description: 'Can upload resolution photo (Lineman)' },
      { permission_key: 'ASSIGN_LINEMAN', description: 'Can assign lineman to complaint (AE/AEE)' },
    ];

    for (const p of permissions) {
      const exists = await this.permissionRepo.findOne({ where: { permission_key: p.permission_key } });
      if (!exists) {
        await this.permissionRepo.save(p);
      }
    }
    console.log('✅ Permissions seeded');
  }

  private async seedDesignations() {
    const designations = [
      {
        title: 'System Admin',
        role_level: 6,
        description: 'Full system access',
      },
      {
        title: 'SE',
        role_level: 5,
        description: 'Superintending Engineer - Circle level',
      },
      {
        title: 'DE/EE',
        role_level: 4,
        description: 'Divisional/Executive Engineer',
      },
      {
        title: 'Dy.EE',
        role_level: 3,
        description: 'Deputy Executive Engineer',
      },
      { title: 'AE/AEE', role_level: 2, description: 'Assistant Engineer' },
      { title: 'Lineman', role_level: 1, description: 'Field worker' },
    ];

    for (const d of designations) {
      const exists = await this.designationRepo.findOne({
        where: { title: d.title },
      });
      if (!exists) {
        await this.designationRepo.save(d);
      }
    }
    console.log('✅ Designations seeded');
  }

  private async seedSuperAdmin() {
    const email =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@example.com';
    const exists = await this.staffRepo.findOne({ where: { email } });

    if (exists) {
      if (!exists.phone_number) {
        exists.phone_number = this.configService.get<string>('ADMIN_PHONE') || '9999999999';
        await this.staffRepo.save(exists);
        console.log(`✅ Super Admin phone number updated to: ${exists.phone_number}`);
      }
    } else {
      const adminDesignation = await this.designationRepo.findOne({
        where: { title: 'System Admin' },
      });

      const password_hash = await bcrypt.hash(
        this.configService.get<string>('ADMIN_PASSWORD') || 'password',
        10,
      );

      await this.staffRepo.save({
        email,
        phone_number: this.configService.get<string>('ADMIN_PHONE') || '9999999999',
        password_hash,
        full_name: 'Super Admin',
        designation_id: adminDesignation!.designation_id,
        is_super_admin: true,
        is_active: true,
      });
      console.log('✅ Super Admin seeded');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${this.configService.get('ADMIN_PASSWORD')}`);
    }
  }
}
