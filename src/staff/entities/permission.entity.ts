import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  permission_key: string;

  @Column()
  description: string;
}
