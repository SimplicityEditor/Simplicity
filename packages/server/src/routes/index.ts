import { Express } from 'express';
import { projectRoutes } from './projects.js';
import { videoRoutes } from './videos.js';
import { audioRoutes } from './audio.js';
import { effectRoutes } from './effects.js';
import { exportRoutes } from './export.js';

export function setupRoutes(app: Express) {
  // API v1 routes
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/videos', videoRoutes);
  app.use('/api/v1/audio', audioRoutes);
  app.use('/api/v1/effects', effectRoutes);
  app.use('/api/v1/export', exportRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        statusCode: 404,
      },
    });
  });
}
