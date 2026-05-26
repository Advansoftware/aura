#!/bin/sh
set -e

# ====================================================================
# Aura - Entrypoint de Produção
# Gera horário aleatório de cron entre 01:00-04:00 (America/Sao_Paulo)
# e inicia o Next.js standalone server
# ====================================================================

# Garantir que o diretório de dados existe
mkdir -p /app/data

# Gerar horário aleatório para a cron de madrugada
CRON_HOUR=$((RANDOM % 3 + 1))   # 1, 2 ou 3 (inicia entre 01:00-03:59)
CRON_MIN=$((RANDOM % 60))        # 0-59

echo "============================================"
echo "🌙 Cron noturna configurada para: ${CRON_HOUR}:$(printf '%02d' $CRON_MIN) (America/Sao_Paulo)"
echo "============================================"

# Instalar crontab
CRON_LINE="${CRON_MIN} ${CRON_HOUR} * * * cd /app && /usr/local/bin/node /app/dist-scripts/scripts/nightly-scrape.js >> /var/log/nightly-scrape.log 2>&1"

echo "$CRON_LINE" | crontab -

# Criar arquivo de log
touch /var/log/nightly-scrape.log

# Iniciar cron daemon em background
crond -b -l 2

echo "✅ Cron daemon iniciado em background"

# Verificar se o banco de dados tem jogos cadastrados de forma ultra-confiável
DB_FILE="/app/data/steamverde.db"
NEED_INITIAL_SCRAPE=false

if [ ! -f "$DB_FILE" ]; then
  NEED_INITIAL_SCRAPE=true
else
  # Executa uma verificação rápida no banco de dados para checar se existem registros na tabela games
  if ! node -e "try { const db = require('better-sqlite3')('$DB_FILE'); const r = db.prepare('SELECT COUNT(*) as c FROM games').get(); process.exit(r && r.c > 0 ? 0 : 1); } catch(e) { process.exit(1); }" 2>/dev/null; then
    NEED_INITIAL_SCRAPE=true
  fi
fi

if [ "$NEED_INITIAL_SCRAPE" = true ]; then
  echo "🆕 Banco de dados vazio ou sem jogos detectado. Executando scrape inicial em background..."
  (cd /app && node /app/dist-scripts/scripts/nightly-scrape.js >> /var/log/nightly-scrape.log 2>&1) &
  echo "🔄 Scrape inicial rodando em background (PID: $!)"
else
  # Se o banco já possui jogos, fazemos um scrape rápido focado em background apenas do Hero Section para atualizá-lo de imediato com o site deles
  echo "🔥 Banco existente detectado. Sincronizando Hero Section em background..."
  (cd /app && node -e "
    const { scrapeHeroSlugs, scrapeGameDetail } = require('./dist-scripts/src/lib/scraper');
    const { setScrapeMetaValue } = require('./dist-scripts/src/lib/db');
    scrapeHeroSlugs().then(async slugs => {
      if (slugs && slugs.length > 0) {
        setScrapeMetaValue('hero_slugs', JSON.stringify(slugs));
        for (const slug of slugs) {
          try { await scrapeGameDetail(slug); } catch(e) {}
        }
      }
    }).catch(() => {});
  " >/dev/null 2>&1 &)
fi

# Iniciar o Next.js standalone server
echo "🚀 Iniciando Aura (Next.js) na porta ${PORT:-3000}..."
exec node /app/server.js
