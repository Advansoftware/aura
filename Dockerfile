# ==================================================================
# Stage 1: Dependencies
# ==================================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ==================================================================
# Stage 2: Builder
# ==================================================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build do Next.js (standalone)
RUN npm run build

# Compilar o script de cron
RUN npx tsc --project tsconfig.scripts.json

# Limpar devDependencies para economizar espaço e deixar apenas dependências de produção
RUN npm prune --omit=dev

# ==================================================================
# Stage 3: Runner (Produção)
# ==================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Instalar timezone e cron
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
    && echo "America/Sao_Paulo" > /etc/timezone

# Criar diretórios necessários
RUN mkdir -p /app/data

# Copiar o standalone output do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copiar os scripts compilados (toda a estrutura)
COPY --from=builder /app/dist-scripts ./dist-scripts

# Copiar todas as node_modules de produção de uma vez
COPY --from=builder /app/node_modules ./node_modules

# Copiar entrypoint
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Volume para o banco de dados SQLite
VOLUME ["/app/data"]

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
