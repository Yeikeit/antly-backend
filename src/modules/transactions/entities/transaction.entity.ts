import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Budget } from '../../budgets/entities/budget.entity';
import { Category } from '../../categories/entities/category.entity';


export type TransactionType = 'EXPENSE' | 'INCOME' | 'SAVING';

@Entity('transactions')
@Index(['userId', 'transactionDate'])
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'budget_id' })
    budgetId: string;

    // budget_id es obligatorio — toda transacción pertenece a un presupuesto mensual
    @ManyToOne(() => Budget, (b) => b.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'budget_id' })
    budget: Budget;

    @Column({ name: 'category_id' })
    categoryId: string;

    @ManyToOne(() => Category, { onDelete: 'RESTRICT', eager: true })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ type: 'numeric', precision: 14, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 20 })
    type: TransactionType; // EXPENSE | INCOME | SAVING

    @Column({ name: 'transaction_date', type: 'date' })
    transactionDate: string; // 'YYYY-MM-DD'

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
