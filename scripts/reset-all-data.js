// scripts/reset-all-data.js
require('module-alias/register');
require('dotenv').config();
const mongoose = require('mongoose');
const Reservation = require('~/models/Reservation');
const Seat = require('~/models/Seat');
const { SEAT_STATUS } = require('~/constants');

async function resetAllData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookticket');
    console.log('Connected to MongoDB');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all reservations
      const deleteResult = await Reservation.deleteMany({}).session(session);
      console.log(`Deleted ${deleteResult.deletedCount} reservations`);

      // Reset all seats to available
      const updateResult = await Seat.updateMany(
        {},
        {
          $set: {
            status: SEAT_STATUS.AVAILABLE,
            reservedBy: ''
          }
        },
        { session }
      );
      console.log(`Updated ${updateResult.modifiedCount} seats to available`);

      await session.commitTransaction();
      console.log('✅ All reservations deleted and seats reset successfully');

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run reset if this script is executed directly
if (require.main === module) {
  resetAllData();
}

module.exports = resetAllData;