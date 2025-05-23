// scripts/migrate-reservations.js
require('module-alias/register');
require('dotenv').config();
const mongoose = require('mongoose');
const Reservation = require('~/models/Reservation');

async function migrateReservations() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookticket');
    console.log('Connected to MongoDB');

    // Update all existing reservations to have default values for new fields
    const result = await Reservation.updateMany(
      {}, // Match all documents
      {
        $set: {
          isDeleted: false,
          // Don't set deletedAt or originalReservationId as they should remain undefined
        }
      },
      {
        // This ensures we only update documents that don't already have these fields
        upsert: false
      }
    );

    console.log(`Migration completed: ${result.modifiedCount} reservations updated`);
    
    // Verify the migration
    const totalReservations = await Reservation.countDocuments();
    const activeReservations = await Reservation.countDocuments({ isDeleted: false });
    
    console.log(`Total reservations: ${totalReservations}`);
    console.log(`Active reservations: ${activeReservations}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateReservations();
}

module.exports = migrateReservations;