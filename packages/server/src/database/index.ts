import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/simplicity.db');

export let db: sqlite3.Database;

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

async function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Projects table
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          fps INTEGER NOT NULL,
          aspectRatio TEXT,
          duration INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          savedPath TEXT
        )
      `);

      // Video files table
      db.run(`
        CREATE TABLE IF NOT EXISTS video_files (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          name TEXT NOT NULL,
          path TEXT NOT NULL UNIQUE,
          duration INTEGER,
          width INTEGER,
          height INTEGER,
          fps REAL,
          fileSize INTEGER,
          mimeType TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      // Audio tracks table
      db.run(`
        CREATE TABLE IF NOT EXISTS audio_tracks (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          name TEXT NOT NULL,
          duration INTEGER,
          path TEXT NOT NULL,
          volume REAL DEFAULT 1.0,
          muted INTEGER DEFAULT 0,
          startTime INTEGER DEFAULT 0,
          endTime INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      // Timeline clips table
      db.run(`
        CREATE TABLE IF NOT EXISTS timeline_clips (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          type TEXT NOT NULL,
          sourceId TEXT,
          startTime INTEGER,
          duration INTEGER,
          position INTEGER,
          opacity REAL DEFAULT 1.0,
          rotation REAL DEFAULT 0,
          scaleX REAL DEFAULT 1.0,
          scaleY REAL DEFAULT 1.0,
          x INTEGER DEFAULT 0,
          y INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      // Effects table
      db.run(`
        CREATE TABLE IF NOT EXISTS effects (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          type TEXT NOT NULL,
          name TEXT,
          duration INTEGER,
          intensity REAL DEFAULT 1.0,
          parameters TEXT,
          startTime INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      // Transitions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transitions (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          type TEXT NOT NULL,
          name TEXT,
          duration INTEGER,
          easing TEXT DEFAULT 'linear',
          fromClipId TEXT,
          toClipId TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);

      // Text overlays table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS text_overlays (
          id TEXT PRIMARY KEY,
          projectId TEXT,
          content TEXT,
          fontFamily TEXT,
          fontSize INTEGER,
          color TEXT,
          backgroundColor TEXT,
          opacity REAL DEFAULT 1.0,
          rotation REAL DEFAULT 0,
          x INTEGER,
          y INTEGER,
          width INTEGER,
          height INTEGER,
          startTime INTEGER,
          duration INTEGER,
          animated INTEGER DEFAULT 0,
          animationType TEXT,
          align TEXT DEFAULT 'center',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('Database tables created successfully');
            resolve();
          }
        }
      );
    });
  });
}

export function runQuery(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getRow(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function getAllRows(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
