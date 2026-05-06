import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { MessageResponseDto, QueryGetMessagesDto } from './dto/get-messages.dto';
import { ChannelResponseDto, QuerySearchChannelsDto } from './dto/search-channels-by-keyword.dto';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Получить сообщения канала за период' })
  @ApiOkResponse({
    description: 'Список сообщений',
    type: [MessageResponseDto],
  })
  async getMessagesInRange(@Query() query: QueryGetMessagesDto): Promise<MessageResponseDto[]> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const messages = await this.telegramService.getMessagesInDateRange(
      query.channel,
      startDate,
      endDate,
      query.searchWord,
    );

    const response = messages.map((msg) => ({
      id: msg.id,
      date: new Date(msg.date * 1000).toISOString(),
      message: msg.message,
      hasMedia: !!msg.media,
    }));

    return response;
  }

  @Get('channels/search')
  @ApiOperation({ summary: 'Найти каналы по ключевому слову в постах' })
  @ApiOkResponse({
    description: 'Список каналов, где встречается ключевое слово',
    type: [ChannelResponseDto],
  })
  async searchChannelsByKeyword(
    @Query() query: QuerySearchChannelsDto,
  ): Promise<ChannelResponseDto[]> {
    return this.telegramService.searchChannelsByKeyword(query.keyword, query.limit);
  }
}
