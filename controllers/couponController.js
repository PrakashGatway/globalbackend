const mongoose = require('mongoose');
const { Coupon,ScratchCard } = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {

    const data = req.body;
    // validation based on type
    if (data.type === "coupon" && !data.couponData) {
      return res.status(400).json({
        success: false,
        message: "couponData required for coupon type"
      });
    }
    if (data.type === "reward" && !data.rewardData) {
      return res.status(400).json({
        success: false,
        message: "rewardData required for reward type"
      });
    }

    console.log(data,'data');

    const coupon = await Coupon.create(data);
    res.status(201).json({
      success: true,
      message: `${data.type} created successfully`,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCoupons = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
      status,
      code,
      type,
      discountType,
      applicableTo,
      startDate,
      endDate
    } = req.query;

    const match = {};

    if (status) match.status = status;

    if (type) match.type = type;

    if (code) {
      match.code = { $regex: code, $options: "i" };
    }

    if (discountType) {
      match["couponData.discountType"] = discountType;
    }

    if (applicableTo) {
      match["couponData.applicableTo"] = applicableTo;
    }

    if (startDate || endDate) {

      match.validFrom = {};

      if (startDate)
        match.validFrom.$gte = new Date(startDate);

      if (endDate)
        match.validFrom.$lte = new Date(endDate);
    }



    const pipeline = [

      { $match: match },

      {
        $addFields: {
          isExpired: {
            $lt: ["$validTo", new Date()]
          }
        }
      },

      { $sort: { createdAt: -1 } },

      {
        $facet: {

          data: [
            { $skip: (page - 1) * limit },
            { $limit: Number(limit) }
          ],

          totalCount: [
            { $count: "count" }
          ]
        }
      }

    ];



    const result = await Coupon.aggregate(pipeline);

    res.json({
      success: true,
      data: result[0].data,
      total: result[0].totalCount[0]?.count || 0,
      page: Number(page),
      limit: Number(limit)
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


exports.getAssignCoupon = async (req, res) => {
  try {
    console.log(req.params.id, 'id');

    // find() returns an ARRAY, not a single document
    const coupons = await Coupon.find({ assingBy: req.params.id });

    // Check if array is empty (length === 0), not !coupons
    if (!coupons || coupons.length === 0) {
      return res.json({
        success: false,
        message: "No coupons found for this user",
        data: []
      });
    }

    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getCouponById = async (req, res) => {
  try {

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon)
      return res.status(404).json({
        success: false,
        message: "Not found"
      });

    res.json({
      success: true,
      data: coupon
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.updateCoupon = async (req, res) => {

  try {

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Updated successfully",
      data: coupon
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.deleteCoupon = async (req, res) => {

  try {

    await Coupon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getAvailableCoupons = async (req, res) => {

  try {

    const userId = req.user._id;
    const { amount, itemId } = req.query;


    const pipeline = [

      {
        $match: {

          type: "coupon",

          status: "Active",

          validFrom: { $lte: new Date() },

          validTo: { $gte: new Date() },

          $expr: {
            $or: [
              { $eq: ["$usageLimit", null] },
              { $gt: ["$usageLimit", "$usedCount"] }
            ]
          }
        }
      },


      {
        $addFields: {

          isUserEligible: {

            $cond: {

              if: "$couponData.isUserSpecific",

              then: {
                $in: [
                  new mongoose.Types.ObjectId(userId),
                  "$couponData.users"
                ]
              },

              else: true
            }
          }

        }
      },


      { $match: { isUserEligible: true } },


      ...(amount ? [{
        $match: {
          "couponData.minPurchaseAmount": {
            $lte: Number(amount)
          }
        }
      }] : []),


      ...(itemId ? [{
        $match: {
          $or: [
            { "couponData.applicableTo": "all" },
            {
              "couponData.applicableItems":
                new mongoose.Types.ObjectId(itemId)
            }
          ]
        }
      }] : []),


      {
        $project: {
          code: 1,
          title: 1,
          description: 1,
          couponData: 1,
          validTo: 1,
        }
      }

    ];


    const coupons = await Coupon.aggregate(pipeline);


    res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.applyCoupon = async (req, res) => {

  try {

    const { code, amount } = req.body;

    const coupon = await Coupon.findOne({
      code,
      type: "coupon"
    });


    if (!coupon)
      return res.status(404).json({
        success: false,
        message: "Invalid coupon"
      });


    if (coupon.validTo < new Date())
      return res.status(400).json({
        success: false,
        message: "Expired"
      });


    if (
      coupon.usageLimit &&
      coupon.usedCount >= coupon.usageLimit
    )
      return res.status(400).json({
        success: false,
        message: "Usage limit reached"
      });


    if (
      amount <
      coupon.couponData.minPurchaseAmount
    )
      return res.status(400).json({
        success: false,
        message: `Minimum ${coupon.couponData.minPurchaseAmount}`
      });



    let discount = 0;


    if (
      coupon.couponData.discountType === "percentage"
    ) {

      discount =
        (amount * coupon.couponData.discountValue) / 100;

      if (coupon.couponData.maxDiscountAmount)
        discount = Math.min(
          discount,
          coupon.couponData.maxDiscountAmount
        );

    } else {

      discount =
        coupon.couponData.discountValue;
    }



    res.json({
      success: true,
      discount,
      finalAmount: amount - discount
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.createScratchCard = async (req, res) => {
  try {
    const userId = req.user._id;
    const card = await ScratchCard.create({
      userId,
      // rewardId: req.body.rewardId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: "Scratch card created",
      data: card
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getMyScratchCards = async (req, res) => {

  try {

    const cards = await ScratchCard.find({
      userId: req.user._id
    })
      .populate("rewardId")
      .sort({ createdAt: -1 });


    res.json({
      success: true,
      count: cards.length,
      data: cards
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.scratchCard = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const { scratchCardId } = req.params;
    const userId = req.user._id;


    const card = await ScratchCard.findOne({
      _id: scratchCardId,
      userId
    }).session(session);


    if (!card)
      throw new Error("Scratch card not found");


    if (card.isScratched)
      throw new Error("Already scratched");


    if (card.expiresAt && card.expiresAt < new Date())
      throw new Error("Scratch card expired");

    const rewards = await Coupon.find({
      type: "reward",
      status: "Active",
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    }).session(session);

    if (!rewards.length)
      throw new Error("No rewards available");
    let totalProbability = 0;

    rewards.forEach(r => {
      totalProbability += r.rewardData.probability || 0;
    });

    let random = Math.random() * totalProbability;

    let selectedReward = null;
    for (let reward of rewards) {
      random -= reward.rewardData.probability || 0;
      if (random <= 0) {
        selectedReward = reward;
        break;
      }
    }
    if (!selectedReward)
      selectedReward = rewards[0];
    /**
     * UPDATE SCRATCH CARD
     */
    card.isScratched = true;
    card.scratchedAt = new Date();
    card.rewardId = selectedReward._id;

     await card.save({ session });
    const updatedCard = await ScratchCard.findOne({
      _id: scratchCardId
    }).populate("rewardId").session(session);

    let rewardResponse = {
      type: selectedReward.rewardData.rewardType,
      title: selectedReward.title
    };
    // WALLET REWARD
    if (selectedReward.rewardData.rewardType === "WALLET") {

      const amount = selectedReward.rewardData.rewardValue;

      await mongoose.model("User").updateOne(
        { _id: userId },
        { $inc: { wallet: amount } },
        { session }
      );

      rewardResponse.amount = amount;
    }
    if (selectedReward.rewardData.rewardType === "COUPON") {

      const coupon = await Coupon.findById(
        selectedReward.rewardData.couponId
      ).session(session);

      rewardResponse.coupon = coupon;
    }

    // CASH REWARD
    if (selectedReward.rewardData.rewardType === "CASH") {

      rewardResponse.amount =
        selectedReward.rewardData.rewardValue;
    }
    // NOTHING
    if (selectedReward.rewardData.rewardType === "NOTHING") {
      rewardResponse.message =
        "Better luck next time";
    }

    await session.commitTransaction();
    session.endSession();
    res.json({
      success: true,
      message: "Scratch successful",
      reward: rewardResponse,
      updatedCard
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
