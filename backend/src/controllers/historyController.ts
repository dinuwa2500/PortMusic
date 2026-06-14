import { Request, Response } from 'express';
import HistoryModel from '../models/History.js';

export const addToHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { videoId, title, artist, thumbnail, duration } = req.body;
    if (!videoId || !title || !artist || !thumbnail || !duration) {
      return res.status(400).json({ error: 'Missing required song fields' });
    }

    // Check if song is already in history for this user
    let historyItem = await HistoryModel.findOne({ userId, videoId });

    if (historyItem) {
      historyItem.plays += 1;
      historyItem.playedAt = new Date();
      await historyItem.save();
    } else {
      historyItem = new HistoryModel({
        userId,
        videoId,
        title,
        artist,
        thumbnail,
        duration,
        plays: 1,
        playedAt: new Date()
      });
      await historyItem.save();
    }

    res.status(201).json(historyItem);
  } catch (error) {
    console.error('Add to history error:', error);
    res.status(500).json({ error: 'Failed to record history' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const sort = req.query.sort as string; // 'recent' or 'plays'

    let query = HistoryModel.find({ userId });
    
    if (sort === 'plays') {
      // Sort by play count, then by recency
      query = query.sort({ plays: -1, playedAt: -1 });
    } else {
      // Sort by recency
      query = query.sort({ playedAt: -1 });
    }

    const history = await query.limit(limit);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    await HistoryModel.deleteMany({ userId });
    res.json({ message: 'History cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
