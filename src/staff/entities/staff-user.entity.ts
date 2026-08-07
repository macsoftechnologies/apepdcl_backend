// src/staff/entities/staff-user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Designation } from './designation.entity';
import { StaffJurisdiction } from './staff-jurisdiction.entity';
import { LinemanDetails } from './lineman-details.entity';

@Entity('staff_users')
export class StaffUser {
  @PrimaryGeneratedColumn()
  staff_id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column()
  designation_id: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_super_admin: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Designation, (d) => d.staff)
  @JoinColumn({ name: 'designation_id' })
  designation: Designation;

  @OneToMany(() => StaffJurisdiction, (j) => j.staff)
  jurisdictions: StaffJurisdiction[];

  @OneToOne(() => LinemanDetails, (l) => l.staff, { cascade: true })
  lineman_details: LinemanDetails;
}
