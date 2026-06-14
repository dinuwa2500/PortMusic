import { Schema, model } from 'mongoose';

export interface IFavorite {
  userId: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  likedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true, index: true },
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true },
  likedAt: { type: Date, default: Date.now }
});

// Unique index so a user can only favorite a specific video once
favoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export const FavoriteModel = model<IFavorite>('Favorite', favoriteSchema);
export default FavoriteModel;
