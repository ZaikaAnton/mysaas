import { TELEGRAM_TEXT } from '../constants/telegram-bot.constants';

export function mainKeyboard() {
  return {
    keyboard: [[{ text: TELEGRAM_TEXT.BUTTONS.START }, { text: TELEGRAM_TEXT.BUTTONS.HELP }]],
    resize_keyboard: true,
    persistent: true,
  };
}
