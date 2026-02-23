const PageInformation = require('../models/PageInfo')

exports.createPage = async (req, res) => {
  try {
    const page = await PageInformation.create(req.body)
    res.status(201).json({
      success: true,
      data: page,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getAllPages = async (req, res) => {
  try {
    const {
      search,
      status,
      pageType,
      isFeatured,
      isNavbar,
      slug,
      fromDate,
      toDate,
      sort = '-createdAt',
      page = 1,
      limit = 10,
    } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { subTitle: { $regex: search, $options: 'i' } },
      ]
    }
    if (status) query.status = status
    if (pageType) query.pageType = pageType
    if (slug) query.slug = slug

    if (isFeatured !== undefined)
      query.isFeatured = isFeatured === 'true'

    if (isNavbar !== undefined)
      query.isNavbar = isNavbar === 'true'

    if (fromDate || toDate) {
      query.createdAt = {}
      if (fromDate) query.createdAt.$gte = new Date(fromDate)
      if (toDate) query.createdAt.$lte = new Date(toDate)
    }

    const skip = (page - 1) * limit

    const pages = await PageInformation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)).populate('country', 'name code flg')

    const total = await PageInformation.countDocuments(query)

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: pages,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
exports.getNavTabs = async (req, res) => {
  try {
    const {
      isFeatured,
      isNavbar,
      type,
      page = 1,
      limit = 50,
    } = req.query

    const query = {}

    if (isFeatured !== undefined)
      query.isFeatured = isFeatured === 'true'

    if (type) query.pageType = type

    if (isNavbar !== undefined)
      query.isNavbar = isNavbar === 'true'

    const skip = (page - 1) * limit

    const pages = await PageInformation.find(query).select('pageType slug navbarTitle subTitle title subTitle cardImage navbarImage').sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))

    res.status(200).json({
      success: true,
      page: Number(page),
      data: pages,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getPageById = async (req, res) => {
  try {
    const page = await PageInformation.findById(req.params.id).populate('country', 'name code flg')

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      })
    }

    res.status(200).json({
      success: true,
      data: page,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
exports.getPageBySlug = async (req, res) => {
  try {
    const page = await PageInformation.findOne({
      slug: req.params.slug,
      status: 'Published',
    }).populate('country', 'name code flg')

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      })
    }

    res.status(200).json({
      success: true,
      data: page,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updatePage = async (req, res) => {
  try {
    const page = await PageInformation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      })
    }

    res.status(200).json({
      success: true,
      data: page,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deletePage = async (req, res) => {
  try {
    const page = await PageInformation.findByIdAndDelete(req.params.id)

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Page deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
