import { Request, Response } from 'express';
import PlaylistModel from '../models/Playlist.js';

export const createPlaylist = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const playlist = new PlaylistModel({
      userId,
      name,
      description,
      tracks: []
    });

    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};

export const getPlaylists = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const playlists = await PlaylistModel.find({ userId }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to retrieve playlists' });
  }
};

export const getPlaylistById = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { id } = req.params;
    const playlist = await PlaylistModel.findOne({ _id: id, userId });
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get playlist by id error:', error);
    res.status(500).json({ error: 'Failed to retrieve playlist' });
  }
};

export const addTrackToPlaylist = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { id } = req.params;
    const { videoId, title, artist, thumbnail, duration } = req.body;
    
    if (!videoId || !title || !artist || !thumbnail || !duration) {
      return res.status(400).json({ error: 'Missing track metadata' });
    }

    const playlist = await PlaylistModel.findOne({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Prevent duplicates in playlist
    const duplicate = playlist.tracks.some(track => track.videoId === videoId);
    if (duplicate) {
      return res.status(400).json({ error: 'Track already exists in this playlist' });
    }

    playlist.tracks.push({ videoId, title, artist, thumbnail, duration });
    await playlist.save();

    res.json(playlist);
  } catch (error) {
    console.error('Add track to playlist error:', error);
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
};

export const removeTrackFromPlaylist = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { id, videoId } = req.params;

    const playlist = await PlaylistModel.findOne({ _id: id, userId });
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    playlist.tracks = playlist.tracks.filter(track => track.videoId !== videoId);
    await playlist.save();

    res.json(playlist);
  } catch (error) {
    console.error('Remove track from playlist error:', error);
    res.status(500).json({ error: 'Failed to remove track from playlist' });
  }
};

export const deletePlaylist = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { id } = req.params;
    const result = await PlaylistModel.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Playlist not found or unauthorized' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};
