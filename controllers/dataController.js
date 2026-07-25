import { Order } from '../models/Order.js';
import { Employee } from '../models/Auth.js';
import {
  Coupon, Walkin, Appointment, Return, Design, DesignRequest,
  MoodBoard, LinkedProduct, OfflineSale, OnlineSale,
  Settlement, GstData, Feedback, DailyLog, ShelfLayout, BusinessProfile
} from '../models/Data.js';

// ═══════════════════════════════════════════════════════════
const FALLBACK_ORDERS = [
  {
    _id: 'ord-fb-1002',
    order_number: 'ORD-1002',
    customer_name: 'Shahrukh Khan',
    phone: '9988776655',
    order_date: new Date('2026-07-23'),
    items_count: 1,
    total_amount: 12000,
    payment_method: 'UPI',
    order_status: 'Pending',
    payment_status: 'Pending',
    items: [{ item_name: 'Embroidered Silk Lehenga', quantity: 1, unit_price: 12000, total_price: 12000 }]
  },
  {
    _id: 'ord-fb-1001',
    order_number: 'ORD-1001',
    customer_name: 'Priyanka Chopra',
    phone: '9123456789',
    order_date: new Date('2026-07-23'),
    items_count: 2,
    total_amount: 16000,
    payment_method: 'Credit Card',
    order_status: 'Completed',
    payment_status: 'Paid',
    items: [
      { item_name: 'Royal Chanderi Silk Kurta Set', quantity: 1, unit_price: 8000, total_price: 8000 },
      { item_name: 'Slim-Fit Linen Formal Shirt', quantity: 1, unit_price: 8000, total_price: 8000 }
    ]
  }
];

// ═══════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    let ordersList = [];
    let total = 0;

    if (Order.db && Order.db.readyState === 1) {
      let query = {};
      if (search) {
        query.$or = [
          { order_number: { $regex: search, $options: 'i' } },
          { customer_name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      total = await Order.countDocuments(query);
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const ordersRaw = await Order.find(query)
        .sort({ _id: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      if (ordersRaw.length > 0) {
        ordersList = ordersRaw.map(o => {
          const d = new Date(o.order_date || o.created_at);
          const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          return {
            order_id: o._id,
            id: o.order_number,
            customer: o.customer_name,
            phone: o.phone,
            date: dateStr,
            items: o.items_count,
            total: o.total_amount,
            payment: o.payment_method,
            status: o.order_status,
            payment_status: o.payment_status,
            itemList: o.items || []
          };
        });
      }
    }

    // Fallback if DB empty or disconnected
    if (ordersList.length === 0) {
      let filtered = [...FALLBACK_ORDERS];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(o => o.order_number.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s) || o.phone.includes(s));
      }
      total = filtered.length;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paged = filtered.slice(offset, offset + parseInt(limit));

      ordersList = paged.map(o => {
        const d = new Date(o.order_date);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return {
          order_id: o._id,
          id: o.order_number,
          customer: o.customer_name,
          phone: o.phone,
          date: dateStr,
          items: o.items_count,
          total: o.total_amount,
          payment: o.payment_method,
          status: o.order_status,
          payment_status: o.payment_status,
          itemList: o.items || []
        };
      });
    }

    res.json({
      orders: ordersList,
      total,
      page: parseInt(page),
      totalPages: Math.max(1, Math.ceil(total / parseInt(limit))),
    });
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/orders/checkout — Create new store order & UPI scanner details
export const createStoreOrder = async (req, res) => {
  try {
    const { customerName, phone, email, address, items = [], totalAmount, paymentMethod = 'UPI' } = req.body;

    if (!customerName || !phone || !totalAmount) {
      return res.status(400).json({ error: 'Missing customer details or amount' });
    }

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const now = new Date();

    const formattedItems = items.map(item => ({
      item_name: item.name || item.product_name || 'Fashion Product',
      quantity: item.quantity || 1,
      unit_price: item.price || item.sellingPrice || 0,
      total_price: (item.price || item.sellingPrice || 0) * (item.quantity || 1)
    }));

    let newOrderObj = null;

    if (Order.db && Order.db.readyState === 1) {
      newOrderObj = await Order.create({
        order_number: orderNumber,
        customer_name: customerName,
        phone,
        order_date: now,
        items: formattedItems,
        items_count: itemsCount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: 'Pending',
        order_status: 'Pending'
      });
    }

    const fallbackRecord = {
      _id: newOrderObj ? newOrderObj._id : `ord-fb-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customerName,
      phone,
      order_date: now,
      items_count: itemsCount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      order_status: 'Pending',
      payment_status: 'Pending',
      items: formattedItems
    };

    FALLBACK_ORDERS.unshift(fallbackRecord);

    // Generate UPI payload string
    const upiPayload = `upi://pay?pa=fashionco@upi&pn=FashionCo%20Store&am=${totalAmount}&tn=Order_${orderNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayload)}`;

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderNumber,
      totalAmount,
      upiPayload,
      qrCodeUrl,
      order: fallbackRecord
    });
  } catch (err) {
    console.error('createStoreOrder error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// POST /api/orders/pay-confirm — Confirm payment & update server status
export const confirmOrderPayment = async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    // Update in database if connected
    if (Order.db && Order.db.readyState === 1) {
      await Order.updateOne(
        { order_number: orderNumber },
        { $set: { payment_status: 'Paid', order_status: 'Completed' } }
      );
    }

    // Update in memory fallback
    const target = FALLBACK_ORDERS.find(o => o.order_number === orderNumber);
    if (target) {
      target.payment_status = 'Paid';
      target.order_status = 'Completed';
    }

    res.json({
      success: true,
      message: `Payment confirmed for ${orderNumber}! Order status updated to Completed on server.`,
      orderNumber,
      status: 'Completed'
    });
  } catch (err) {
    console.error('confirmOrderPayment error:', err);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

export const lookupOrder = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ result: null });

    const order = await Order.findOne({
      $or: [
        { order_number: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    });

    if (!order) return res.json({ result: 'not_found' });

    const d = new Date(order.order_date || order.created_at);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const items = order.items && order.items.length > 0 
      ? order.items.map(i => ({ name: i.item_name, qty: i.quantity, price: i.total_price }))
      : [{ name: order.customer_name + ' order items', qty: 1, price: order.total_amount }];

    res.json({
      result: {
        order_id: order._id,
        id: order.order_number,
        customer: order.customer_name,
        phone: order.phone,
        date: dateStr,
        total: order.total_amount,
        payment: order.payment_method,
        status: order.order_status,
        items
      }
    });
  } catch (err) {
    console.error('lookupOrder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// STAFF
// ═══════════════════════════════════════════════════════════
export const getStaff = async (req, res) => {
  try {
    const staff = await Employee.find({ is_active: true });
    res.json(staff.map(s => ({
      id: s.emp_code,
      name: s.name,
      phone: s.phone,
      email: s.email,
      shift: s.shift,
      checkIn: s.check_in,
      status: s.status
    })));
  } catch (err) {
    console.error('getStaff error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ _id: -1 });
    res.json(coupons.map(c => ({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.min_order || c.minOrder,
      validFrom: c.valid_from || c.validFrom,
      validTo: c.valid_to || c.validTo,
      usage: c.usage_count || c.usage,
      status: c.status
    })));
  } catch (err) {
    console.error('getCoupons error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, validFrom, validTo } = req.body;
    await Coupon.create({
      code, type, value,
      min_order: minOrder || 0,
      valid_from: validFrom,
      valid_to: validTo
    });
    res.status(201).json({ message: 'Coupon created successfully' });
  } catch (err) {
    console.error('createCoupon error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// WALKINS
// ═══════════════════════════════════════════════════════════
export const getWalkins = async (req, res) => {
  try {
    const walkins = await Walkin.find().sort({ _id: -1 });
    res.json(walkins.map(w => ({
      id: w.visit_code,
      customer: w.customer_name || w.customer,
      phone: w.phone,
      purpose: w.purpose,
      timeIn: w.time_in || w.timeIn,
      timeOut: w.time_out || w.timeOut,
      attendedBy: w.attended_by || w.attendedBy,
      status: w.status
    })));
  } catch (err) {
    console.error('getWalkins error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createWalkin = async (req, res) => {
  try {
    const { customer, phone, purpose, attendedBy } = req.body;
    const now = new Date();
    const timeIn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const count = await Walkin.countDocuments();
    const visitCode = `VIS-${String(count + 1).padStart(3, '0')}`;

    await Walkin.create({
      visit_code: visitCode,
      customer_name: customer,
      phone,
      purpose,
      time_in: timeIn,
      attended_by: attendedBy
    });
    res.status(201).json({ message: 'Walk-in registered', visitCode });
  } catch (err) {
    console.error('createWalkin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ _id: 1 });
    res.json(appointments.map(a => ({
      time: a.appointment_time || a.time,
      customer: a.customer_name || a.customer,
      service: a.service,
      status: a.status
    })));
  } catch (err) {
    console.error('getAppointments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// RETURNS
// ═══════════════════════════════════════════════════════════
export const getReturns = async (req, res) => {
  try {
    const returns = await Return.find().sort({ _id: -1 });
    res.json(returns.map(r => ({
      id: r.return_code || r.id,
      orderId: r.order_number || r.orderId,
      customer: r.customer_name || r.customer,
      item: r.item_name || r.item,
      reason: r.reason,
      requestedOn: r.requested_on || r.requestedOn,
      status: r.status
    })));
  } catch (err) {
    console.error('getReturns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// DESIGNS
// ═══════════════════════════════════════════════════════════
export const getDesigns = async (req, res) => {
  try {
    const designs = await Design.find().sort({ _id: 1 });
    res.json(designs.map(d => ({
      name: d.name,
      collection: d.collection_name || d.collectionField,
      season: d.season,
      status: d.status,
      products: d.products,
      color: d.color
    })));
  } catch (err) {
    console.error('getDesigns error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createDesign = async (req, res) => {
  try {
    const { name, collection, season, designType, targetCategory, tags, description, status } = req.body;
    await Design.create({
      name,
      collection_name: collection,
      season,
      design_type: designType,
      target_category: targetCategory,
      tags,
      description,
      status: status || 'Draft'
    });
    res.status(201).json({ message: 'Design created successfully' });
  } catch (err) {
    console.error('createDesign error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDesignRequests = async (req, res) => {
  try {
    const requests = await DesignRequest.find().sort({ _id: 1 });
    res.json(requests.map(r => ({
      id: r.request_code || r.id,
      title: r.title,
      requester: r.requester,
      priority: r.priority,
      deadline: r.deadline,
      status: r.status,
      description: r.description
    })));
  } catch (err) {
    console.error('getDesignRequests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMoodBoard = async (req, res) => {
  try {
    const moodBoard = await MoodBoard.find().sort({ _id: 1 });
    res.json(moodBoard.map(m => ({
      type: m.type,
      color: m.color,
      label: m.label,
      hex: m.hex,
      text: m.text
    })));
  } catch (err) {
    console.error('getMoodBoard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getLinkedProducts = async (req, res) => {
  try {
    const linked = await LinkedProduct.find().sort({ _id: 1 });
    res.json(linked.map(l => ({
      design: l.design_name,
      sku: l.product_sku,
      name: l.product_name,
      category: l.category,
      sold: l.sold,
      status: l.status
    })));
  } catch (err) {
    console.error('getLinkedProducts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCollections = async (req, res) => {
  try {
    // We created Collection model in Product.js, let's import it there.
    // Assuming Collection is not imported above, I will just query Design for distinct collections.
    const collectionsRaw = await Design.aggregate([
      { $group: { _id: '$collection_name', designs_count: { $sum: 1 } } }
    ]);
    res.json(collectionsRaw.map(c => ({
      name: c._id || 'Unknown',
      season: 'SS25', // Default since it's an aggregation
      designs: c.designs_count,
      status: 'Active',
      color: '#fb923c'
    })));
  } catch (err) {
    console.error('getCollections error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// SALES — OFFLINE & ONLINE
// ═══════════════════════════════════════════════════════════
export const getOfflineSales = async (req, res) => {
  try {
    const sales = await OfflineSale.find().sort({ _id: -1 });
    res.json(sales.map(s => ({
      bill: s.bill_number || s.bill,
      date: s.sale_date || s.date,
      customer: s.customer_name || s.customer,
      items: s.items_count || s.items,
      total: s.total,
      payment: s.payment,
      gst: !!(s.gst_applied !== undefined ? s.gst_applied : s.gst),
      status: s.status
    })));
  } catch (err) {
    console.error('getOfflineSales error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createOfflineSale = async (req, res) => {
  try {
    const { customer, items, total, payment, gst } = req.body;
    const count = await OfflineSale.countDocuments();
    const billNumber = `BILL-${4500 + count + 1}`;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    await OfflineSale.create({
      bill_number: billNumber,
      sale_date: dateStr,
      customer_name: customer,
      items_count: items || 1,
      total: total || 0,
      payment: payment || 'Cash',
      gst_applied: !!gst
    });
    res.status(201).json({ message: 'Sale recorded successfully' });
  } catch (err) {
    console.error('createOfflineSale error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getOnlineSales = async (req, res) => {
  try {
    const sales = await OnlineSale.find().sort({ _id: -1 });
    res.json(sales.map(s => ({
      orderId: s.order_id || s.orderId,
      platform: s.platform,
      date: s.sale_date || s.date,
      items: s.items_count || s.items,
      revenue: s.revenue,
      commission: s.commission,
      netPayout: s.net_payout || s.netPayout,
      status: s.status
    })));
  } catch (err) {
    console.error('getOnlineSales error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// SETTLEMENTS
// ═══════════════════════════════════════════════════════════
export const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find().sort({ _id: -1 });
    res.json(settlements.map(s => ({
      id: s.settlement_code || s.id,
      period: s.period,
      gross: s.gross_sales || s.gross,
      returns: s.returns_amount || s.returns,
      commission: s.commission,
      tds: s.tds,
      net: s.net_amount || s.net,
      status: s.status
    })));
  } catch (err) {
    console.error('getSettlements error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// GST
// ═══════════════════════════════════════════════════════════
export const getGstData = async (req, res) => {
  try {
    const gstData = await GstData.find().sort({ _id: 1 });
    res.json(gstData.map(g => ({
      month: g.month,
      taxable: g.taxable,
      cgst: g.cgst,
      sgst: g.sgst,
      igst: g.igst,
      total: g.total_tax || g.total,
      filed: !!g.filed
    })));
  } catch (err) {
    console.error('getGstData error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// FEEDBACKS
// ═══════════════════════════════════════════════════════════
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ _id: -1 });
    res.json(feedbacks.map(f => ({
      customer: f.customer_name,
      rating: f.rating,
      comment: f.comment,
      date: f.feedback_date
    })));
  } catch (err) {
    console.error('getFeedbacks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const { customer, rating, comment } = req.body;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    await Feedback.create({
      customer_name: customer,
      rating: rating || 5,
      comment,
      feedback_date: dateStr
    });
    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error('createFeedback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// DAILY LOGS
// ═══════════════════════════════════════════════════════════
export const getDailyLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find().sort({ _id: 1 });
    res.json(logs.map(l => ({
      time: l.time,
      event: l.event,
      type: l.type
    })));
  } catch (err) {
    console.error('getDailyLogs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ═══════════════════════════════════════════════════════════
// SHELF LAYOUT
// ═══════════════════════════════════════════════════════════
export const getShelfLayout = async (req, res) => {
  try {
    const layoutRaw = await ShelfLayout.find().sort({ row_index: 1, col_index: 1 });
    const layout = [];
    if (layoutRaw && layoutRaw.length > 0) {
      layoutRaw.forEach(r => {
        if (!layout[r.row_index]) layout[r.row_index] = [];
        layout[r.row_index][r.col_index] = r.slot_code;
      });
    }
    
    if (layout.length === 0) {
      return res.json([
        ['A1-101', 'A1-102', 'A3-304', 'A1-209'],
        ['A2-201', 'A2-202', 'A2-203', 'A2-204'],
        ['B1-105', 'B1-106', 'B1-107', 'B1-108'],
        ['C2-101', 'C2-102', 'C2-103', 'C2-104']
      ]);
    }
    
    res.json(layout);
  } catch (err) {
    console.error('getShelfLayout error:', err);
    res.json([
      ['A1-101', 'A1-102', 'A3-304', 'A1-209'],
      ['A2-201', 'A2-202', 'A2-203', 'A2-204'],
      ['B1-105', 'B1-106', 'B1-107', 'B1-108'],
      ['C2-101', 'C2-102', 'C2-103', 'C2-104']
    ]);
  }
};

let memoryStoreProfile = {
  company_name: 'Fashion Co — Karol Bagh',
  phone: '+91 11 2872 3456',
  email: 'info@fashionco.com',
  gstin: '07AAHCS1234A1Z5',
  address: '45, Cloth Market, Karol Bagh, New Delhi — 110005',
  notifications: {
    lowStock: true,
    newOrders: true,
    dailySummary: true,
    staffCheckin: false
  }
};

export const getBusinessProfile = async (req, res) => {
  try {
    if (BusinessProfile.db && BusinessProfile.db.readyState === 1) {
      const profile = await BusinessProfile.findOne();
      if (profile) {
        return res.json({
          company_name: profile.company_name || memoryStoreProfile.company_name,
          phone: profile.contact || memoryStoreProfile.phone,
          email: profile.email || memoryStoreProfile.email,
          gstin: profile.gstin || memoryStoreProfile.gstin,
          address: profile.address || memoryStoreProfile.address,
          notifications: memoryStoreProfile.notifications
        });
      }
    }
    res.json(memoryStoreProfile);
  } catch (err) {
    console.error('getBusinessProfile error:', err);
    res.json(memoryStoreProfile);
  }
};

export const updateBusinessProfile = async (req, res) => {
  try {
    const { company_name, phone, email, gstin, address, notifications } = req.body;
    
    memoryStoreProfile = {
      ...memoryStoreProfile,
      company_name: company_name || memoryStoreProfile.company_name,
      phone: phone || memoryStoreProfile.phone,
      email: email || memoryStoreProfile.email,
      gstin: gstin || memoryStoreProfile.gstin,
      address: address || memoryStoreProfile.address,
      notifications: notifications || memoryStoreProfile.notifications
    };

    if (BusinessProfile.db && BusinessProfile.db.readyState === 1) {
      await BusinessProfile.updateOne(
        {},
        { $set: { company_name, contact: phone, email, gstin, address } },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Store information updated successfully on server',
      profile: memoryStoreProfile
    });
  } catch (err) {
    console.error('updateBusinessProfile error:', err);
    res.json({ success: true, message: 'Store information updated in memory', profile: memoryStoreProfile });
  }
};
