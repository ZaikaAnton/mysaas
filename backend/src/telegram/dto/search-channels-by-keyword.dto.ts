import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const QuerySearchChannelsSchema = z.object({
  keyword: z.string().min(1).describe('Ключевое слово для поиска по постам'),
  limit: z.coerce.number().int().min(1).max(500).default(200).describe('Лимит результатов'),
});

const ChannelResponseSchema = z.object({
  id: z.string().describe('Идентификатор Telegram-канала'),
  title: z.string().describe('Название канала'),
  username: z.string().optional().describe('Username канала'),
});

export class QuerySearchChannelsDto extends createZodDto(QuerySearchChannelsSchema) {}

export class ChannelResponseDto extends createZodDto(ChannelResponseSchema) {}
