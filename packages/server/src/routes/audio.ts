import { Router, Request, Response, NextFunction } from 'express';
import { generateId } from '@simplicity/shared';
import { runQuery, getRow, getAllRows } from '../database/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const audioRoutes = Router();

// GET all audio tracks for a project
audioRoutes.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracks = await getAllRows(
      'SELECT * FROM audio_tracks WHERE projectId = ? ORDER BY createdAt DESC',
      [req.params.projectId]
    );
    res.json({ success: true, data: tracks });
  } catch (error) {
    next(error);
  }
});

// GET single audio track
audioRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const track = await getRow('SELECT * FROM audio_tracks WHERE id = ?', [req.params.id]);
    if (!track) {
      throw new AppError(404, 'Audio track not found');
    }
    res.json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
});

// CREATE audio track
audioRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectId,
      name,
      duration,
      path,
      volume = 1.0,
      muted = false,
      startTime = 0,
      endTime,
    } = req.body;

    if (!name || !path) {
      throw new AppError(400, 'Name and path are required');
    }

    const trackId = generateId();
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO audio_tracks (id, projectId, name, duration, path, volume, muted, startTime, endTime, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trackId, projectId, name, duration, path, volume, muted ? 1 : 0, startTime, endTime, now]
    );

    const track = await getRow('SELECT * FROM audio_tracks WHERE id = ?', [trackId]);
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
});

// UPDATE audio track
audioRoutes.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { volume, muted, startTime, endTime } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (volume !== undefined) {
      updates.push('volume = ?');
      params.push(volume);
    }
    if (muted !== undefined) {
      updates.push('muted = ?');
      params.push(muted ? 1 : 0);
    }
    if (startTime !== undefined) {
      updates.push('startTime = ?');
      params.push(startTime);
    }
    if (endTime !== undefined) {
      updates.push('endTime = ?');
      params.push(endTime);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No updates provided');
    }

    params.push(req.params.id);

    await runQuery(
      `UPDATE audio_tracks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const track = await getRow('SELECT * FROM audio_tracks WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
});

// DELETE audio track
audioRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runQuery('DELETE FROM audio_tracks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Audio track deleted' });
  } catch (error) {
    next(error);
  }
});
