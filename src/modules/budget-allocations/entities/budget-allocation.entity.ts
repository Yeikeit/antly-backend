import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { Budget } from '../../budgets/entities/budget.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('budget_allocations')
@Unique(['budgetId', 'categoryId'])
export class BudgetAllocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'budget_id' })
    budgetId: string;

    @ManyToOne(() => Budget, (b) => b.allocations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'budget_id' })
    budget: Budget;

    @Column({ name: 'category_id' })
    categoryId: string;

    @ManyToOne(() => Category, { onDelete: 'RESTRICT', eager: true })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ name: 'allocated_amount', type: 'numeric', precision: 14, scale: 2 })
    allocatedAmount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
