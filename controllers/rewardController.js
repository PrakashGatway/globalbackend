const Reward = require('../models/Reward')
const User = require('../models/User')
const { paginate } = require('../utils/pagination')

// @desc    Get user's rewards
// @route   GET /api/rewards/my-rewards
// @access  Private
exports.getMyRewards = async (req, res) => {
  try {
    const userId = req.user._id

    let reward = await Reward.findOne({ user: userId })

    if (!reward) {
      // Create reward record if it doesn't exist
      reward = await Reward.create({
        user: userId,
        points: 0,
        cashback: 0,
      })
    }

    // Calculate point value in rupees
    const pointsValueInRupees = reward.points * reward.pointToRupeeRate

    res.json({
      success: true,
      data: {
        points: reward.points,
        cashback: reward.cashback,
        pointsValueInRupees: parseFloat(pointsValueInRupees.toFixed(2)),
        pointToRupeeRate: reward.pointToRupeeRate,
        totalEarned: reward.totalEarned,
        totalRedeemed: reward.totalRedeemed,
        // Conversion info: 500 points = ?
        conversionInfo: {
          minValue: 500 * 0.02, // 10rs
          maxValue: 500 * 0.2, // 100rs
          currentValue: 500 * reward.pointToRupeeRate,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get all rewards (Admin/Manager only)
// @route   GET /api/rewards
// @access  Private (Admin/Manager)
exports.getRewards = async (req, res) => {
  try {
    // Check if user is admin or manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Manager access required.',
      })
    }

    const { data, pagination } = await paginate(
      Reward,
      {},
      req,
      {
        populate: { path: 'user', select: 'name email role' },
        sort: { createdAt: -1 },
      }
    )

    res.json({
      success: true,
      count: pagination.totalItems,
      pagination,
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Redeem points to cashback
// @route   POST /api/rewards/redeem-points
// @access  Private
exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body
    const userId = req.user._id

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid number of points to redeem',
      })
    }

    let reward = await Reward.findOne({ user: userId })

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'No rewards found. Make a purchase to earn rewards.',
      })
    }

    if (reward.points < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points. You have ' + reward.points + ' points.',
      })
    }

    // Convert points to cashback based on conversion rate
    const cashbackAmount = points * reward.pointToRupeeRate

    // Update reward
    reward.points -= points
    reward.cashback += cashbackAmount
    reward.totalRedeemed.points += points

    await reward.save()

    res.json({
      success: true,
      message: `Successfully redeemed ${points} points for ₹${cashbackAmount.toFixed(2)}`,
      data: {
        pointsRedeemed: points,
        cashbackAdded: parseFloat(cashbackAmount.toFixed(2)),
        remainingPoints: reward.points,
        totalCashback: parseFloat(reward.cashback.toFixed(2)),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update point to rupee conversion rate (Admin only)
// @route   PUT /api/rewards/conversion-rate
// @access  Private (Admin only)
exports.updateConversionRate = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.',
      })
    }

    const { pointToRupeeRate } = req.body

    if (!pointToRupeeRate || pointToRupeeRate < 0.02 || pointToRupeeRate > 0.2) {
      return res.status(400).json({
        success: false,
        message: 'Conversion rate must be between 0.02 and 0.2 (500 points = 10-100rs)',
      })
    }

    // Update all reward records with new conversion rate
    await Reward.updateMany({}, { pointToRupeeRate })

    res.json({
      success: true,
      message: 'Conversion rate updated successfully',
      data: {
        pointToRupeeRate,
        conversionInfo: {
          minValue: 500 * 0.02, // 10rs
          maxValue: 500 * 0.2, // 100rs
          currentValue: 500 * pointToRupeeRate,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get reward statistics (Admin/Manager only)
// @route   GET /api/rewards/statistics
// @access  Private (Admin/Manager)
exports.getRewardStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Manager access required.',
      })
    }

    const totalRewards = await Reward.countDocuments()
    const totalPoints = await Reward.aggregate([
      { $group: { _id: null, total: { $sum: '$points' } } },
    ])
    const totalCashback = await Reward.aggregate([
      { $group: { _id: null, total: { $sum: '$cashback' } } },
    ])
    const totalEarnedPoints = await Reward.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEarned.points' } } },
    ])
    const totalEarnedCashback = await Reward.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEarned.cashback' } } },
    ])

    res.json({
      success: true,
      data: {
        totalUsersWithRewards: totalRewards,
        totalPointsInSystem: totalPoints[0]?.total || 0,
        totalCashbackInSystem: totalCashback[0]?.total || 0,
        totalPointsEarned: totalEarnedPoints[0]?.total || 0,
        totalCashbackEarned: totalEarnedCashback[0]?.total || 0,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
