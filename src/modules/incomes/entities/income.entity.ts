import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { IncomeSource } from '../../income-sources/entities/income-source.entity';
import { Budget } from '../../budgets/entities/budget.entity';

@Entity('incomes')
export class Income {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'income_source_id' })
    incomeSourceId: string;

    @ManyToOne(() => IncomeSource, { onDelete: 'RESTRICT', eager: true })
    @JoinColumn({ name: 'income_source_id' })
    incomeSource: IncomeSource;

    @Column({ name: 'budget_id' })
    budgetId: string;

    @ManyToOne(() => Budget, (b) => b.incomes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'budget_id' })
    budget: Budget;

    @Column({ type: 'numeric', precision: 14, scale: 2 })
    amount: number;

    @Column({ name: 'received_date', type: 'date' })
    receivedDate: string; // 'YYYY-MM-DD'

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
