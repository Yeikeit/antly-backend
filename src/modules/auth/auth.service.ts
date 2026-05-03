import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Category } from '../categories/entities/category.entity';
import { CATEGORY_TEMPLATE } from '../categories/utils/category-template';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    await this.userRepository.save(user);
    await this.seedDefaultCategories(user.id);

    return this.buildTokenResponse(user);
  }

  private async seedDefaultCategories(userId: string): Promise<void> {
    const categories: Partial<Category>[] = [];

    for (const template of CATEGORY_TEMPLATE) {
      const parent = this.categoryRepository.create({
        userId,
        parentId: null,
        name: template.name,
        level: 1,
        type: template.type,
        sourceType: 'DEFAULT',
        sortOrder: template.sortOrder,
      });
      const savedParent = await this.categoryRepository.save(parent);

      for (const sub of template.subcategories) {
        categories.push({
          userId,
          parentId: savedParent.id,
          name: sub.name,
          level: 2,
          type: sub.type,
          sourceType: 'DEFAULT',
          sortOrder: sub.sortOrder,
        });
      }
    }

    if (categories.length > 0) {
      await this.categoryRepository.save(
        categories.map((c) => this.categoryRepository.create(c)),
      );
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildTokenResponse(user);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: ['user'],
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return { accessToken: this.signAccessToken(stored.user) };
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId, isActive: true } });
  }

  private async buildTokenResponse(user: User) {
    const accessToken = this.signAccessToken(user);
    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    const days = this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS') ?? 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
