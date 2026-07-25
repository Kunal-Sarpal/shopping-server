import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  event_type: { type: String, required: true }, // 'page_view', 'click', 'add_to_cart', 'filter_change'
  page: { type: String, required: true },
  element_id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  session_id: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
