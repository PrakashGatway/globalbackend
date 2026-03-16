const Enquiry = require("../models/Enquiry");

exports.createEnquiry = async (req, res) => {
  try {

    const enquiry = await Enquiry.create(req.body);

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};