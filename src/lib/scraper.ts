import * as cheerio from 'cheerio';
import { upsertGame, getLastScrapeTime, setLastScrapeTime, getGameBySlug } from './db';

const BASE_URL = 'https://steamverde.net';

export async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  return res.text();
}

function extractSlugFromUrl(url: string): string {
  const match = url.match(/\/download\/([^/]+)\/?/);
  return match ? match[1] : '';
}

export async function scrapeHeroSlugs(): Promise<string[]> {
  try {
    const html = await fetchHTML(BASE_URL);
    const slugs: string[] = [];
    const regex = /\/download\/([^/"']+)/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const slug = m[1];
      if (slug && slug !== 'steam-verde-launcher-assinantes' && !slugs.includes(slug)) {
        slugs.push(slug);
        if (slugs.length >= 6) break;
      }
    }
    return slugs;
  } catch (e) {
    console.error('Erro ao buscar hero slugs:', e);
    return [];
  }
}

export async function scrapeGameList(): Promise<string[]> {
  const slugs: string[] = [];

  async function scrapePage(url: string): Promise<boolean> {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    const regex = /\/download\/([^/"']+)/g;
    let m;
    let found = 0;
    while ((m = regex.exec(html)) !== null) {
      const slug = m[1];
      if (slug && slug !== 'steam-verde-launcher-assinantes' && !slugs.includes(slug)) {
        slugs.push(slug);
        found++;
      }
    }

    return found > 0;
  }

  // scrape main page and its pagination
  let pageNum = 1;
  while (true) {
    const url = pageNum === 1 ? BASE_URL : `${BASE_URL}/page/${pageNum}/`;
    const hasContent = await scrapePage(url);
    if (!hasContent) break;
    pageNum++;
    await new Promise(r => setTimeout(r, 500));
  }

  // scrape /jogos/ archive and its pagination
  pageNum = 1;
  while (true) {
    const url = pageNum === 1 ? `${BASE_URL}/jogos/` : `${BASE_URL}/jogos/page/${pageNum}/`;
    const hasContent = await scrapePage(url);
    if (!hasContent) break;
    pageNum++;
    await new Promise(r => setTimeout(r, 500));
  }

  return [...new Set(slugs)];
}

export async function scrapeGameDetail(slug: string) {
  const url = `${BASE_URL}/download/${slug}/`;
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  const title = $('h1.entry-title').first().text().trim() || $('title').text().replace(' - Steam Verde', '').trim();

  const image = $('.package-image img.img-fluid').attr('src') || $('meta[property="og:image"]').attr('content') || null;

  const description = $('#description-tab .tab-content-inner').html() || '';

  const sizeEl = $('.package-meta-grid .meta-item').filter((_, el) => $(el).text().toLowerCase().includes('tamanho') || $(el).text().toLowerCase().includes('size'));
  const fileSize = sizeEl.find('.meta-value').text().trim() || null;

  const versionEl = $('.package-meta-grid .meta-item').filter((_, el) => $(el).text().toLowerCase().includes('vers'));
  const version = versionEl.find('.meta-value').text().trim() || null;

  const updateEl = $('.package-meta-grid .meta-item').filter((_, el) => $(el).text().toLowerCase().includes('atual') || $(el).text().toLowerCase().includes('update'));
  const updateDate = updateEl.find('.meta-value').text().trim() || null;

  const views = parseInt($('span.view-number').text().trim()) || 0;

  const downloadBtn = $('a.wpdm-download-link.btn.btn-primary');
  const downloadUrl = downloadBtn.attr('href') || null;

  let magnetUrl = $('input[id^="magnet-url-"]').val() as string || null;

  if (!magnetUrl) {
    magnetUrl = $('a.btn.btn-primary[href^="magnet:?xt=urn:btih:"]').attr('href') || null;
  }

  const screenshots: string[] = [];
  $('.wpdm-carousel .carousel-item a[href][data-lightbox]').each((_, el) => {
    const src = $(el).attr('href');
    if (src) screenshots.push(src);
  });

  const categories: string[] = [];
  const postDiv = $('div[id^="post-"]');
  if (postDiv.length) {
    const classStr = postDiv.attr('class') || '';
    const catMatches = classStr.match(/wpdmcategory-([\w-]+)/g);
    if (catMatches) {
      catMatches.forEach(c => categories.push(c.replace('wpdmcategory-', '')));
    }
  }

  const author = $('li.post-author a').text().trim() || null;

  const sysReqs: Record<string, string> = {};
  $('.game_area_sys_req_leftCol ul.bb_ul > li, .game_area_sys_req_rightCol ul.bb_ul > li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      const parts = text.split(':');
      if (parts.length > 1) {
        sysReqs[parts[0].trim()] = parts.slice(1).join(':').trim();
      } else {
        sysReqs[`req_${Object.keys(sysReqs).length}`] = text;
      }
    }
  });

  const trailerUrl = $('.wpdm-video-trailer-container iframe').attr('src') || null;

  const game = {
    slug,
    title,
    image,
    description,
    file_size: fileSize || null,
    version: version || null,
    download_url: downloadUrl || null,
    magnet_url: magnetUrl || null,
    categories: categories.length > 0 ? categories.join(',') : null,
    author: author || null,
    views,
    downloads_count: 0,
    update_date: updateDate || null,
    screenshots: screenshots.length > 0 ? JSON.stringify(screenshots) : null,
    system_requirements: Object.keys(sysReqs).length > 0 ? JSON.stringify(sysReqs) : null,
    trailer_url: trailerUrl || null,
  };

  upsertGame(game);
  return game;
}

export async function scrapeAll(force = false) {
  console.log(`Starting scrape${force ? ' (forced)' : ''}...`);
  const slugs = await scrapeGameList();
  console.log(`Found ${slugs.length} games on site`);

  let newCount = 0;
  for (const slug of slugs) {
    const existing = getGameBySlug(slug);
    if (!force && existing) continue;

    try {
      await scrapeGameDetail(slug);
      newCount++;
      console.log(`Scraped: ${slug}`);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error scraping ${slug}:`, err);
    }
  }

  console.log(`Scraped ${newCount} games${force ? ' (all forced)' : ''}`);
  setLastScrapeTime(new Date().toISOString());
  return { total: slugs.length, new: newCount };
}

export async function scrapeIfNeeded(): Promise<boolean> {
  const lastScrape = getLastScrapeTime();
  if (lastScrape) {
    const lastDate = new Date(lastScrape);
    const now = new Date();
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      console.log(`Last scrape was ${diffHours.toFixed(1)} hours ago, skipping`);
      return false;
    }
  }
  await scrapeAll();
  return true;
}
