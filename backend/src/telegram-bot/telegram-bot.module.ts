import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';
import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { MenuHandler } from './handlers/menu.handler';

@Module({
  providers: [TelegramBotService, StartHandler, HelpHandler, MenuHandler],
  controllers: [TelegramBotController],
})
export class TelegramBotModule {}
