import { Module } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { DesignationController } from './designation.controller';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { JurisdictionService } from './jurisdiction.service';
import { JurisdictionController } from './jurisdiction.controller';
import { HierarchyService } from './hierarchy.service';
import { HierarchyController } from './hierarchy.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffUser } from './entities/staff-user.entity';
import { Designation } from './entities/designation.entity';
import { StaffJurisdiction } from './entities/staff-jurisdiction.entity';
import { Circle } from '../geography/entities/circle.entity';
import { Division } from '../geography/entities/division.entity';
import { SubDivision } from '../geography/entities/subdivision.entity';
import { Section } from '../geography/entities/section.entity';
import { Permission } from './entities/permission.entity';
import { StaffPermission } from './entities/staff-permission.entity';
import { LinemanDetails } from './entities/lineman-details.entity';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthService } from './staff-auth.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { StaffLinemenController } from './staff-linemen.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffUser, Designation, StaffJurisdiction,
      Circle, Division, SubDivision, Section,
      Permission, StaffPermission, LinemanDetails
    ]),
    AuthModule,
  ],
  providers: [DesignationService, StaffService, JurisdictionService, StaffAuthService, PermissionsGuard, HierarchyService],
  controllers: [StaffLinemenController, DesignationController, HierarchyController, StaffController, JurisdictionController, StaffAuthController],
  exports: [StaffService, StaffAuthService, PermissionsGuard, TypeOrmModule],
})
export class StaffModule {}
