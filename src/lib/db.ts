import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'steamverde.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb();
  }
  return db;
}

function initDb() {
  db!.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      image TEXT,
      description TEXT,
      file_size TEXT,
      version TEXT,
      download_url TEXT,
      magnet_url TEXT,
      categories TEXT,
      author TEXT,
      views INTEGER DEFAULT 0,
      downloads_count INTEGER DEFAULT 0,
      update_date TEXT,
      screenshots TEXT,
      system_requirements TEXT,
      trailer_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scrape_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export interface Game {
  id?: number;
  slug: string;
  title: string;
  image: string | null;
  description: string | null;
  file_size: string | null;
  version: string | null;
  download_url: string | null;
  magnet_url: string | null;
  categories: string | null;
  author: string | null;
  views: number | null;
  downloads_count: number | null;
  update_date: string | null;
  screenshots: string | null;
  system_requirements: string | null;
  trailer_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export function upsertGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO games (slug, title, image, description, file_size, version, download_url, magnet_url, categories, author, views, downloads_count, update_date, screenshots, system_requirements, trailer_url, updated_at)
    VALUES (@slug, @title, @image, @description, @file_size, @version, @download_url, @magnet_url, @categories, @author, @views, @downloads_count, @update_date, @screenshots, @system_requirements, @trailer_url, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      title = @title, image = @image, description = @description, file_size = @file_size, version = @version, download_url = @download_url, magnet_url = @magnet_url, categories = @categories, author = @author, views = @views, downloads_count = @downloads_count, update_date = @update_date, screenshots = @screenshots, system_requirements = @system_requirements, trailer_url = @trailer_url, updated_at = datetime('now')
  `);
  return stmt.run(game);
}

export function getAllGames(): Game[] {
  const d = getDb();
  return d.prepare('SELECT * FROM games ORDER BY updated_at DESC').all() as Game[];
}

export function getGamesPaginated(page: number, limit: number): { games: Game[]; total: number } {
  const d = getDb();
  const total = (d.prepare('SELECT COUNT(*) as count FROM games').get() as { count: number }).count;
  const games = d.prepare('SELECT * FROM games ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, (page - 1) * limit) as Game[];
  return { games, total };
}

export function getGameBySlug(slug: string): Game | undefined {
  const d = getDb();
  return d.prepare('SELECT * FROM games WHERE slug = ?').get(slug) as Game | undefined;
}

export function searchGames(query: string): Game[] {
  const d = getDb();
  return d.prepare('SELECT * FROM games WHERE title LIKE ? ORDER BY updated_at DESC').all(`%${query}%`) as Game[];
}

export function getLastScrapeTime(): string | null {
  const d = getDb();
  const row = d.prepare("SELECT value FROM scrape_meta WHERE key = 'last_scrape'").get() as { value: string } | undefined;
  return row?.value || null;
}

export function setLastScrapeTime(time: string) {
  const d = getDb();
  d.prepare("INSERT OR REPLACE INTO scrape_meta (key, value) VALUES ('last_scrape', ?)").run(time);
}

export function getAllSlugs(): string[] {
  const d = getDb();
  const rows = d.prepare('SELECT slug FROM games').all() as Array<{ slug: string }>;
  return rows.map(r => r.slug);
}

export function getIncompleteGames(): Game[] {
  const d = getDb();
  return d.prepare(`
    SELECT * FROM games
    WHERE description IS NULL
       OR description = ''
       OR screenshots IS NULL
       OR magnet_url IS NULL
       OR image IS NULL
    ORDER BY updated_at ASC
  `).all() as Game[];
}

export function getScrapeMetaValue(key: string): string | null {
  const d = getDb();
  const row = d.prepare('SELECT value FROM scrape_meta WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setScrapeMetaValue(key: string, value: string) {
  const d = getDb();
  d.prepare('INSERT OR REPLACE INTO scrape_meta (key, value) VALUES (?, ?)').run(key, value);
}
