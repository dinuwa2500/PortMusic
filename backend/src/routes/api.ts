import { Router } from 'express';
import { search, suggest } from '../controllers/searchController.js';
import { getHistory, addToHistory, clearHistory } from '../controllers/historyController.js';
import { getFavorites, toggleFavorite, checkFavoriteStatus } from '../controllers/favoriteController.js';
import {
  getPlaylists,
  createPlaylist,
  getPlaylistById,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist
} from '../controllers/playlistController.js';
import { getAutoplayRecommendations } from '../controllers/recommendationController.js';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', getMe);

// Search routes
router.get('/search', search);
router.get('/suggest', suggest);

// History routes
router.get('/history', getHistory);
router.post('/history', addToHistory);
router.delete('/history', clearHistory);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/toggle', toggleFavorite);
router.get('/favorites/check/:videoId', checkFavoriteStatus);

// Playlist routes
router.get('/playlists', getPlaylists);
router.post('/playlists', createPlaylist);
router.get('/playlists/:id', getPlaylistById);
router.delete('/playlists/:id', deletePlaylist);
router.post('/playlists/:id/tracks', addTrackToPlaylist);
router.delete('/playlists/:id/tracks/:videoId', removeTrackFromPlaylist);

// Recommendations routes
router.post('/recommendations/autoplay', getAutoplayRecommendations);

export default router;
