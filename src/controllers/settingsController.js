// src/controllers/settingsController.js
const Settings = require('~/models/Settings');
const { emitBookingStatusChanged } = require('~/utils/socketUtils');

exports.getBookingStatus = async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: 'open' });
    
    // If setting doesn't exist, create it with default value
    if (!setting) {
      setting = new Settings({ key: 'open', value: true });
      await setting.save();
    }
    
    res.json({ 
      open: setting.value,
      updatedAt: setting.updatedAt 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { open } = req.body;
  
  if (typeof open !== 'boolean') {
    return res.status(400).json({ message: 'open must be a boolean value' });
  }
  
  try {
    let setting = await Settings.findOneAndUpdate(
      { key: 'open' },
      { 
        value: open,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );
    
    // Emit booking status change to all clients
    emitBookingStatusChanged(open);
    
    res.json({ 
      message: `Booking ${open ? 'opened' : 'closed'} successfully`,
      open: setting.value,
      updatedAt: setting.updatedAt 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};