import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { Role, User, Employee } from '../models/Auth.js';
import { Product, Category, SubCategory, Designer, Supplier, Brand, Collection } from '../models/Product.js';
import { Customer, Order } from '../models/Order.js';
import { Walkin, Appointment, Return, Coupon, Design, DesignRequest, MoodBoard, LinkedProduct, OfflineSale, OnlineSale, Settlement, GstData, MonthlyRevenue, Feedback, DailyLog, ShelfLayout, BusinessProfile } from '../models/Data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fashion_erp');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Role.deleteMany(), User.deleteMany(), Employee.deleteMany(),
      Product.deleteMany(), Category.deleteMany(), SubCategory.deleteMany(), Designer.deleteMany(), Supplier.deleteMany(), Brand.deleteMany(), Collection.deleteMany(),
      Customer.deleteMany(), Order.deleteMany(),
      Walkin.deleteMany(), Appointment.deleteMany(), Return.deleteMany(), Coupon.deleteMany(), Design.deleteMany(), DesignRequest.deleteMany(), MoodBoard.deleteMany(), LinkedProduct.deleteMany(), OfflineSale.deleteMany(), OnlineSale.deleteMany(), Settlement.deleteMany(), GstData.deleteMany(), MonthlyRevenue.deleteMany(), Feedback.deleteMany(), DailyLog.deleteMany(), ShelfLayout.deleteMany(), BusinessProfile.deleteMany()
    ]);
    console.log('Cleared existing data');

    // Seed Roles & Users
    const roleManager = await Role.create({ role_name: 'Manager', description: 'Full access' });
    const roleReceptionist = await Role.create({ role_name: 'Receptionist', description: 'Walk-ins, Appointments' });
    const roleDesigner = await Role.create({ role_name: 'Designer', description: 'Designs, Moodboards' });
    const rolePartner = await Role.create({ role_name: 'Partner', description: 'Sales, Reports' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    const surajHash = await bcrypt.hash('suraj@123', salt);

    await User.create([
      { name: 'Suraj Admin', email: 'suraj85399@gmail.com', password: surajHash, role_id: roleManager._id, role: 'Manager', initials: 'SA' },
      { name: 'Suraj Demo', email: 'manager@fashionco.com', password: hash, role_id: roleManager._id, role: 'Manager', initials: 'SD' },
      { name: 'Receptionist', email: 'reception@fashionco.com', password: hash, role_id: roleReceptionist._id, role: 'Receptionist', initials: 'RC' },
      { name: 'Designer', email: 'designer@fashionco.com', password: hash, role_id: roleDesigner._id, role: 'Designer', initials: 'DS' },
      { name: 'Partner', email: 'partner@fashionco.com', password: hash, role_id: rolePartner._id, role: 'Partner', initials: 'PT' }
    ]);

    await Employee.create([
      { emp_code: 'EMP-001', name: 'Alia Bhatt', phone: '9876543210', email: 'alia@example.com', department: 'Sales', shift: 'Morning', check_in: '09:00 AM' },
      { emp_code: 'EMP-002', name: 'Ranbir Kapoor', phone: '9876543211', email: 'ranbir@example.com', department: 'Inventory', shift: 'Evening', check_in: '02:00 PM' }
    ]);

    // Seed Products
    const cat = await Category.create({ category_name: 'Ethnic Wear', description: 'Traditional Indian Wear' });
    const des = await Designer.create({ designer_name: 'Manish Malhotra' });
    const sup = await Supplier.create({ supplier_name: 'Fabrics India Ltd.' });
    
    await Product.create([
      { sku: 'SKU-001', product_name: 'Embroidered Lehenga', category_id: cat._id, category: 'Ethnic Wear', designer_id: des._id, designer: 'Manish Malhotra', supplier_id: sup._id, vendor: 'Fabrics India Ltd.', mrp: 15000, costPrice: 8000, sellingPrice: 12000, stock: 15, sold: 5, status: 'In Stock', shelf: 'A1' },
      { sku: 'SKU-002', product_name: 'Silk Kurta', category_id: cat._id, category: 'Ethnic Wear', designer_id: des._id, designer: 'Manish Malhotra', supplier_id: sup._id, vendor: 'Fabrics India Ltd.', mrp: 5000, costPrice: 2000, sellingPrice: 4000, stock: 5, sold: 10, status: 'Low Stock', shelf: 'A2' }
    ]);

    // Seed Orders
    await Order.create([
      { order_number: 'ORD-1001', customer_name: 'Priyanka Chopra', phone: '9123456789', order_date: new Date(), items_count: 2, total_amount: 16000, payment_method: 'Credit Card', order_status: 'Completed' },
      { order_number: 'ORD-1002', customer_name: 'Shahrukh Khan', phone: '9988776655', order_date: new Date(), items_count: 1, total_amount: 12000, payment_method: 'UPI', order_status: 'Pending' }
    ]);

    // Seed Other Data
    await MonthlyRevenue.create([
      { month: 'Jan', value: 450000, year: 2025 },
      { month: 'Feb', value: 520000, year: 2025 },
      { month: 'Mar', value: 610000, year: 2025 }
    ]);

    await Coupon.create([
      { code: 'FESTIVAL20', type: 'Percentage', value: '20', min_order: 5000, valid_from: '2025-01-01', valid_to: '2025-12-31', usage_count: 45, status: 'Active' },
      { code: 'WELCOME500', type: 'Flat', value: '500', min_order: 2000, valid_from: '2025-01-01', valid_to: '2025-12-31', usage_count: 120, status: 'Active' }
    ]);

    await Walkin.create([
      { visit_code: 'VIS-001', customer_name: 'Deepika Padukone', phone: '9998887776', purpose: 'Purchase', time_in: '10:30 AM', time_out: '11:45 AM', attended_by: 'Alia Bhatt', status: 'Completed' }
    ]);

    await Appointment.create([
      { customer_name: 'Virat Kohli', service: 'Custom Fitting', appointment_time: '04:00 PM', status: 'Pending' }
    ]);

    await Feedback.create([
      { customer_name: 'Anushka Sharma', rating: 5, comment: 'Amazing collection and great service!', feedback_date: '25 Jan 2025' }
    ]);
    
    await Design.create([
      { name: 'Summer Breeze Collection', collection_name: 'SS25', season: 'Summer', status: 'Published', products: 12, color: '#facc15' }
    ]);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedDB();
