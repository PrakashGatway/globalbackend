const PageInformation = require('../models/PageInformation')
const { paginate } = require('../utils/pagination')

// @desc    Get all page information
// @route   GET /api/page-information?page=1&limit=10
// @access  Private


exports.addSection = async (req, res) => {
  try {
    const { type, data } = req.body

    const page = await PageInformation.findById(req.params.id)
    if (!page) return res.status(404).json({ message: 'Page not found' })

    page.sections.push({
      type,
      data,
      order: page.sections.length + 1,
    })

    await page.save()
    res.json({ success: true, sections: page.sections })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.deleteSection = async (req, res) => {
  const page = await PageInformation.findById(req.params.pageId)
  page.sections.splice(req.params.index, 1)
  await page.save()
  res.json({ success: true })
}

exports.getPage = async (req, res) => {
  const page = await PageInformation.findOne({ slug: req.params.slug })
  res.json(page)
}

exports.getPageInformations = async (req, res) => {
  try {
    const { data, pagination } = await paginate(PageInformation, {}, req)
    
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

// @desc    Get single page information by slug (public)
// @route   GET /api/page-information/public/:slug
// @access  Public
exports.getPageInformationBySlug = async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    
    console.log(`🔍 Looking for page with slug: "${slug}"`)
    
    // In development, allow both Published and Draft pages
    // In production, only allow Published pages
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    let page
    if (isDevelopment) {
      // Development: Try to find page regardless of status
      page = await PageInformation.findOne({ slug: slug })
      
      if (page && page.status === 'Draft') {
        console.warn(`⚠️ Page "${slug}" found but status is "Draft". Returning in development mode.`)
      }
    } else {
      // Production: Only find Published pages
      page = await PageInformation.findOne({ 
        slug: slug,
        status: 'Published'
      })
    }
    
    if (!page) {
      // Check if page exists with different status
      const anyPage = await PageInformation.findOne({ slug: slug })
      
      if (anyPage) {
        if (anyPage.status === 'Draft' && !isDevelopment) {
          return res.status(404).json({ 
            success: false, 
            message: `Page found but status is "Draft". Please update status to "Published" in admin panel.`,
            slug: slug,
            status: anyPage.status
          })
        }
      }
      
      return res.status(404).json({ 
        success: false, 
        message: `Page not found with slug: "${slug}". Please create the page in admin panel first.`,
        slug: slug
      })
    }
    
    console.log(`✅ Page found: "${slug}", Status: "${page.status}"`)
    res.json({ 
      success: true, 
      data: page,
      ...(page.status === 'Draft' && isDevelopment ? { warning: 'Page is in Draft status' } : {})
    })
  } catch (error) {
    console.error('Error in getPageInformationBySlug:', error);
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get single page information by page type (public)
// @route   GET /api/page-information/public/type/:type
// @access  Public
exports.getPageInformationByType = async (req, res) => {
  try {
    const pageType = req.params.type.toLowerCase().trim();
    
    console.log(`🔍 Looking for page with type: "${pageType}"`)
    
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    let page
    if (isDevelopment) {
      page = await PageInformation.findOne({ pageType: pageType })
      
      if (page && page.status === 'Draft') {
        console.warn(`⚠️ Page type "${pageType}" found but status is "Draft". Returning in development mode.`)
      }
    } else {
      page = await PageInformation.findOne({ 
        pageType: pageType,
        status: 'Published'
      })
    }
    
    if (!page) {
      const anyPage = await PageInformation.findOne({ pageType: pageType })
      
      if (anyPage) {
        if (anyPage.status === 'Draft' && !isDevelopment) {
          return res.status(404).json({ 
            success: false, 
            message: `Page found but status is "Draft". Please update status to "Published".`,
            pageType: pageType,
            status: anyPage.status
          })
        }
      }
      
      return res.status(404).json({ 
        success: false, 
        message: `Page not found with type: "${pageType}".`,
        pageType: pageType
      })
    }
    
    console.log(`✅ Page found: "${pageType}", Status: "${page.status}"`)
    res.json({ 
      success: true, 
      data: page,
      ...(page.status === 'Draft' && isDevelopment ? { warning: 'Page is in Draft status' } : {})
    })
  } catch (error) {
    console.error('Error in getPageInformationByType:', error);
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get single page information
// @route   GET /api/page-information/:id
// @access  Private
exports.getPageInformation = async (req, res) => {
  try {
    const page = await PageInformation.findById(req.params.id)
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page information not found' })
    }
    res.json({ success: true, data: page })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Create page information
// @route   POST /api/page-information
// @access  Private
exports.createPageInformation = async (req, res) => {
  try {
    const {
      pageType,
      title,
      subTitle,
      navbarTitle,
      slug,
      metaTitle,
      metaDescription,
      status,
      isFeatured,
      heroImage,
      heroImagePublicId,
      roadmapImage,
      roadmapImagePublicId,
      mobileRoadmapImage,
      mobileRoadmapImagePublicId,
      universityCapBg,
      universityCapBgPublicId,
      universitySliderBg,
      universitySliderBgPublicId,
      immigrationServicesBg,
      immigrationServicesBgPublicId,
      sections,
      keywords,
      tags,
      canonicalUrl,
    } = req.body

    // Validate required fields
    if (!title || !slug || !pageType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, slug, and page type',
      })
    }

    // Check if slug already exists
    const existingPage = await PageInformation.findOne({ slug })
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Page with this slug already exists',
      })
    }

    // Convert keywords and tags from comma-separated string to array
    console.log('🔑 Keywords & Tags Processing (Create):')
    console.log('  Received keywords:', keywords, 'Type:', typeof keywords)
    console.log('  Received tags:', tags, 'Type:', typeof tags)
    
    let keywordsArray = []
    if (keywords !== undefined) {
      if (typeof keywords === 'string' && keywords.trim()) {
        keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      } else if (Array.isArray(keywords)) {
        keywordsArray = keywords.filter(k => k && k.trim().length > 0)
      }
    }
    
    let tagsArray = []
    if (tags !== undefined) {
      if (typeof tags === 'string' && tags.trim()) {
        tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      } else if (Array.isArray(tags)) {
        tagsArray = tags.filter(t => t && t.trim().length > 0)
      }
    }
    
    console.log('  Processed keywords:', keywordsArray)
    console.log('  Processed tags:', tagsArray)

    // Create page information
    const pageInformation = await PageInformation.create({
      pageType,
      title,
      subTitle,
      navbarTitle,
      slug,
      metaTitle,
      metaDescription,
      status: status || 'Draft',
      isFeatured: isFeatured || 'No',
      heroImage: heroImage || '',
      heroImagePublicId: heroImagePublicId || '',
      roadmapImage: roadmapImage || '',
      roadmapImagePublicId: roadmapImagePublicId || '',
      mobileRoadmapImage: mobileRoadmapImage || '',
      mobileRoadmapImagePublicId: mobileRoadmapImagePublicId || '',
      universityCapBg: universityCapBg || '',
      universityCapBgPublicId: universityCapBgPublicId || '',
      universitySliderBg: universitySliderBg || '',
      universitySliderBgPublicId: universitySliderBgPublicId || '',
      immigrationServicesBg: immigrationServicesBg || '',
      immigrationServicesBgPublicId: immigrationServicesBgPublicId || '',
      sections: sections || [],
      keywords: keywordsArray,
      tags: tagsArray,
      canonicalUrl: canonicalUrl || '',
    })

    res.status(201).json({
      success: true,
      message: 'Page information created successfully',
      data: pageInformation,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      const errorDetails = messages.join(', ')
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errorDetails || 'Please check all required fields'}`,
        errors: messages,
      })
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Page with this slug already exists',
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Update page information
// @route   PUT /api/page-information/:id
// @access  Private
exports.updatePageInformation = async (req, res) => {
  try {
    const pageId = req.params.id
    
    if (!pageId) {
      return res.status(400).json({
        success: false,
        message: 'Page ID is required',
      })
    }

    console.log('📝 Updating page:', pageId)
    console.log('📦 Request body keys:', Object.keys(req.body))
    console.log('📊 Sections count:', Array.isArray(req.body.sections) ? req.body.sections.length : 'not an array')

    const {
      keywords,
      tags,
      sections,
      ...updateData
    } = req.body

    // Convert keywords and tags if they are strings
    console.log('🔑 Keywords & Tags Processing:')
    console.log('  Received keywords:', keywords, 'Type:', typeof keywords)
    console.log('  Received tags:', tags, 'Type:', typeof tags)
    
    if (keywords !== undefined) {
      if (typeof keywords === 'string') {
        updateData.keywords = keywords.trim()
          ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
          : []
      } else if (Array.isArray(keywords)) {
        updateData.keywords = keywords.filter(k => k && k.trim().length > 0)
      } else {
        updateData.keywords = []
      }
      console.log('  Processed keywords:', updateData.keywords)
    }

    if (tags !== undefined) {
      if (typeof tags === 'string') {
        updateData.tags = tags.trim()
          ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : []
      } else if (Array.isArray(tags)) {
        updateData.tags = tags.filter(t => t && t.trim().length > 0)
      } else {
        updateData.tags = []
      }
      console.log('  Processed tags:', updateData.tags)
    }

    // Ensure sections is properly formatted
    if (sections !== undefined) {
      if (Array.isArray(sections)) {
        // Validate and normalize sections
        updateData.sections = sections.map((section, index) => {
          // Ensure each section has required fields
          const normalizedSection = {
            type: (section.type || '').trim().toLowerCase(),
            order: typeof section.order === 'number' ? section.order : (index + 1),
            data: section.data || {},
          }
          
          // Ensure type is not empty
          if (!normalizedSection.type) {
            console.warn(`⚠️ Section at index ${index} has no type, skipping`)
            return null
          }
          
          return normalizedSection
        }).filter(section => section !== null) // Remove invalid sections
        
        console.log(`✅ Processing ${updateData.sections.length} sections for update`)
        if (updateData.sections.length > 0) {
          console.log('📋 First section sample:', JSON.stringify(updateData.sections[0], null, 2))
        }
      } else {
        // If sections is not an array, set to empty array
        updateData.sections = []
        console.warn('⚠️ Sections is not an array, setting to empty array')
      }
    }

    // Normalize slug to lowercase if provided
    if (updateData.slug) {
      updateData.slug = updateData.slug.trim().toLowerCase()
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingPage = await PageInformation.findOne({
        slug: updateData.slug,
        _id: { $ne: pageId }
      })
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'Page with this slug already exists',
        })
      }
    }

    // Check if page exists
    const existingPage = await PageInformation.findById(pageId)
    if (!existingPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Page information not found' 
      })
    }

    // Ensure all string fields are trimmed and empty strings are preserved (for clearing fields)
    const fieldsToTrim = [
      'title', 'subTitle', 'navbarTitle', 'slug', 'metaTitle', 'metaDescription',
      'heroImage', 'heroImagePublicId',
      'roadmapImage', 'roadmapImagePublicId',
      'mobileRoadmapImage', 'mobileRoadmapImagePublicId',
      'universityCapBg', 'universityCapBgPublicId',
      'universitySliderBg', 'universitySliderBgPublicId',
      'immigrationServicesBg', 'immigrationServicesBgPublicId',
      'canonicalUrl'
    ]
    
    fieldsToTrim.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = typeof updateData[field] === 'string' 
          ? updateData[field].trim() 
          : updateData[field]
      }
    })

    console.log('📦 Final update data keys:', Object.keys(updateData))
    console.log('📋 Sections being saved:', Array.isArray(updateData.sections) ? updateData.sections.length : 'not an array')
    console.log('🔑 Keywords:', Array.isArray(updateData.keywords) ? updateData.keywords.length : 'not an array')
    console.log('🏷️ Tags:', Array.isArray(updateData.tags) ? updateData.tags.length : 'not an array')

    const pageInformation = await PageInformation.findByIdAndUpdate(
      pageId,
      updateData,
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    )

    if (!pageInformation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Page information not found or could not be updated' 
      })
    }

    console.log('✅ Page updated successfully:', pageInformation._id)
    console.log('📊 Updated sections count:', Array.isArray(pageInformation.sections) ? pageInformation.sections.length : 0)

    res.json({
      success: true,
      message: 'Page information updated successfully',
      data: pageInformation,
    })
  } catch (error) {
    console.error('❌ Update page error:', error)
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(', ')}`,
        errors: messages,
      })
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Page with this slug already exists',
      })
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update page information',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// @desc    Delete page information
// @route   DELETE /api/page-information/:id
// @access  Private
exports.deletePageInformation = async (req, res) => {
  try {
    const pageInformation = await PageInformation.findByIdAndDelete(req.params.id)
    if (!pageInformation) {
      return res.status(404).json({ success: false, message: 'Page information not found' })
    }
    res.json({ success: true, message: 'Page information deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// @desc    Get image by slug and image type (public)
// @route   GET /api/page-information/images/:slug/:imageType
// @access  Public
// @param   imageType: heroImage, universityCapBg, universitySliderBg, immigrationServicesBg, roadmapImage
exports.getImageBySlug = async (req, res) => {
  try {
    const { slug, imageType } = req.params
    
    const validImageTypes = ['heroImage', 'universityCapBg', 'universitySliderBg', 'immigrationServicesBg', 'roadmapImage', 'mobileRoadmapImage']
    
    if (!validImageTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid image type. Valid types: ${validImageTypes.join(', ')}`
      })
    }
    
    // In development, allow Draft pages; in production, only Published
    const statusFilter = process.env.NODE_ENV === 'production' 
      ? { status: 'Published' }
      : {}
    
    const page = await PageInformation.findOne({ 
      slug: slug,
      ...statusFilter
    })
    
    if (!page) {
      // Return success with null imageUrl instead of 404 to allow frontend fallback
      return res.json({
        success: true,
        data: {
          imageUrl: null,
          publicId: null,
          imageType,
          slug,
          message: 'Page not found or not published'
        }
      })
    }
    
    const imageUrl = page[imageType] || ''
    const publicId = page[`${imageType}PublicId`] || ''
    
    // Return success even if imageUrl is empty, so frontend can handle fallback
    res.json({
      success: true,
      data: {
        imageUrl: imageUrl || null,
        publicId: publicId || null,
        imageType,
        slug,
        ...(imageUrl ? {} : { message: `Image not found for type: ${imageType}` })
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
