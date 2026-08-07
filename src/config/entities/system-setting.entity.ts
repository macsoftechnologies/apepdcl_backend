import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn()
  setting_key: string;

  @Column()
  setting_value: string;

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn()
  updated_at: Date;
}
