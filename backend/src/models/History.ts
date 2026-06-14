import { Schema, model } from 'mongoose';

export interface IHistory {
  userId: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  playedAt: Date;
  plays: number;
}

const historySchema = new Schema<IHistory>({
  userId: { type: String, required: true, index: true },
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
  plays: { type: Number, default: 1 }
});

// Compound index to search for history items by user and video easily
historySchema.index({ userId: 1, videoId: 1 });

export const HistoryModel = model<IHistory>('History', historySchema);
export default HistoryModel;
