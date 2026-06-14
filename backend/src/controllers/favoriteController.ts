import { Request, Response } from 'express';
import FavoriteModel from '../models/Favorite.js';

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { videoId, title, artist, thumbnail, duration } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const existing = await FavoriteModel.findOne({ userId, videoId });

    if (existing) {
      await FavoriteModel.deleteOne({ userId, videoId });
      return res.json({ liked: false, message: 'Removed from favorites' });
    } else {
      if (!title || !artist || !thumbnail || !duration) {
        return res.status(400).json({ error: 'Missing required song metadata for favoriting' });
      }

      const favorite = new FavoriteModel({
        userId,
        videoId,
        title,
        artist,
        thumbnail,
        duration,
        likedAt: new Date()
      });
      await favorite.save();
      return res.status(201).json({ liked: true, message: 'Added to favorites', favorite });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const favorites = await FavoriteModel.find({ userId }).sort({ likedAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to retrieve favorites' });
  }
};

export const checkFavoriteStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId param is required' });
    }

    const favorite = await FavoriteModel.findOne({ userId, videoId });
    res.json({ liked: !!favorite });
  } catch (error) {
    console.error('Check favorite status error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
};
