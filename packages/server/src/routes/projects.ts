import { Router, Request, Response, NextFunction } from 'express';
import { generateId } from '@simplicity/shared';
import { db, runQuery, getRow, getAllRows } from '../database/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export const projectRoutes = Router();

// GET all projects
projectRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await getAllRows('SELECT * FROM projects ORDER BY updatedAt DESC');
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
});

// GET single project
projectRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await getRow('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// CREATE project
projectRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      width = 1920,
      height = 1080,
      fps = 30,
      aspectRatio = '16:9',
    } = req.body;

    if (!name) {
      throw new AppError(400, 'Project name is required');
    }

    const projectId = generateId();
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO projects (id, name, description, width, height, fps, aspectRatio, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, name, description, width, height, fps, aspectRatio, now, now]
    );

    const project = await getRow('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// UPDATE project
projectRoutes.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, width, height, fps, aspectRatio } = req.body;
    const now = new Date().toISOString();

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (width !== undefined) {
      updates.push('width = ?');
      params.push(width);
    }
    if (height !== undefined) {
      updates.push('height = ?');
      params.push(height);
    }
    if (fps !== undefined) {
      updates.push('fps = ?');
      params.push(fps);
    }
    if (aspectRatio !== undefined) {
      updates.push('aspectRatio = ?');
      params.push(aspectRatio);
    }

    if (updates.length === 0) {
      throw new AppError(400, 'No updates provided');
    }

    updates.push('updatedAt = ?');
    params.push(now);
    params.push(req.params.id);

    await runQuery(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const project = await getRow('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// DELETE project
projectRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runQuery('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});
