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

# Copiar node_modules necessários para o script de cron
# (better-sqlite3 precisa de binding nativo, cheerio para o scraping)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /app/node_modules/cheerio ./node_modules/cheerio
COPY --from=builder /app/node_modules/htmlparser2 ./node_modules/htmlparser2
COPY --from=builder /app/node_modules/domhandler ./node_modules/domhandler
COPY --from=builder /app/node_modules/domutils ./node_modules/domutils
COPY --from=builder /app/node_modules/dom-serializer ./node_modules/dom-serializer
COPY --from=builder /app/node_modules/css-select ./node_modules/css-select
COPY --from=builder /app/node_modules/css-what ./node_modules/css-what
COPY --from=builder /app/node_modules/boolbase ./node_modules/boolbase
COPY --from=builder /app/node_modules/nth-check ./node_modules/nth-check
COPY --from=builder /app/node_modules/parse5 ./node_modules/parse5
COPY --from=builder /app/node_modules/parse5-htmlparser2-tree-adapter ./node_modules/parse5-htmlparser2-tree-adapter
COPY --from=builder /app/node_modules/entities ./node_modules/entities
COPY --from=builder /app/node_modules/encoding-sniffer ./node_modules/encoding-sniffer
COPY --from=builder /app/node_modules/whatwg-encoding ./node_modules/whatwg-encoding
COPY --from=builder /app/node_modules/iconv-lite ./node_modules/iconv-lite
COPY --from=builder /app/node_modules/safer-buffer ./node_modules/safer-buffer
COPY --from=builder /app/node_modules/whatwg-mimetype ./node_modules/whatwg-mimetype

# Copiar entrypoint
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Volume para o banco de dados SQLite
VOLUME ["/app/data"]

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
