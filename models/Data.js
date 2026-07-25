import mongoose from 'mongoose';

const walkinSchema = new mongoose.Schema({
  visit_code: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  customer: String, // String representation
  phone: String,
  purpose: String,
  time_in: String,
  time_out: { type: String, default: '—' },
  attended_by: String,
  timeIn: String, // For frontend compat
  timeOut: String, // For frontend compat
  attendedBy: String, // For frontend compat
  status: { type: String, default: 'In Store' },
  visit_date: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Walkin = mongoose.model('Walkin', walkinSchema);

const appointmentSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  customer: String, // Frontend compat
  service: String,
  appointment_time: String,
  time: String, // Frontend compat
  appointment_date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Appointment = mongoose.model('Appointment', appointmentSchema);

const returnSchema = new mongoose.Schema({
  return_code: { type: String, required: true, unique: true },
  id: String, // Frontend compat
  order_number: String,
  orderId: String, // Frontend compat
  customer_name: String,
  customer: String, // Frontend compat
  item_name: String,
  item: String, // Frontend compat
  reason: String,
  requested_on: String,
  requestedOn: String, // Frontend compat
  status: { type: String, default: 'Pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Return = mongoose.model('Return', returnSchema);

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
  min_order: { type: Number, default: 0 },
  minOrder: Number, // Frontend compat
  valid_from: String,
  validFrom: String, // Frontend compat
  valid_to: String,
  validTo: String, // Frontend compat
  usage_count: { type: Number, default: 0 },
  usage: Number, // Frontend compat
  status: { type: String, default: 'Active' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Coupon = mongoose.model('Coupon', couponSchema);

const designSchema = new mongoose.Schema({
  name: { type: String, required: true },
  collection_name: String, // MongoDB collection is 'designs' so use collection_name
  collectionField: String, // Frontend compat mapped as 'collection'
  season: String,
  status: { type: String, default: 'Draft' },
  products: { type: Number, default: 0 },
  color: String,
  designer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer' },
  description: String,
  design_type: String,
  target_category: String,
  tags: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Design = mongoose.model('Design', designSchema);

const designRequestSchema = new mongoose.Schema({
  request_code: { type: String, required: true, unique: true },
  id: String, // Frontend compat
  title: { type: String, required: true },
  requester: String,
  priority: { type: String, default: 'Medium' },
  deadline: String,
  status: { type: String, default: 'New' },
  description: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const DesignRequest = mongoose.model('DesignRequest', designRequestSchema);

const moodBoardSchema = new mongoose.Schema({
  type: { type: String, required: true },
  color: String,
  label: String,
  hex: String,
  text: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const MoodBoard = mongoose.model('MoodBoard', moodBoardSchema);

const linkedProductSchema = new mongoose.Schema({
  design_name: String,
  product_sku: String,
  product_name: String,
  category: String,
  sold: { type: Number, default: 0 },
  status: String
});
export const LinkedProduct = mongoose.model('LinkedProduct', linkedProductSchema);

const offlineSaleSchema = new mongoose.Schema({
  bill_number: { type: String, required: true, unique: true },
  bill: String, // Frontend compat
  sale_date: String,
  date: String, // Frontend compat
  customer_name: String,
  customer: String, // Frontend compat
  items_count: { type: Number, default: 0 },
  items: Number, // Frontend compat
  total: { type: Number, default: 0 },
  payment: String,
  gst_applied: { type: Boolean, default: true },
  gst: Boolean, // Frontend compat
  status: { type: String, default: 'Completed' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const OfflineSale = mongoose.model('OfflineSale', offlineSaleSchema);

const onlineSaleSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  orderId: String, // Frontend compat
  platform: String,
  sale_date: String,
  date: String, // Frontend compat
  items_count: { type: Number, default: 0 },
  items: Number, // Frontend compat
  revenue: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  net_payout: { type: Number, default: 0 },
  netPayout: Number, // Frontend compat
  status: { type: String, default: 'Processing' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const OnlineSale = mongoose.model('OnlineSale', onlineSaleSchema);

const settlementSchema = new mongoose.Schema({
  settlement_code: { type: String, required: true, unique: true },
  id: String, // Frontend compat
  period: String,
  gross_sales: { type: Number, default: 0 },
  gross: Number, // Frontend compat
  returns_amount: { type: Number, default: 0 },
  returns: Number, // Frontend compat
  commission: { type: Number, default: 0 },
  tds: { type: Number, default: 0 },
  net_amount: { type: Number, default: 0 },
  net: Number, // Frontend compat
  status: { type: String, default: 'Pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Settlement = mongoose.model('Settlement', settlementSchema);

const gstDataSchema = new mongoose.Schema({
  month: { type: String, required: true },
  taxable: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  total: Number, // Frontend compat
  filed: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const GstData = mongoose.model('GstData', gstDataSchema);

const monthlyRevenueSchema = new mongoose.Schema({
  month: { type: String, required: true },
  value: { type: Number, default: 0 },
  year: { type: Number, default: 2025 }
});
export const MonthlyRevenue = mongoose.model('MonthlyRevenue', monthlyRevenueSchema);

const feedbackSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  rating: { type: Number, default: 5 },
  comment: String,
  feedback_date: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Feedback = mongoose.model('Feedback', feedbackSchema);

const dailyLogSchema = new mongoose.Schema({
  time: String,
  event: String,
  type: String,
  log_date: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

const shelfLayoutSchema = new mongoose.Schema({
  row_index: { type: Number, required: true },
  col_index: { type: Number, required: true },
  slot_code: { type: String, required: true, unique: true }
});
export const ShelfLayout = mongoose.model('ShelfLayout', shelfLayoutSchema);

const businessProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company_name: String,
  business_type: String,
  zone: String,
  tp_area: String,
  gstin: String,
  pan: String,
  contact: String,
  account_manager: String,
  partner_since: String,
  address: String,
  status: { type: String, default: 'Active' }
});
export const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
