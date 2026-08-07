// src/staff/entities/designation.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { StaffUser } from './staff-user.entity';

@Entity('designations')
export class Designation {
  @PrimaryGeneratedColumn()
  designation_id: number;

  @Column({ unique: true })
  title: string; // SE, DE, Dy.EE, AE, AEE, System Admin

  @Column()
  role_level: number; // 1=Lineman, 2=AE/AEE, 3=Dy.EE, 4=DE/EE, 5=SE, 6=Admin

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => StaffUser, (staff) => staff.designation)
  staff: StaffUser[];
}
