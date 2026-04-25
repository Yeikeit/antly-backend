import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, OneToMany, JoinColumn,
    CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BudgetAllocation } from '../../budget-allocations/entities/budget-allocation.entity';
import { Income } from '../../incomes/entities/income.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';


export type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

@Entity('budgets')
@Unique(['userId', 'year', 'month'])
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'int' })
    month: number; // 1-12

    @Column({ name: 'total_income_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
    totalIncomeAmount: number;

    @Column({ name: 'total_allocated_amount', type: 'numeric', precision: 14, scale: 2, default: 0 })
    totalAllocatedAmount: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
    status: BudgetStatus;

    @OneToMany(() => BudgetAllocation, (a) => a.budget, { cascade: true })
    allocations: BudgetAllocation[];

    @OneToMany(() => Income, (i) => i.budget)
    incomes: Income[];

    @OneToMany(() => Transaction, (t) => t.budget)
    transactions: Transaction[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
