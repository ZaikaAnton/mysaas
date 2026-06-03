import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';
import { TELEGRAM_TEXT } from '../constants/telegram-bot.constants';
import { mainKeyboard } from '../keyboards/telegram-bot.keyboards';

@Injectable()
export class HelpHandler {
  async handle(ctx: Context) {
    return ctx.reply(TELEGRAM_TEXT.HELP, {
      reply_markup: mainKeyboard(),
    });
  }

  async handleButton(ctx: Context) {
    return ctx.reply(TELEGRAM_TEXT.HELP, {
      reply_markup: mainKeyboard(),
    });
  }
}
