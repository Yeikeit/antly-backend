import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { User } from '../../users/entities/user.entity';

export type ChangeType = 'REALLOCATION' | 'AMOUNT_UPDATE' | 'STATUS_CHANGE';

@Entity('budget_change_logs')
export class BudgetChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_id' })
  budgetId: string;

  @ManyToOne(() => Budget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'changed_by_user_id' })
  changedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser: User;

  @Column({ name: 'change_type', type: 'varchar', length: 50 })
  changeType: ChangeType;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
