// src/geography/entities/subdivision.entity.ts
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
import { Division } from './division.entity';
import { Section } from './section.entity';

@Entity('subdivisions')
export class SubDivision {
  @PrimaryGeneratedColumn()
  subdivision_id: number;

  @Column()
  division_id: number;

  @Column({ unique: true })
  subdivision_name: string;

  @Column({ unique: true })
  subdivision_code: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Division, (division) => division.subdivisions)
  @JoinColumn({ name: 'division_id' })
  division: Division;

  @OneToMany(() => Section, (section) => section.subdivision)
  sections: Section[];
}
