import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

@Injectable()
export class TelegramService implements OnModuleInit {
  private client?: TelegramClient;
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    console.log('🟢 onModuleInit started');
    await this.initClient();
    console.log('🟢 initClient completed');
  }

  private async initClient(): Promise<void> {
    const apiId = Number(this.configService.get<string>('TELEGRAM_API_ID'));
    const apiHash = this.configService.get<string>('TELEGRAM_API_HASH');
    const phoneNumber = this.configService.get<string>('TELEGRAM_PHONE');
    const sessionString = this.configService.get<string>('TELEGRAM_SESSION') ?? '';

    if (!apiId || !apiHash || !phoneNumber) {
      throw new Error('❌ TELEGRAM_API_ID, TELEGRAM_API_HASH или TELEGRAM_PHONE не заданы в .env');
    }

    const stringSession = new StringSession(sessionString);
    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      useWSS: true,
      useIPV6: false,
    });

    await this.client.start({
      phoneNumber: phoneNumber,
      password: async () => await input.text('🔐 Введите пароль 2FA (если нет — Enter): '),
      phoneCode: async () => await input.text('📱 Введите код из Telegram: '),
      onError: (err) => this.logger.error('Ошибка авторизации', err),
    });

    const newSession = String(this.client.session.save());
    this.logger.log('✅ Авторизация успешна!');
    this.logger.log('📌 Скопируйте строку ниже и добавьте в .env как TELEGRAM_SESSION:');
    this.logger.log(newSession);

    const me = await this.client.getMe();
    this.logger.log(`👤 Подключены как: ${me.firstName} (@${me.username})`);
  }

  getClient(): TelegramClient {
    if (!this.client) {
      throw new Error('Telegram client not initialized yet');
    }
    return this.client;
  }

  // async getChannelInfo(username: string) {
  //   const client = this.getClient();
  //   try {
  //     const entity = await client.getEntity(username);
  //     this.logger.log(`ℹ️ Информация о канале @${username} успешно получена`);
  //     return entity;
  //   } catch (error) {
  //     this.logger.error(`Ошибка при получении информации о канале @${username}`, error);
  //     throw error;
  //   }
  // }

  /**
   * Получить все сообщения канала за указанный период (по дате публикации)
   * @param channelUsername - юзернейм канала (например, 'kaliningradtop')
   * @param startDate - начало периода (включительно)
   * @param endDate - конец периода (включительно)
   * @returns массив сообщений Api.Message, попадающих в диапазон дат
   */
  async getMessagesInDateRange(
    channelUsername: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Api.Message[]> {
    const client = this.getClient();
    const entity = await client.getEntity(channelUsername);

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const collectedMessages: Api.Message[] = [];
    let offsetId = 0; // начинаем с самых новых
    const limit = 100; // за раз запрашиваем до 100 сообщений
    let reachedOldMessages = false;

    this.logger.log(
      `📆 Запрашиваю сообщения из @${channelUsername} с ${startDate.toLocaleString()} по ${endDate.toLocaleString()}`,
    );

    while (!reachedOldMessages) {
      const messages = (await client.getMessages(entity, {
        limit,
        offsetId,
      })) as Api.Message[];

      if (messages.length === 0) break;

      for (const msg of messages) {
        const msgDate = msg.date; // timestamp в секундах

        // Сообщения идут от новых к старым.
        // Если сообщение новее конца периода — пропускаем, но продолжаем (может дальше будут нужные)
        if (msgDate > endTimestamp) {
          continue;
        }

        // Если сообщение старше начала периода — все последующие будут ещё старше, можно останавливаться
        if (msgDate < startTimestamp) {
          reachedOldMessages = true;
          break;
        }

        // Сообщение попадает в период
        collectedMessages.push(msg);
      }

      // Если мы не дошли до старых сообщений, устанавливаем offsetId на id последнего сообщения в батче минус 1
      if (!reachedOldMessages) {
        const lastMsg = messages[messages.length - 1];
        offsetId = lastMsg.id - 1;
      }
    }

    this.logger.log(`✅ Найдено ${collectedMessages.length} сообщений в заданном диапазоне`);
    return collectedMessages;
  }
}
