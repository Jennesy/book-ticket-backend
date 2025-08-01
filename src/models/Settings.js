// models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['open'] // Controls whether booking/reservations are allowed
  },
  value: { 
    type: Boolean, 
    required: true,
    default: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);