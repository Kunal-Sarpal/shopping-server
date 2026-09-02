import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  role_name: { type: String, required: true, unique: true },
  description: String,
  is_active: { type: Boolean, default: true }
});
export const Role = mongoose.model('Role', roleSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  role: String, // Storing role name directly for easier querying (from previous logic)
  initials: String,
  phone: String,
  default_address: String,
  addresses: [{
    id: String,
    name: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
    tag: { type: String, default: 'Home' },
    isDefault: { type: Boolean, default: false }
  }],
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const User = mongoose.model('User', userSchema);

const employeeSchema = new mongoose.Schema({
  emp_code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  department: String,
  shift: String,
  check_in: String,
  status: { type: String, default: 'Present' },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Employee = mongoose.model('Employee', employeeSchema);
