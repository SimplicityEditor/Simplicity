import ffmpeg from 'fluent-ffmpeg';
import { logger } from '../utils/logger.js';

export function setupFFmpeg() {
  // Set ffmpeg and ffprobe paths (for development/production)
  try {
    // In production, these should be properly configured
    const ffmpegPath = process.env.FFMPEG_PATH;
    const ffprobePath = process.env.FFPROBE_PATH;

    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }

    logger.info('FFmpeg initialized');
  } catch (error) {
    logger.warn('FFmpeg not found in system path. Install FFmpeg to enable video processing.');
  }
}

export function getVideoInfo(
  filepath: string
): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

export function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(startTime / 1000) // Convert ms to seconds
      .duration((endTime - startTime) / 1000)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export function mergeVideos(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    inputPaths.forEach((path) => {
      command = command.input(path);
    });

    command
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .mergeToFile(outputPath, '/tmp/');
  });
}

export function extractAudio(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export function applyFilter(
  inputPath: string,
  outputPath: string,
  filterChain: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(filterChain)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export function scaleVideo(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .size(`${width}x${height}`)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
