// src/utils/sheetSync.js
const axios = require('axios');

/**
 * Sync reservation data to Google Sheets
 * @param {Object} reservationData - The reservation data to sync
 * @param {string} reservationData.userName - User name
 * @param {Array} reservationData.seats - Array of seat objects with row, col, price
 * @param {number} reservationData.totalPrice - Total price
 * @param {number} reservationData.programBookCount - Number of program books
 * @param {string} reservationData.account - Account/contact info
 */
async function syncToSheet(reservationData) {
  const { userName, seats, totalPrice, programBookCount, account } = reservationData;
  
  // Group seats by price
  const selectedSeatLabelsByPrice = seats.reduce((acc, seat) => {
    acc[seat.price] = acc[seat.price] || [];
    acc[seat.price].push(`${seat.row}${seat.col}`);
    return acc;
  }, {});

  const payload = {
    selectedSeatLabelsByPrice,
    totalPrice,
    programBookCount,
    userName,
    account: account ? `'${String(account)}` : '', // 在 account 前加上單引號強制為文字格式
    name: userName,
    date: new Date().toLocaleDateString(),
  };

  try {
    const response = await axios.post(process.env.GSHEET_WEBHOOK, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.status === 200) {
      console.log('✅ 同步到試算表成功');
    } else {
      console.warn('⚠️ 試算表同步回應異常:', response.status);
    }
  } catch (error) {
    console.error('❌ 同步到試算表失敗:', error.message);
  }
}

module.exports = {
  syncToSheet
};