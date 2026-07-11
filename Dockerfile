# syntax = docker/dockerfile:1

FROM node:22-bullseye-slim

WORKDIR /app

ENV NODE_ENV="production" \
    PORT="3000" \
    CHROMIUM_PATH="/usr/bin/chromium"

# Install system dependencies for Chromium
RUN apt-get update -qq && \
    apt-get install -y \
      chromium \
      chromium-sandbox \
      fonts-liberation \
      libappindicator1 \
      libappindicator3-1 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxinerama1 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 && \
    rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
