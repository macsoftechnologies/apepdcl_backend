// src/geography/entities/circle.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Division } from './division.entity';

@Entity('circles')
export class Circle {
  @PrimaryGeneratedColumn()
  circle_id: number;

  @Column({ unique: true })
  circle_name: string;

  @Column({ unique: true })
  circle_code: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Division, (division) => division.circle)
  divisions: Division[];
}
