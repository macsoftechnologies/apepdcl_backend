// src/geography/entities/section.entity.ts
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
import { SubDivision } from './subdivision.entity';
import { Consumer } from '../../complaints/entities/consumer.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn()
  section_id: number;

  @Column()
  subdivision_id: number;

  @Column()
  section_name: string;

  @Column({ unique: true })
  section_code: string;

  @Column({ nullable: true })
  substation_name: string;

  // Service number range — admin sets this
  @Column({ type: 'varchar', length: 16, nullable: true })
  service_number_from: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  service_number_to: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_center_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  gps_center_lng: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => SubDivision, (sub) => sub.sections)
  @JoinColumn({ name: 'subdivision_id' })
  subdivision: SubDivision;

  @OneToMany(() => Consumer, (consumer) => consumer.section)
  consumers: Consumer[];
}
