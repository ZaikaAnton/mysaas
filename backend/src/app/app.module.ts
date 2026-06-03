import { Module } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { TelegramModule } from '../telegram/telegram.module';
import { APP_PIPE } from '@nestjs/core';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TelegramBotModule, TelegramModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
