import { Injectable, OnApplicationBootstrap, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { StartHandler } from './handlers/start.handler';
import { HelpHandler } from './handlers/help.handler';
import { MenuHandler } from './handlers/menu.handler';

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
  private bot?: Bot;
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly startHandler: StartHandler,
    private readonly helpHandler: HelpHandler,
    private readonly menuHandler: MenuHandler,
  ) {}

  onApplicationBootstrap() {
    const token = this.configService.get<string>('TG_BOT_TOKEN');
    if (!token) return;

    this.bot = new Bot(token);

    void this.configureMenuButton();
    this.registerHandlers();

    this.bot
      .start()
      .then(() => this.logger.log('Telegram bot started'))
      .catch((e) => this.logger.error(e));
  }

  private async configureMenuButton() {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL');
    if (!webAppUrl || !this.bot) return;

    await this.bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'Открыть приложение',
        web_app: { url: webAppUrl },
      },
    });
  }

  private registerHandlers() {
    if (!this.bot) return;

    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));
    this.bot.command('help', (ctx) => this.helpHandler.handle(ctx));

    this.bot.hears('🚀 Запустить', (ctx) => this.startHandler.handleButton(ctx));
    this.bot.hears('❓ Помощь', (ctx) => this.helpHandler.handleButton(ctx));

    this.bot.on('message', (ctx) => this.menuHandler.fallback(ctx));
  }

  async onModuleDestroy() {
    await this.bot?.stop();
  }
}
