import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { MessageResponseDto, QueryGetMessagesDto } from './dto/getMessages.dto';

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
    );

    const response = messages.map((msg) => ({
      id: msg.id,
      date: new Date(msg.date * 1000).toISOString(),
      message: msg.message,
      hasMedia: !!msg.media,
    }));

    return response;
  }
}
