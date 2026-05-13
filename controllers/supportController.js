const sendNotification = require('../middleware/notificaion')
const Support = require('../models/Support')


exports.getTickets = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      user,
      search,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query

    page = parseInt(page)
    limit = parseInt(limit)

    let filter = {}

    if (status) filter.status = status
    if (category) filter.category = category
    if (priority) filter.priority = priority
    if (req.user.role == "admin") {
      if (user) filter.user = user
    } else {
      filter.user = req.user._id
    }

    if (fromDate || toDate) {
      filter.createdAt = {}
      if (fromDate) filter.createdAt.$gte = new Date(fromDate)
      if (toDate) filter.createdAt.$lte = new Date(toDate)
    }

    // Search filter
    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const sort = {
      [sortBy]: order === 'asc' ? 1 : -1
    }

    const total = await Support.countDocuments(filter)

    const tickets = await Support.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'Server Error'
    })
  }
}


exports.getTicket = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id).populate('user', 'name email')
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}



exports.getuser = async (req, res) => {
  try {
    const ticket = await Support.find({ user: req.params.id }).populate('user', 'name email')
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createTicket = async (req, res) => {
  try {
    const user = req.user
    const ticket = await Support.create({ ...req.body, user: user._id })

    const receiverUserId = req.user.assignto;
    console.log("sendMessage", req.user);

    await sendNotification({
      userId: receiverUserId,
      title: "New Support Ticket",
      body: req.body.subject,
      data: {
        type: "support",
        description: req.body.description,
        ticketId: ticket._id,
      },
    });

    res.status(201).json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Support.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }

    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Support.findByIdAndDelete(req.params.id)
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' })
    }
    res.json({ success: true, message: 'Ticket deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.replyToTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { description } = req.body

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Reply description is required"
      })
    }

    const ticket = await Support.findById(id)

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      })
    }

    // push reply
    ticket.reply.push({
      user: req.user._id, // from auth middleware
      description
    })

    // change status to pending if admin replies
    if (ticket.status === "open") {
      ticket.status = "pending"
    }

    await ticket.save()

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      data: ticket
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

