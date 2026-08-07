import { Module } from '@nestjs/common';
import { CircleService } from './circle.service';
import { CircleController } from './circle.controller';
import { DivisionService } from './division.service';
import { DivisionController } from './division.controller';
import { SubdivisionService } from './subdivision.service';
import { SubdivisionController } from './subdivision.controller';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from './entities/circle.entity';
import { Division } from './entities/division.entity';
import { SubDivision } from './entities/subdivision.entity';
import { Section } from './entities/section.entity';
import { DropdownsService } from './dropdowns.service';
import { DropdownsController } from './dropdowns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Division, SubDivision, Section])],
  providers: [
    CircleService,
    DivisionService,
    SubdivisionService,
    SectionService,
    DropdownsService,
  ],
  controllers: [
    CircleController,
    DivisionController,
    SubdivisionController,
    SectionController,
    DropdownsController,
  ],
})
export class GeographyModule {}
