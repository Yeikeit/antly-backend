import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, OneToMany, JoinColumn,
    CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


export type CategoryType = 'EXPENSE' | 'SAVING' | 'INCOME';
export type SourceType = 'DEFAULT' | 'CUSTOM';

@Entity('categories')
@Unique(['userId', 'parentId', 'name'])
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // Referencia a sí misma para jerarquía
    @Column({ name: 'parent_id', nullable: true })
    parentId: string | null;

    @ManyToOne(() => Category, (c) => c.children, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent: Category;

    @OneToMany(() => Category, (c) => c.parent)
    children: Category[];

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'int' })
    level: 1 | 2; // 1 = categoría raíz, 2 = subcategoría

    @Column({ type: 'varchar', length: 20 })
    type: CategoryType; // EXPENSE | SAVING | INCOME

    @Column({ name: 'source_type', type: 'varchar', length: 20, default: 'CUSTOM' })
    sourceType: SourceType; // DEFAULT = precargada, CUSTOM = creada por usuario

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
