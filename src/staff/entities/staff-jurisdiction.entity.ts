// src/staff/entities/staff-jurisdiction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { StaffUser } from './staff-user.entity';

export enum JurisdictionLevel {
  CIRCLE = 'Circle',
  DIVISION = 'Division',
  SUBDIVISION = 'SubDivision',
  SECTION = 'Section',
}

@Entity('staff_jurisdictions')
export class StaffJurisdiction {
  @PrimaryGeneratedColumn()
  allocation_id: number;

  @Column()
  staff_id: number;

  @Column({ type: 'enum', enum: JurisdictionLevel })
  jurisdiction_level: JurisdictionLevel;

  @Column()
  jurisdiction_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => StaffUser, (s) => s.jurisdictions)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffUser;
}
