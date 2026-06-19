import { Router, Request, Response, NextFunction } from 'express';
import { generateId } from '@simplicity/shared';
import { runQuery, getRow, getAllRows } from '../database/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const videoRoutes = Router();

// GET all videos for a project
videoRoutes.get('/project/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videos = await getAllRows(
      'SELECT * FROM video_files WHERE projectId = ? ORDER BY createdAt DESC',
      [req.params.projectId]
    );
    res.json({ success: true, data: videos });
  } catch (error) {
    next(error);
  }
});

// GET single video
videoRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const video = await getRow('SELECT * FROM video_files WHERE id = ?', [req.params.id]);
    if (!video) {
      throw new AppError(404, 'Video not found');
    }
    res.json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
});

// CREATE video entry
videoRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectId,
      name,
      path,
      duration,
      width,
      height,
      fps,
      fileSize,
      mimeType,
    } = req.body;

    if (!name || !path) {
      throw new AppError(400, 'Name and path are required');
    }

    const videoId = generateId();
    const now = new Date().toISOString();

    await runQuery(
      `INSERT INTO video_files (id, projectId, name, path, duration, width, height, fps, fileSize, mimeType, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [videoId, projectId, name, path, duration, width, height, fps, fileSize, mimeType, now]
    );

    const video = await getRow('SELECT * FROM video_files WHERE id = ?', [videoId]);
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
});

// DELETE video
videoRoutes.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runQuery('DELETE FROM video_files WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
});
