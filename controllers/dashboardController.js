import { Order } from '../models/Order.js';
import { Product, Category } from '../models/Product.js';
import { Coupon, MonthlyRevenue, Walkin, Appointment, Return, Feedback, Design, LinkedProduct, OnlineSale, OfflineSale, Settlement } from '../models/Data.js';

// GET /api/dashboard/manager — Manager dashboard stats
export const getManagerDashboard = async (req, res) => {
  try {
    // Total revenue
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    // Orders today count (approximate by matching today's date string if needed, or by Date object)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersToday = await Order.countDocuments({
      order_date: { $gte: today, $lt: tomorrow }
    });

    // Low stock items
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lt: 25 } });

    // Active coupons
    const activeCoupons = await Coupon.countDocuments({ status: 'Active' });

    // Monthly revenue
    const monthlyRevenueRaw = await MonthlyRevenue.find().sort({ _id: 1 });
    const monthlyRevenue = monthlyRevenueRaw.map(m => ({ month: m.month, value: m.value }));

    // Recent orders
    const recentOrdersRaw = await Order.find().sort({ _id: -1 }).limit(5);
    const recentOrders = recentOrdersRaw.map(o => ({
      id: o.order_number,
      customer: o.customer_name,
      items: o.items_count,
      total: o.total_amount,
      status: o.order_status
    }));

    // Category-wise inventory (Aggregation)
    const categoryDataAgg = await Product.aggregate([
      { $group: { _id: '$category', value: { $sum: '$stock' } } },
      { $match: { _id: { $ne: null } } }
    ]);
    const categoryData = categoryDataAgg.map(c => ({ label: c._id, value: c.value }));

    res.json({
      stats: { totalRevenue, ordersToday, lowStock, activeCoupons },
      monthlyRevenue,
      recentOrders,
      categoryData,
    });
  } catch (err) {
    console.error('getManagerDashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/dashboard/receptionist
export const getReceptionistDashboard = async (req, res) => {
  try {
    const walkinsToday = await Walkin.countDocuments();
    const pendingFittings = await Appointment.countDocuments({ status: 'Pending' });
    const pendingReturns = await Return.countDocuments({ status: 'Pending' });
    const feedbackCollected = await Feedback.countDocuments();

    const appointmentsRaw = await Appointment.find().sort({ _id: 1 }).limit(4);
    const appointments = appointmentsRaw.map(a => ({
      time: a.appointment_time || a.time,
      customer: a.customer_name || a.customer,
      service: a.service,
      status: a.status
    }));

    const walkinsRaw = await Walkin.find().sort({ _id: -1 }).limit(4);
    const walkins = walkinsRaw.map(w => ({
      id: w.visit_code,
      customer: w.customer_name || w.customer,
      phone: w.phone,
      purpose: w.purpose,
      timeIn: w.time_in || w.timeIn,
      timeOut: w.time_out || w.timeOut,
      attendedBy: w.attended_by || w.attendedBy,
      status: w.status
    }));

    res.json({
      stats: { walkinsToday, pendingFittings, pendingReturns, feedbackCollected },
      appointments,
      walkins,
    });
  } catch (err) {
    console.error('getReceptionistDashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/dashboard/designer
export const getDesignerDashboard = async (req, res) => {
  try {
    const designsPublished = await Design.countDocuments({ status: 'Published' });
    const pendingReview = await Design.countDocuments({ status: { $in: ['Under Review', 'Draft'] } });
    const linkedProducts = await LinkedProduct.countDocuments();

    const recentDesignsRaw = await Design.find().sort({ _id: 1 }).limit(3);
    const recentDesigns = recentDesignsRaw.map(d => ({
      name: d.name,
      collection: d.collection_name || d.collectionField,
      season: d.season,
      status: d.status,
      products: d.products,
      color: d.color
    }));

    res.json({
      stats: { designsPublished, pendingReview, linkedProducts },
      recentDesigns,
    });
  } catch (err) {
    console.error('getDesignerDashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/dashboard/partner
export const getPartnerDashboard = async (req, res) => {
  try {
    const onlineSalesRaw = await OnlineSale.find();
    const onlineSales = onlineSalesRaw.reduce((sum, s) => sum + (s.revenue || 0), 0);

    const offlineSalesRaw = await OfflineSale.find();
    const offlineSales = offlineSalesRaw.reduce((sum, s) => sum + (s.total || 0), 0);

    const pendingSettlementsRaw = await Settlement.find({ status: 'Pending' });
    const pendingPayouts = pendingSettlementsRaw.reduce((sum, s) => sum + (s.net_amount || s.net || 0), 0);

    const recentOfflineRaw = await OfflineSale.find().sort({ _id: -1 }).limit(4);
    const recentOffline = recentOfflineRaw.map(r => ({
      bill: r.bill_number || r.bill,
      date: r.sale_date || r.date,
      customer: r.customer_name || r.customer,
      items: r.items_count || r.items,
      total: r.total,
      payment: r.payment,
      gst: !!(r.gst_applied !== undefined ? r.gst_applied : r.gst),
      status: r.status
    }));

    // Platform breakdown
    const platformDataAgg = await OnlineSale.aggregate([
      { $group: { _id: '$platform', revenue: { $sum: '$revenue' } } },
      { $sort: { revenue: -1 } }
    ]);
    const platformData = platformDataAgg.map(p => ({ platform: p._id, revenue: p.revenue }));

    res.json({
      stats: {
        totalRevenue: onlineSales + offlineSales,
        onlineSales,
        offlineSales,
        pendingPayouts,
      },
      recentOffline,
      platformData,
    });
  } catch (err) {
    console.error('getPartnerDashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
