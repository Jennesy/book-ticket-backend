// src/utils/discountCalculator.js
const discountConfig = require('~/config/discountConfig');

/**
 * 檢查團購優惠是否仍在有效期內
 * @returns {boolean} 團購優惠是否有效
 */
function isGroupDiscountActive() {
  const now = new Date();
  const groupDiscountEndDate = new Date(discountConfig.groupDiscount.endDate);
  return now <= groupDiscountEndDate;
}

/**
 * 計算節目冊總價
 * @param {number} quantity - 節目冊數量
 * @param {boolean} isMember - 是否為團員
 * @returns {Object} 節目冊價格明細
 */
function calculateProgramBookPrice(quantity, isMember = false) {
  if (quantity <= 0) {
    return {
      originalTotal: 0,
      discountedTotal: 0,
      discount: 0,
      unitPrice: isMember ? discountConfig.programBook.memberPrice : discountConfig.programBook.originalPrice
    };
  }

  const unitPrice = isMember ? discountConfig.programBook.memberPrice : discountConfig.programBook.originalPrice;
  const originalTotal = quantity * discountConfig.programBook.originalPrice;
  const discountedTotal = quantity * unitPrice;
  const discount = originalTotal - discountedTotal;

  return {
    originalTotal,
    discountedTotal,
    discount,
    unitPrice
  };
}

/**
 * 計算座位總價（包含團員折扣和團購優惠）
 * @param {Array} seats - 座位陣列，每個座位包含 { row, col, price }
 * @param {boolean} isMember - 是否為團員
 * @returns {Object} 座位價格明細
 */
function calculateSeatsPrice(seats, isMember = false) {
  if (!seats || seats.length === 0) {
    return {
      originalTotal: 0,
      discountedTotal: 0,
      discount: 0,
      seatsByPrice: {},
      appliedDiscounts: []
    };
  }

  // 依票價分組座位
  const seatsByPrice = seats.reduce((acc, seat) => {
    acc[seat.price] = acc[seat.price] || [];
    acc[seat.price].push(seat);
    return acc;
  }, {});

  let originalTotal = 0;
  let discountedTotal = 0;
  const appliedDiscounts = [];

  // 計算各票價的價格
  for (const [priceStr, seatsInGroup] of Object.entries(seatsByPrice)) {
    const price = parseInt(priceStr);
    const quantity = seatsInGroup.length;
    const subtotal = price * quantity;
    originalTotal += subtotal;

    let finalPrice = price;
    let discountInfo = [];

    // 1. 團員折扣（適用於800、1000票價）
    if (isMember && discountConfig.memberDiscount.applicablePrices.includes(price)) {
      finalPrice = Math.round(price * discountConfig.memberDiscount.discountRate);
      discountInfo.push({
        type: 'member',
        description: `團員${Math.round((1 - discountConfig.memberDiscount.discountRate) * 100)}%折扣`,
        originalPrice: price,
        discountedPrice: finalPrice
      });
    }

    // 2. 團購優惠（檢查是否滿足條件且在有效期內）
    if (isGroupDiscountActive()) {
      const groupDiscountRule = discountConfig.groupDiscount.rules.find(rule => 
        rule.price === price && quantity >= rule.minQuantity
      );
      
      if (groupDiscountRule) {
        const groupDiscountedPrice = Math.round(price * groupDiscountRule.discountRate);
        
        // 如果團購優惠比團員折扣更划算，使用團購優惠
        if (groupDiscountedPrice < finalPrice) {
          finalPrice = groupDiscountedPrice;
          discountInfo = [{
            type: 'group',
            description: `滿${groupDiscountRule.minQuantity}張${Math.round((1 - groupDiscountRule.discountRate) * 100)}%折 (限時到9/24)`,
            originalPrice: price,
            discountedPrice: finalPrice,
            minQuantity: groupDiscountRule.minQuantity,
            actualQuantity: quantity,
            validUntil: discountConfig.groupDiscount.endDate
          }];
        }
      }
    }

    const groupTotal = finalPrice * quantity;
    discountedTotal += groupTotal;

    if (discountInfo.length > 0) {
      appliedDiscounts.push({
        price,
        quantity,
        discounts: discountInfo,
        subtotal: groupTotal
      });
    }

    seatsByPrice[priceStr] = {
      seats: seatsInGroup,
      quantity,
      originalUnitPrice: price,
      discountedUnitPrice: finalPrice,
      originalSubtotal: subtotal,
      discountedSubtotal: groupTotal
    };
  }

  return {
    originalTotal,
    discountedTotal,
    discount: originalTotal - discountedTotal,
    seatsByPrice,
    appliedDiscounts
  };
}

/**
 * 計算完整訂單價格
 * @param {Array} seats - 座位陣列
 * @param {number} programBookCount - 節目冊數量
 * @param {boolean} isMember - 是否為團員
 * @returns {Object} 完整價格明細
 */
function calculateOrderPrice(seats, programBookCount, isMember = false) {
  const seatsPrice = calculateSeatsPrice(seats, isMember);
  const programBookPrice = calculateProgramBookPrice(programBookCount, isMember);

  return {
    seats: seatsPrice,
    programBooks: programBookPrice,
    originalTotal: seatsPrice.originalTotal + programBookPrice.originalTotal,
    discountedTotal: seatsPrice.discountedTotal + programBookPrice.discountedTotal,
    totalDiscount: seatsPrice.discount + programBookPrice.discount,
    isMember
  };
}

module.exports = {
  calculateProgramBookPrice,
  calculateSeatsPrice,
  calculateOrderPrice,
  isGroupDiscountActive
};