const ContactUs = require('../models/Contact')

/**
 * CREATE CONTACT QUERY
 */
exports.createContactUs = async (req, res) => {
  try {
    const contact = await ContactUs.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Query submitted successfully',
      data: contact,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * GET ALL CONTACT QUERIES (ADVANCED FILTERS)
 */
exports.getAllContactUs = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      country,
      source,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query

    const query = {}

    // 🔍 Search
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    // 🎯 Filters
    if (status) query.status = status
    if (priority) query.priority = priority
    if (country) query.country = country
    if (source) query.source = source

    // 📅 Date Range
    if (fromDate || toDate) {
      query.createdAt = {}
      if (fromDate) query.createdAt.$gte = new Date(fromDate)
      if (toDate) query.createdAt.$lte = new Date(toDate)
    }

    const skip = (page - 1) * limit

    const data = await ContactUs.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))

    const total = await ContactUs.countDocuments(query)

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * GET SINGLE CONTACT QUERY
 */
exports.getContactUsById = async (req, res) => {
  try {
    const data = await ContactUs.findById(req.params.id)

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found',
      })
    }

    res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * UPDATE CONTACT QUERY (STATUS / RESOLUTION / PRIORITY)
 */
exports.updateContactUs = async (req, res) => {
  try {
    const updated = await ContactUs.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Contact query updated successfully',
      data: updated,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * DELETE CONTACT QUERY
 */
exports.deleteContactUs = async (req, res) => {
  try {
    const deleted = await ContactUs.findByIdAndDelete(req.params.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Contact query deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * DASHBOARD STATS
 */
exports.getContactUsStats = async (req, res) => {
  try {
    const statusStats = await ContactUs.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    const priorityStats = await ContactUs.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ])

    res.status(200).json({
      success: true,
      statusStats,
      priorityStats,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
