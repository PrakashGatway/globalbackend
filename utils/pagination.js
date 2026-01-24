/**
 * Pagination utility function
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter object for query
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options (populate, select, etc.)
 * @returns {Object} - Paginated results with metadata
 */
const paginate = async (Model, filter, req, options = {}) => {
  // Get page and limit from query params, with defaults
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const sortBy = req.query.sortBy || 'createdAt'
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

  // Validate page and limit
  const validPage = Math.max(1, page)
  const validLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page

  // Calculate skip
  const skip = (validPage - 1) * validLimit

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder

  // Build data query
  let dataQuery = Model.find(filter)

  // Apply populate if provided
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach((pop) => {
        if (typeof pop === 'string') {
          dataQuery = dataQuery.populate(pop)
        } else {
          dataQuery = dataQuery.populate(pop)
        }
      })
    } else {
      // Handle both string and object format
      dataQuery = dataQuery.populate(options.populate)
    }
  }

  // Apply select if provided
  if (options.select) {
    dataQuery = dataQuery.select(options.select)
  }

  // Execute queries with pagination
  const [data, total] = await Promise.all([
    dataQuery.sort(sort).skip(skip).limit(validLimit).exec(),
    Model.countDocuments(filter),
  ])

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / validLimit)
  const hasNextPage = validPage < totalPages
  const hasPrevPage = validPage > 1

  return {
    data,
    pagination: {
      currentPage: validPage,
      totalPages,
      totalItems: total,
      itemsPerPage: validLimit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? validPage + 1 : null,
      prevPage: hasPrevPage ? validPage - 1 : null,
    },
  }
}

module.exports = { paginate }
