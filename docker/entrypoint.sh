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

# Verificar se o banco está vazio e fazer scrape inicial se necessário
DB_FILE="/app/data/steamverde.db"
NEED_INITIAL_SCRAPE=false

if [ ! -f "$DB_FILE" ]; then
  NEED_INITIAL_SCRAPE=true
else
  DB_SIZE=$(stat -c%s "$DB_FILE" 2>/dev/null || echo "0")
  if [ "$DB_SIZE" -lt 4096 ]; then
    NEED_INITIAL_SCRAPE=true
  fi
fi

if [ "$NEED_INITIAL_SCRAPE" = true ]; then
  echo "🆕 Banco de dados vazio detectado. Executando scrape inicial em background..."
  (cd /app && node /app/dist-scripts/scripts/nightly-scrape.js >> /var/log/nightly-scrape.log 2>&1) &
  echo "🔄 Scrape inicial rodando em background (PID: $!)"
fi

# Iniciar o Next.js standalone server
echo "🚀 Iniciando Aura (Next.js) na porta ${PORT:-3000}..."
exec node /app/server.js
