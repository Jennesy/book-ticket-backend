// src/config/discountConfig.js

const discountConfig = {
  // 節目冊折扣
  programBook: {
    originalPrice: 150,
    memberPrice: 120
  },

  // 團員折扣 (適用於特定票價)
  memberDiscount: {
    // 適用票價
    applicablePrices: [800, 1000],
    // 折扣率 (85折 = 0.85)
    discountRate: 0.85
  },

  // 團購優惠 (滿件數折扣) - 限時優惠到 2025/9/24
  groupDiscount: {
    endDate: '2025-09-24T23:59:59+08:00', // 台灣時間 2025/9/24 23:59:59
    rules: [
      {
        price: 1200,
        minQuantity: 4,
        discountRate: 0.9 // 9折
      },
      {
        price: 1000,
        minQuantity: 6,
        discountRate: 0.8 // 8折
      },
      {
        price: 800,
        minQuantity: 8,
        discountRate: 0.8 // 8折
      }
    ]
  }
};

module.exports = discountConfig;