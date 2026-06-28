import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UpdateProfileDto, ChangePasswordDto, UpdatePreferencesDto } from './dto/user.dto';
import { EmailService } from '../email/email.service';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepo: Repository<UserPreferences>,
    private readonly emailService: EmailService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepo.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException('El email ya está en uso');
      user.email = dto.email;
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;

    await this.userRepo.save(user);

    return this.toProfile(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    let prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.preferencesRepo.create({ userId, budgetAutomation: true });
      await this.preferencesRepo.save(prefs);
    }
    return prefs;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferences> {
    let prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.preferencesRepo.create({ userId, budgetAutomation: true });
    }
    if (dto.budgetAutomation !== undefined) {
      prefs.budgetAutomation = dto.budgetAutomation;
    }
    return this.preferencesRepo.save(prefs);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.isActive = false;
    await this.userRepo.save(user);
  }

  async sendInvite(fromUserId: string, toEmail: string): Promise<void> {
    const sender = await this.userRepo.findOne({ where: { id: fromUserId, isActive: true } });
    if (!sender) throw new NotFoundException('Usuario no encontrado');

    const senderName = `${sender.firstName} ${sender.lastName}`.trim() || sender.email;

    await this.emailService.send('invite-friend', toEmail, { senderName });
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
