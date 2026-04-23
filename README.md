# Welcome to your Lovable project

## Деплой

Приложение деплоится через **Publish** в интерфейсе Lovable.

### Как опубликовать

1. Откройте проект в Lovable.
2. Нажмите **Publish** в правом верхнем углу.
3. Для первого релиза подтвердите публикацию.
4. После публикации приложение будет доступно по `.lovable.app` URL.

### Как выкатывать обновления

- **Frontend-изменения** (UI, стили, клиентская логика) требуют нажатия **Update** в окне публикации.
- **Backend-изменения** (база данных, backend functions, серверная логика в Lovable Cloud) применяются автоматически.

### Кастомный домен

Подключить свой домен можно только после первой публикации проекта.

### Предпросмотр для других пользователей

Если нужно временно показать приложение без полноценного релиза, используйте **Share → Share preview**.

## Локальный запуск

### Без Docker

1. Установите зависимости:

   ```bash
   npm install
   ```

2. Запустите dev-сервер:

   ```bash
   npm run dev
   ```

3. Откройте приложение по адресу, который покажет Vite (обычно `http://localhost:8080`).

### Production-сборка

```bash
npm run build
npm run preview
```

## Запуск через Docker

Пример минимального `Dockerfile` для production-сборки Vite-приложения:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Сборка Docker-образа

```bash
docker build -t my-vite-app .
```

### Запуск контейнера

```bash
docker run -p 8080:80 my-vite-app
```

После запуска приложение будет доступно на `http://localhost:8080`.

## Деплой через Docker

Общий процесс деплоя:

1. Собрать Docker-образ:

   ```bash
   docker build -t my-vite-app .
   ```

2. Запушить образ в registry, например Docker Hub или GitHub Container Registry.
3. На сервере или в облачной платформе запустить контейнер из этого образа.
4. Пробросить внешний порт на `80` внутри контейнера.

Пример запуска на сервере:

```bash
docker run -d --name my-vite-app -p 80:80 my-vite-app
```

Если в приложении используются переменные окружения Vite, их нужно передавать на этапе сборки образа, так как frontend собирается заранее.
