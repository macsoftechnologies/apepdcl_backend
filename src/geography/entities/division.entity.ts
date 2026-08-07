// src/geography/entities/division.entity.ts
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
import { Circle } from './circle.entity';
import { SubDivision } from './subdivision.entity';

@Entity('divisions')
export class Division {
  @PrimaryGeneratedColumn()
  division_id: number;

  @Column()
  circle_id: number;

  @Column({ unique: true })
  division_name: string;

  @Column({ unique: true })
  division_code: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Circle, (circle) => circle.divisions)
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;

  @OneToMany(() => SubDivision, (sub) => sub.division)
  subdivisions: SubDivision[];
}
