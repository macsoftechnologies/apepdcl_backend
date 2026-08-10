// src/complaints/entities/complaint.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Consumer } from './consumer.entity';
import { Section } from '../../geography/entities/section.entity';

export enum ComplaintStatus {
  RAISED = 'Raised',
  ASSIGNED = 'Assigned',
  WORKING = 'Working',
  RESOLVED = 'Resolved',
}

export enum ComplaintCategory {
  HOUSE_POWER = 'house-power',
  APARTMENT_POWER = 'apartment-power',
  MY_TRANSFORMER = 'my-transformer',
  STREET_NO_POWER = 'street-no-power',
  VILLAGE_NO_POWER = 'village-no-power',
  POLE_FALLEN = 'pole-fallen',
  POLE_ABOUT_TO_FALL = 'pole-about-to-fall',
  TRANSFORMER_BURNT = 'transformer-burnt',
  METER_BURNT = 'meter-burnt',
  METER_STUCK = 'meter-stuck',
  HIGH_POWER_BILL = 'high-power-bill',
  TREE_FALLEN = 'tree-fallen-no-power',
  TREE_ABOUT_TO_FALL = 'tree-about-to-fall',
  POLE_WIRE_FALLEN = 'pole-wire-fallen',
  METER_RUNNING_FAST = 'meter-running-fast',
  NEW_CONNECTION = 'new-connection',
  WIRES_HANGING = 'wires-hanging',
  METER_SHIFTING = 'meter-shifting',
  NAME_CHANGE = 'name-change',
  WRONG_BILL = 'wrong-bill',
  LOW_VOLTAGE = 'low-voltage',
  HIGH_VOLTAGE = 'high-voltage',
}

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn()
  complaint_id: number;

  @Column({ unique: true })
  ticket_number: string; // APD-2026-XXXXXX

  @Column()
  consumer_id: number;

  @Column()
  section_id: number;

  @Column({ type: 'enum', enum: ComplaintCategory })
  category_key: ComplaintCategory;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  photo_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_lng: number;

  @Column({ nullable: true })
  gps_address: string;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.RAISED,
  })
  status: ComplaintStatus;

  @Column({ type: 'int', nullable: true })
  assigned_lineman_id: number | null; // Phase 2

  @Column({ type: 'int', nullable: true })
  assigned_by: number | null; // Phase 2

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  assigned_at: Date | null;

  @Column({ nullable: true })
  working_at: Date;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  @Column({ nullable: true })
  resolution_photo_url: string;

  @ManyToOne(() => Consumer, (c) => c.complaints)
  @JoinColumn({ name: 'consumer_id' })
  consumer: Consumer;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne('LinemanDetails')
  @JoinColumn({ name: 'assigned_lineman_id', referencedColumnName: 'lineman_id' })
  assigned_lineman: any;
}
