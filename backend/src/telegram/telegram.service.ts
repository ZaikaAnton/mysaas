import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

type ChannelSearchResult = {
  id: string;
  title: string;
  username?: string;
};

@Injectable()
export class TelegramService implements OnModuleInit {
  private static readonly PAGE_SIZE = 100;
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
  // Сервисный метод для получения сообщений из канала за период + поиск по слову
  async getMessagesInDateRange(
    channelUsername: string,
    startDate: Date,
    endDate: Date,
    searchWord: string,
  ): Promise<Api.Message[]> {
    const client = this.getClient();
    const entity = await client.getEntity(channelUsername);
    this.validateDateRange(startDate, endDate);
    const dateRange = this.normalizeDateRange(startDate, endDate);
    const normalizedSearchWord = searchWord.trim().toLowerCase();
    const collectedMessages: Api.Message[] = [];
    let offsetId = 0;
    let isFirstRequest = true;
    let reachedOldMessages = false;

    this.logDateRangeRequest(channelUsername, dateRange.start, dateRange.end);

    while (!reachedOldMessages) {
      const messages = await this.fetchMessageBatch(client, entity, {
        offsetId,
        isFirstRequest,
        end: dateRange.end,
      });

      isFirstRequest = false;

      if (messages.length === 0) break;

      reachedOldMessages = this.collectMessagesInRange(
        messages,
        dateRange.startMs,
        collectedMessages,
        normalizedSearchWord,
      );

      if (!reachedOldMessages) {
        const nextOffsetId = this.getNextOffsetId(messages);
        if (nextOffsetId === null) break;
        offsetId = nextOffsetId;
      }
    }

    this.logger.log(`✅ Найдено ${collectedMessages.length} сообщений`);
    return collectedMessages;
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Invalid date range: startDate or endDate is not a valid date');
    }

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('Invalid date range: startDate must be before or equal to endDate');
    }
  }

  private normalizeDateRange(
    startDate: Date,
    endDate: Date,
  ): {
    start: Date;
    end: Date;
    startMs: number;
  } {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      startMs: start.getTime(),
    };
  }

  private logDateRangeRequest(channelUsername: string, start: Date, end: Date): void {
    this.logger.log(
      `📆 Запрашиваю сообщения из @${channelUsername} с ${start.toISOString()} по ${end.toISOString()}`,
    );
  }

  private async fetchMessageBatch(
    client: TelegramClient,
    entity: Parameters<TelegramClient['getMessages']>[0],
    params: { offsetId: number; isFirstRequest: boolean; end: Date },
  ): Promise<Api.Message[]> {
    return (await client.getMessages(entity, {
      limit: TelegramService.PAGE_SIZE,
      offsetId: params.offsetId,
      ...(params.isFirstRequest && {
        offsetDate: Math.floor(params.end.getTime() / 1000),
      }),
    })) as Api.Message[];
  }

  private collectMessagesInRange(
    messages: Api.Message[],
    startMs: number,
    collectedMessages: Api.Message[],
    searchWord?: string,
  ): boolean {
    for (const msg of messages) {
      if (!msg.date) continue;

      const msgMs = msg.date * 1000;
      if (msgMs < startMs) {
        return true;
      }

      if (this.matchesSearchWord(msg, searchWord)) {
        collectedMessages.push(msg);
      }
    }

    return false;
  }

  private getNextOffsetId(messages: Api.Message[]): number | null {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.id) {
      return null;
    }

    return lastMsg.id - 1;
  }

  private matchesSearchWord(message: Api.Message, searchWord?: string): boolean {
    if (!searchWord) {
      return true;
    }

    const text = message.message?.toLowerCase();
    if (!text) {
      return false;
    }

    return text.includes(searchWord);
  }

  async searchChannelsByKeyword(keyword: string, limit = 200): Promise<ChannelSearchResult[]> {
    const client = this.getClient();
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return [];
    }

    this.logger.log(`🔎 searchGlobal channels by keyword: "${normalizedKeyword}"`);

    let result: Api.messages.TypeMessages;
    try {
      result = await client.invoke(
        new Api.messages.SearchGlobal({
          q: normalizedKeyword,
          offsetPeer: new Api.InputPeerEmpty(),
          offsetId: 0,
          offsetRate: 0,
          filter: new Api.InputMessagesFilterEmpty(),
          limit,
          minDate: 0,
          maxDate: 0,
        }),
      );
    } catch (error) {
      this.logger.error(`❌ Ошибка SearchGlobal по ключу "${normalizedKeyword}"`, error);
      return [];
    }

    if (result instanceof Api.messages.MessagesNotModified) {
      this.logger.log('✅ Найдено каналов: 0');
      return [];
    }

    const channelsMap = new Map<string, ChannelSearchResult>();
    const chats = result.chats;

    for (const chat of chats) {
      if (chat.className !== 'Channel') continue;

      const id = chat.id.toString();
      const username = typeof chat.username === 'string' ? chat.username : undefined;

      channelsMap.set(id, {
        id,
        title: chat.title,
        username,
      });
    }

    const channels = Array.from(channelsMap.values());
    this.logger.log(`✅ Найдено каналов: ${channels.length}`);
    return channels;
  }
}
