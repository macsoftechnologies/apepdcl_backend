import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StaffUser } from './staff-user.entity';
import { Permission } from './permission.entity';

@Entity('staff_permissions')
export class StaffPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  staff_id: number;

  @Column({ type: 'varchar', length: 100 })
  permission_key: string;

  @ManyToOne(() => StaffUser)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffUser;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_key' })
  permission: Permission;
}
