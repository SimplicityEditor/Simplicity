import { Router, Request, Response, NextFunction } from 'express';
import { generateId } from '@simplicity/shared';
import { runQuery, getRow, getAllRows } from '../database/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const effectRoutes = Router();

// GET all effects for a project
effectRoutes.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const effects = await getAllRows(
      'SELECT * FROM effects WHERE projectId = ? ORDER BY createdAt DESC',
      [req.params.projectId]
    );
    res.json({ success: true, data: effects });
  } catch (error) {
    next(error);
  }
});

// GET single effect
effectRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const effect = await getRow('SELECT * FROM effects WHERE id = ?', [req.params.id]);
    if (!effect) {
      throw new AppError(404, 'Effect not found');
    }
    res.json({ success: true, data: effect });
  } catch (error) {
    next(error);
  }
});

// CREATE effect
effectRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectId,
      type,
      name,
      duration,
      intensity = 1.0,
      parameters = {},
      startTime,
    } = req.body;

    if (!type) {
      throw new AppError(400, 'Effect type is required');
    }

    const effectId = generateId();
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO effects (id, projectId, type, name, duration, intensity, parameters, startTime, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        effectId,
        projectId,
        type,
        name,
        duration,
        intensity,
        JSON.stringify(parameters),
        startTime,
        now,
      ]
    );

    const effect = await getRow('SELECT * FROM effects WHERE id = ?', [effectId]);
    res.status(201).json({ success: true, data: effect });
  } catch (error) {
    next(error);
  }
});

// UPDATE effect
effectRoutes.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { intensity, parameters, startTime } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (intensity !== undefined) {
      updates.push('intensity = ?');
      params.push(intensity);
    }
    if (parameters !== undefined) {
      updates.push('parameters = ?');
      params.push(JSON.stringify(parameters));
    }
    if (startTime !== undefined) {
      updates.push('startTime = ?');
      params.push(startTime);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No updates provided');
    }

    params.push(req.params.id);

    await runQuery(
      `UPDATE effects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const effect = await getRow('SELECT * FROM effects WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: effect });
  } catch (error) {
    next(error);
  }
});

// DELETE effect
effectRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runQuery('DELETE FROM effects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Effect deleted' });
  } catch (error) {
    next(error);
  }
});
