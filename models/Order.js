import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  email: String,
  phone: String,
  gender: String,
  dob: Date,
  default_address: String,
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Customer = mongoose.model('Customer', customerSchema);

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  item_name: String,
  quantity: { type: Number, default: 1 },
  unit_price: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 }
});

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: String,
  phone: String,
  order_date: { type: Date, required: true },
  items: [orderItemSchema],
  items_count: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  payment_status: { type: String, default: 'Pending' },
  payment_method: String,
  order_status: { type: String, default: 'Pending' },
  total: { type: Number, default: 0 },
  net_amount: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Order = mongoose.model('Order', orderSchema);
