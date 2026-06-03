import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';
import { TELEGRAM_TEXT } from '../constants/telegram-bot.constants';
import { mainKeyboard } from '../keyboards/telegram-bot.keyboards';

@Injectable()
export class StartHandler {
  async handle(ctx: Context) {
    return ctx.reply(TELEGRAM_TEXT.START, {
      reply_markup: mainKeyboard(),
    });
  }

  async handleButton(ctx: Context) {
    return ctx.reply('Бот активирован 🚀', {
      reply_markup: mainKeyboard(),
    });
  }
}
