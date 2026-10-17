# CRM Calendar

Минималистичный прототип календаря для агентства недвижимости: обзор месяца, задачи без времени и почасовое расписание на сегодня.

## Стек

- Tailwind CSS v4 (browser build)
- Alpine.js v3
- Vanilla HTML, без сборщика

Откройте `index.html` через локальный HTTP-сервер. Данные демонстрационные; `app.js` генерирует события относительно текущей даты.

## Структура

- `index.html` — семантическая разметка и Tailwind-классы
- `app.js` — данные, фильтрация, календарная логика и действия Alpine
- `.prettierrc.json` — единые правила форматирования

## Размеры и цвета

Размеры основных областей задаются в `:root` через CSS custom properties: `--header-height`, `--today-panel-width`, `--calendar-min-width`, `--day-min-height`, `--panel-min-height`, `--hour-label-width`, `--hour-min-height`, `--event-dot-size`.

Цветовые точки событий — `--event-viewing`, `--event-call`, `--event-docs`, `--event-meeting`, `--event-reminder`. В разметке используются утилиты Tailwind v4, например `h-(--header-height)` и `size-(--event-dot-size)`.

## Форматирование и проверки

```bash
npm install
npm run format
npm run check:js
npm run format:check
```

Prettier настроен на отступ 2 пробела и ширину строки 100 символов. Не редактируйте автоматически сгенерированный CSS Tailwind — он не хранится в репозитории.

> Это UI-прототип: новые события и статусы сохраняются только в состоянии страницы. Backend и постоянное хранилище не подключены.
