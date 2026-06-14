import { Request, Response } from 'express';
import { searchYouTube, getSearchSuggestions } from '../utils/ytScraper.js';

export const search = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const results = await searchYouTube(query);
    res.json(results);
  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
};

export const suggest = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const suggestions = await getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Suggest controller error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
};
