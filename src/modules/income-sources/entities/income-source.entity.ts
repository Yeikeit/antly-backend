import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('income_sources')
@Unique(['userId', 'name'])
export class IncomeSource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 100 })
    name: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
