import { Schema, model } from 'mongoose';

export interface ITrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
}

export interface IPlaylist {
  userId: string;
  name: string;
  description?: string;
  tracks: ITrack[];
  createdAt: Date;
}

const trackSchema = new Schema<ITrack>({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true }
}, { _id: false });

const playlistSchema = new Schema<IPlaylist>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  tracks: { type: [trackSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const PlaylistModel = model<IPlaylist>('Playlist', playlistSchema);
export default PlaylistModel;
