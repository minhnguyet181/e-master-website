// src/services/studyRequirement.service.js
/**
 * Study Requirement Service - Tính toán yêu cầu thời gian học
 * 
 * Tính toán:
 * - Số giờ học tối thiểu mỗi tuần để đạt band mục tiêu
 * - Thời gian ước tính (tuần/tháng) để đạt band
 * - Dựa trên gap giữa current band và target band
 */

/**
 * Tính yêu cầu thời gian học để đạt band mục tiêu
 * 
 * @param {string} currentBand - Band hiện tại (ví dụ: "Band 5.0", "5.5")
 * @param {string} targetBand - Band mục tiêu (ví dụ: "Band 7.0", "7.5")
 * @param {number} studyHoursPerWeek - Số giờ học mỗi tuần (optional, để tính thời gian)
 * @returns {Object} - Yêu cầu và ước tính thời gian
 */
function calculateStudyRequirements(currentBand, targetBand, studyHoursPerWeek = null) {
  try {
    // Extract band numbers
    const currentNum = parseFloat(currentBand.replace(/[^0-9.]/g, '')) || 0;
    const targetNum = parseFloat(targetBand.replace(/[^0-9.]/g, '')) || 0;

    if (currentNum >= targetNum) {
      return {
        success: true,
        message: 'Bạn đã đạt hoặc vượt band mục tiêu!',
        band_gap: 0,
        minimum_hours_per_week: 0,
        estimated_weeks: 0,
        estimated_months: 0
      };
    }

    const bandGap = targetNum - currentNum;

    // ========== Tính yêu cầu giờ học tối thiểu mỗi tuần ==========
    // Dựa trên research về IELTS improvement:
    // - 0.5 band improvement = ~4-6 weeks với 10-15 hours/week
    // - 1.0 band improvement = ~8-12 weeks với 10-15 hours/week
    // - 2.0 band improvement = ~16-24 weeks với 10-15 hours/week

    let minimumHoursPerWeek;

    if (bandGap <= 0.5) {
      minimumHoursPerWeek = 8; // 8-10 hours/week cho 0.5 band
    } else if (bandGap <= 1.0) {
      minimumHoursPerWeek = 10; // 10-12 hours/week cho 1.0 band
    } else if (bandGap <= 1.5) {
      minimumHoursPerWeek = 12; // 12-15 hours/week cho 1.5 band
    } else if (bandGap <= 2.0) {
      minimumHoursPerWeek = 15; // 15-18 hours/week cho 2.0 band
    } else {
      minimumHoursPerWeek = 18; // 18+ hours/week cho >2.0 band
    }

    // ========== Tính thời gian ước tính ==========
    // Improvement rate: ~0.5 band per 6-8 weeks với 10-15 hours/week
    // Formula: weeks = (bandGap / 0.5) * 7 (trung bình 7 weeks cho 0.5 band)
    const baseWeeksPerHalfBand = 7; // 7 weeks để tăng 0.5 band
    const estimatedWeeks = Math.ceil((bandGap / 0.5) * baseWeeksPerHalfBand);

    // Adjust nếu user có study hours cụ thể
    let adjustedWeeks = estimatedWeeks;
    if (studyHoursPerWeek) {
      // Nếu học ít hơn minimum, thời gian sẽ lâu hơn
      if (studyHoursPerWeek < minimumHoursPerWeek) {
        const ratio = minimumHoursPerWeek / studyHoursPerWeek;
        adjustedWeeks = Math.ceil(estimatedWeeks * ratio);
      }
      // Nếu học nhiều hơn minimum, có thể nhanh hơn một chút (nhưng không quá nhiều)
      else if (studyHoursPerWeek > minimumHoursPerWeek * 1.5) {
        adjustedWeeks = Math.ceil(estimatedWeeks * 0.8); // Giảm 20% thời gian
      }
    }

    const estimatedMonths = Math.ceil(adjustedWeeks / 4);

    // ========== Generate recommendations ==========
    const recommendations = [];

    if (studyHoursPerWeek && studyHoursPerWeek < minimumHoursPerWeek) {
      recommendations.push(
        `⚠️ Bạn đang học ${studyHoursPerWeek} giờ/tuần, nhưng cần ít nhất ${minimumHoursPerWeek} giờ/tuần để đạt band mục tiêu trong thời gian hợp lý.`
      );
      recommendations.push(
        `💡 Đề xuất: Tăng thời gian học lên ${minimumHoursPerWeek}+ giờ/tuần để đạt mục tiêu trong ${estimatedMonths} tháng.`
      );
    } else if (studyHoursPerWeek && studyHoursPerWeek >= minimumHoursPerWeek) {
      recommendations.push(
        `✅ Thời gian học của bạn (${studyHoursPerWeek} giờ/tuần) phù hợp để đạt band mục tiêu trong ${estimatedMonths} tháng.`
      );
    } else {
      recommendations.push(
        `📚 Để đạt band mục tiêu, bạn cần học ít nhất ${minimumHoursPerWeek} giờ mỗi tuần.`
      );
    }

    recommendations.push(
      `⏱️ Ước tính thời gian: ${estimatedMonths} tháng (${adjustedWeeks} tuần) với ${studyHoursPerWeek || minimumHoursPerWeek} giờ/tuần.`
    );

    if (bandGap > 2.0) {
      recommendations.push(
        `🎯 Gap lớn (${bandGap.toFixed(1)} bands). Đề xuất chia nhỏ mục tiêu: đặt milestone ở ${(currentNum + 1.0).toFixed(1)} trước, sau đó mới nhắm ${targetNum.toFixed(1)}.`
      );
    }

    return {
      success: true,
      current_band: currentBand,
      target_band: targetBand,
      band_gap: parseFloat(bandGap.toFixed(1)),
      minimum_hours_per_week: minimumHoursPerWeek,
      estimated_weeks: adjustedWeeks,
      estimated_months: estimatedMonths,
      recommendations,
      study_schedule: {
        hours_per_week: studyHoursPerWeek || minimumHoursPerWeek,
        hours_per_day: Math.ceil((studyHoursPerWeek || minimumHoursPerWeek) / 7),
        days_per_week: 6 // Recommend 6 days/week
      }
    };

  } catch (error) {
    console.error('❌ Error calculating study requirements:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get study requirements cho user
 * 
 * @param {number} userId - ID user
 * @returns {Object} - Study requirements
 */
async function getUserStudyRequirements(userId) {
  try {
    const User = require('../models/user.model');
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Lấy current band (từ placement test hoặc user profile)
    const currentBand = user.current_band || user.band_target || 'Band 5.0';
    const targetBand = user.band_target || 'Band 7.0';
    const studyHoursPerWeek = user.study_hours_per_day 
      ? user.study_hours_per_day * 7 
      : null;

    const requirements = calculateStudyRequirements(
      currentBand,
      targetBand,
      studyHoursPerWeek
    );

    return {
      success: true,
      user_id: userId,
      ...requirements
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  calculateStudyRequirements,
  getUserStudyRequirements
};

