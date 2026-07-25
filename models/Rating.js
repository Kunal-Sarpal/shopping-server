import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  product_id: { type: String, required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_name: { type: String, default: 'Anonymous' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
  admin_reply: { type: String, default: '' },
  admin_reply_at: { type: Date },
  created_at: { type: Date, default: Date.now },
});

export const Rating = mongoose.model('Rating', ratingSchema);
