import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StaffUser } from '../../staff/entities/staff-user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @Column()
  staff_id: number;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true })
  complaint_id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => StaffUser)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffUser;
}
