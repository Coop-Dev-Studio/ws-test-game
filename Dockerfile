# === Этап 1: Сборка TypeScript ===
FROM node:current-alpine3.23 AS builder
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для компиляции)
RUN npm install

# Копируем исходный код проекта и конфиг TS
COPY tsconfig.json ./
COPY src/ ./src/

# Компилируем TypeScript в JavaScript (создаст папку /app/dist)
RUN npm run build


# === Этап 2: Финальный легковесный контейнер ===
FROM node:current-alpine3.23 AS runner
WORKDIR /app

# Переменная окружения для продакшена
ENV NODE_ENV=production

# Копируем package.json, чтобы поставить только нужные для работы библиотеки
COPY package*.json ./

# Устанавливаем только prod-зависимости (игнорируем devDependencies)
RUN npm install --omit=dev

# Копируем скомпилированный код из первого этапа (builder)
COPY --from=builder /app/dist ./dist

# Открываем порт наружу (для документации)
EXPOSE 7860

COPY public/ ./public/

# Запускаем сервер
CMD ["npm", "start"]
