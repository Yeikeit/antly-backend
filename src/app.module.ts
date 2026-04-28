import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/entities/user.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { MascotasModule } from './modules/mascotas/mascotas.module';
import { Mascota } from './modules/mascotas/entities/mascota.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: config.get<string>('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
        entities: [User, RefreshToken, Mascota],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    MascotasModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
