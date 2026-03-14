const express = require("express");
const { createEnquiry } = require("../controllers/enquiryController");
const router = express.Router();




router
  .route("/enquiry")
  .post(createEnquiry);

module.exports = router;