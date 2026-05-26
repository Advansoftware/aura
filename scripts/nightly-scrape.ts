/**
 * Script de Scraping Noturno Inteligente
 *
 * Executado via cron de madrugada. Comportamento:
 * 1. Lista todos os slugs disponíveis no site
 * 2. Identifica jogos NOVOS (não existem no banco) e INCOMPLETOS (faltam dados)
 * 3. Prioriza novos, depois incompletos
 * 4. Faz scraping com delays aleatórios de 15-90s entre cada jogo
 * 5. Respeita uma janela máxima de ~60 minutos
 * 6. Registra logs detalhados
 */

import {
  getAllSlugs,
  getIncompleteGames,
  setLastScrapeTime,
  setScrapeMetaValue,
} from '../src/lib/db';
import {
  scrapeGameList,
  scrapeGameDetail,
} from '../src/lib/scraper';

const MAX_DURATION_MS = 60 * 60 * 1000; // 60 minutos
const MIN_DELAY_MS = 15_000; // 15 segundos
const MAX_DELAY_MS = 90_000; // 90 segundos

function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function run(): Promise<void> {
  const startTime = Date.now();
  log('🌙 Iniciando scraping noturno inteligente...');
  setScrapeMetaValue('nightly_scrape_start', new Date().toISOString());

  // 1. Buscar lista completa de slugs do site
  log('📋 Buscando lista completa de jogos no site...');
  let siteSlugs: string[];
  try {
    siteSlugs = await scrapeGameList();
    log(`📋 Encontrados ${siteSlugs.length} jogos no site`);
  } catch (err) {
    log(`❌ Erro ao buscar lista de jogos: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  // 2. Identificar jogos novos (não existem no banco)
  const existingSlugs = new Set(getAllSlugs());
  const newSlugs = siteSlugs.filter(slug => !existingSlugs.has(slug));
  log(`🆕 Jogos novos encontrados: ${newSlugs.length}`);

  // 3. Identificar jogos incompletos
  const incompleteGames = getIncompleteGames();
  const incompleteSlugs = incompleteGames.map(g => g.slug);
  log(`🔧 Jogos incompletos encontrados: ${incompleteSlugs.length}`);

  // 4. Montar fila de prioridade: novos primeiro, depois incompletos
  const queue: string[] = [
    ...newSlugs,
    ...incompleteSlugs.filter(slug => !newSlugs.includes(slug)),
  ];

  if (queue.length === 0) {
    log('✅ Nenhum jogo novo ou incompleto para atualizar. Base de dados completa!');
    setScrapeMetaValue('nightly_scrape_end', new Date().toISOString());
    setScrapeMetaValue('nightly_scrape_result', 'nothing_to_update');
    setLastScrapeTime(new Date().toISOString());
    return;
  }

  log(`📦 Total na fila de atualização: ${queue.length} jogos`);

  // 5. Processar fila com delays aleatórios e limite de tempo
  let processed = 0;
  let errors = 0;

  for (const slug of queue) {
    // Verificar se atingiu o tempo máximo
    const elapsed = Date.now() - startTime;
    if (elapsed >= MAX_DURATION_MS) {
      log(`⏰ Tempo máximo de ${MAX_DURATION_MS / 60_000} minutos atingido. Parando.`);
      break;
    }

    const timeRemaining = Math.floor((MAX_DURATION_MS - elapsed) / 60_000);
    const isNew = newSlugs.includes(slug);

    try {
      log(`🎮 [${processed + 1}/${queue.length}] ${isNew ? '🆕' : '🔧'} Processando: ${slug} (${timeRemaining}min restantes)`);
      await scrapeGameDetail(slug);
      processed++;
      log(`✅ Sucesso: ${slug}`);
    } catch (err) {
      errors++;
      log(`❌ Erro ao processar ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Delay aleatório antes do próximo
    if (queue.indexOf(slug) < queue.length - 1) {
      const delay = randomDelay();
      log(`⏳ Aguardando ${(delay / 1000).toFixed(0)}s antes do próximo...`);
      await sleep(delay);
    }
  }

  // 6. Finalizar e registrar resultado
  const totalElapsed = Math.floor((Date.now() - startTime) / 60_000);
  log(`\n🏁 Scraping noturno finalizado!`);
  log(`   ⏱️  Duração total: ${totalElapsed} minutos`);
  log(`   ✅ Processados com sucesso: ${processed}`);
  log(`   ❌ Erros: ${errors}`);
  log(`   📦 Restantes na fila: ${queue.length - processed - errors}`);

  setScrapeMetaValue('nightly_scrape_end', new Date().toISOString());
  setScrapeMetaValue('nightly_scrape_result', `processed=${processed},errors=${errors},remaining=${queue.length - processed - errors}`);
  setLastScrapeTime(new Date().toISOString());
}

run()
  .then(() => {
    log('🌙 Script noturno encerrado com sucesso.');
    process.exit(0);
  })
  .catch(err => {
    log(`💥 Erro fatal no script noturno: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
