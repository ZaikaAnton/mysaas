import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';
import { mainKeyboard } from '../keyboards/telegram-bot.keyboards';

@Injectable()
export class MenuHandler {
  async fallback(ctx: Context) {
    return ctx.reply('Используйте кнопки ниже 👇', {
      reply_markup: mainKeyboard(),
    });
  }
}
