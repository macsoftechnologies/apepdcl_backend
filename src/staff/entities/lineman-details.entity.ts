import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StaffUser } from './staff-user.entity';
import { Section } from '../../geography/entities/section.entity';

export enum LinemanStatus {
  AVAILABLE = 'Available',
  ON_DUTY = 'On Duty',
  LEAVE = 'Leave',
}

@Entity('linemen_details')
export class LinemanDetails {
  @PrimaryGeneratedColumn()
  lineman_id: number;

  @Column()
  staff_id: number;

  @Column({ nullable: true })
  section_id: number;

  @Column({
    type: 'enum',
    enum: LinemanStatus,
    default: LinemanStatus.AVAILABLE,
  })
  current_status: LinemanStatus;

  @Column({ nullable: true })
  assigned_area: string;

  @OneToOne(() => StaffUser, (staff) => staff.lineman_details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: StaffUser;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
