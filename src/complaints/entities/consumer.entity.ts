// src/complaints/entities/consumer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Section } from '../../geography/entities/section.entity';
import { Complaint } from './complaint.entity';

@Entity('consumers')
export class Consumer {
  @PrimaryGeneratedColumn()
  consumer_id: number;

  @Column({ unique: true })
  mobile_number: string;

  @Column()
  full_name: string;

  @Column({ unique: true })
  service_connection_number: string; // 16-digit

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_lng: number;

  @Column({ nullable: true })
  section_id: number; // auto assigned from service number range

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Section, (s) => s.consumers)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @OneToMany(() => Complaint, (c) => c.consumer)
  complaints: Complaint[];
}
