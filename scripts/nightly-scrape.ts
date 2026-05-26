/**
 * Script de Scraping Noturno Inteligente
 *
 * Executado via cron de madrugada. Comportamento:
 * 1. Lista todos os slugs disponíveis no site
 * 2. Identifica jogos NOVOS (não existem no banco) e INCOMPLETOS (faltam dados)
 * 3. Prioriza novos, depois incompletos
 * 4. Calcula delay dinâmico para encaixar tudo em ~60 minutos
 * 5. Processa TODOS os jogos da fila (sem corte de tempo)
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
  scrapeHeroSlugs,
} from '../src/lib/scraper';

const TARGET_DURATION_MS = 60 * 60 * 1000; // 60 minutos (meta, não limite)
const MIN_DELAY_MS = 3_000;  // delay mínimo de 3s (proteção contra bloqueio)
const MAX_DELAY_MS = 120_000; // delay máximo de 2min (se poucos jogos na fila)

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Calcula o delay entre cada jogo para distribuir o scraping
 * ao longo de ~60 minutos. Adiciona variação aleatória de ±30%
 * para parecer tráfego orgânico.
 */
function calculateDelay(totalGames: number): number {
  if (totalGames <= 1) return 0;

  // Tempo base por jogo: meta de 60min dividido pela quantidade
  // Subtrai ~3s por jogo como tempo estimado de scraping
  const estimatedScrapeTimePerGame = 3_000;
  const availableDelayTime = TARGET_DURATION_MS - (totalGames * estimatedScrapeTimePerGame);
  const baseDelay = Math.max(MIN_DELAY_MS, availableDelayTime / (totalGames - 1));

  // Adiciona variação aleatória de ±30%
  const variation = 0.3;
  const min = baseDelay * (1 - variation);
  const max = baseDelay * (1 + variation);
  const randomized = Math.floor(Math.random() * (max - min + 1)) + min;

  // Clamp entre MIN e MAX
  return Math.min(MAX_DELAY_MS, Math.max(MIN_DELAY_MS, randomized));
}

async function run(): Promise<void> {
  const startTime = Date.now();
  log('🌙 Iniciando scraping noturno inteligente...');
  setScrapeMetaValue('nightly_scrape_start', new Date().toISOString());

  // 0. Buscar e salvar slugs em destaque do Hero Section deles
  log('🔥 Coletando jogos em destaque do Hero Section...');
  let heroSlugs: string[] = [];
  try {
    heroSlugs = await scrapeHeroSlugs();
    log(`🔥 Jogos em destaque no Hero: [${heroSlugs.join(', ')}]`);
    setScrapeMetaValue('hero_slugs', JSON.stringify(heroSlugs));
  } catch (err) {
    log(`⚠️ Erro ao coletar hero slugs: ${err instanceof Error ? err.message : String(err)}`);
  }

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

  // 4. Montar fila de prioridade: 1º Hero Section, 2º Novos, 3º Incompletos
  const queue: string[] = [
    ...heroSlugs,
    ...newSlugs.filter(slug => !heroSlugs.includes(slug)),
    ...incompleteSlugs.filter(slug => !newSlugs.includes(slug) && !heroSlugs.includes(slug)),
  ];

  if (queue.length === 0) {
    log('✅ Nenhum jogo novo ou incompleto para atualizar. Base de dados completa!');
    setScrapeMetaValue('nightly_scrape_end', new Date().toISOString());
    setScrapeMetaValue('nightly_scrape_result', 'nothing_to_update');
    setLastScrapeTime(new Date().toISOString());
    return;
  }

  log(`📦 Total na fila de atualização: ${queue.length} jogos`);

  // Calcular delay estimado
  const estimatedDelay = calculateDelay(queue.length);
  const estimatedTotalMin = Math.ceil((queue.length * (estimatedDelay + 3_000)) / 60_000);
  log(`⏱️  Delay estimado entre jogos: ~${(estimatedDelay / 1000).toFixed(0)}s`);
  log(`⏱️  Tempo total estimado: ~${estimatedTotalMin} minutos`);

  // 5. Processar TODA a fila com delays dinâmicos
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < queue.length; i++) {
    const slug = queue[i];
    const elapsed = Math.floor((Date.now() - startTime) / 60_000);
    const isNew = newSlugs.includes(slug);

    try {
      log(`🎮 [${i + 1}/${queue.length}] ${isNew ? '🆕' : '🔧'} Processando: ${slug} (${elapsed}min decorridos)`);
      await scrapeGameDetail(slug);
      processed++;
      log(`✅ Sucesso: ${slug}`);
    } catch (err) {
      errors++;
      log(`❌ Erro ao processar ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Delay dinâmico antes do próximo (exceto no último)
    if (i < queue.length - 1) {
      const delay = calculateDelay(queue.length);
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
  log(`   📦 Total na fila original: ${queue.length}`);

  setScrapeMetaValue('nightly_scrape_end', new Date().toISOString());
  setScrapeMetaValue('nightly_scrape_result', `processed=${processed},errors=${errors},duration=${totalElapsed}min`);
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
