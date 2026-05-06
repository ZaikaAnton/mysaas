import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const QueryGetMessagesSchema = z
  .object({
    channel: z.string().min(1).describe('Username канала (например, "kaliningradtop")'),
    searchWord: z.string().min(1).describe('Слово для поиска'),
    startDate: z.string().date().describe('Начало периода'),
    endDate: z.string().date().describe('Конец периода'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return start <= end;
    },
    {
      message: 'startDate не может быть позже endDate',
      path: ['endDate'],
    },
  );

const MessageResponseSchema = z.object({
  id: z.number().describe('Уникальный идентификатор сообщения'),
  date: z.string().date().describe('Дата публикации сообщения'),
  message: z.string().describe('Текст сообщения'),
  hasMedia: z.boolean().describe('Флаг наличия медиа-вложений'),
});

export class QueryGetMessagesDto extends createZodDto(QueryGetMessagesSchema) {}

export class MessageResponseDto extends createZodDto(MessageResponseSchema) {}
