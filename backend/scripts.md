# NPM Scripts Documentation

## Build & Run

- `npm run build` - Компилирует TypeScript в JavaScript (папка dist/)
- `npm run start` - Запускает приложение
- `npm run start:dev` - Запуск с hot-reload (разработка)
- `npm run start:debug` - Запуск с отладчиком
- `npm run start:prod` - Запуск production версии
- `npm run format` - Форматирует код через Prettier
- `npm run lint` - Проверяет и исправляет код через ESLint

## Tests

- `npm run test` - Запуск unit-тестов
- `npm run test:watch` - Тесты в режиме watch
- `npm run test:cov` - Тесты с покрытием кода
- `npm run test:debug` - Тесты в режиме отладки
- `npm run test:e2e` - End-to-end тесты

## Docker (PostgreSQL)

- `npm run docker:up` - Запуск PostgreSQL в фоне
- `npm run docker:down` - Остановка и удаление контейнера
- `npm run docker:restart` - Перезапуск контейнера
- `npm run docker:logs` - Просмотр логов в реальном времени
- `npm run docker:rebuild` - Полная пересборка образа

## Prisma (Database)

- `npm run prisma:generate` - Генерация Prisma Client из схемы
- `npm run prisma:studio` - Открытие веб-интерфейса для данных
- `npm run prisma:migrate:dev` - Создание новой миграции (добавьте --name)
- `npm run prisma:db:push` - Синхронизация схемы без миграций
- `npm run prisma:db:reset` - Полный сброс базы данных
- `npm run prisma:db:seed` - Заполнение тестовыми данными

## Typical Workflow

### First setup

```bash
npm run docker:up           # Start PostgreSQL
npm run prisma:generate     # Generate Prisma Client
npm run prisma:db:push      # Create tables
npm run start:dev           # Start app
```
