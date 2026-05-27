const express = require("express");
const router = express.Router();

const {
  startVisaProcessing,
  getAllVisaProcessing,
  getSingleVisaProcessing,
  updateVisaProcessing,
  deleteVisaProcessing,
  updateDocumentStatus,
  getVisaProcessing
} = require("../controllers/visaprocessingController");
const { protect } = require("../middleware/auth");



router.post("/", startVisaProcessing);
router.get("/", getAllVisaProcessing);
router.get("/user", protect, getVisaProcessing);
router.get("/:id", getSingleVisaProcessing);
router.patch("/:id", updateVisaProcessing);
router.delete("/:id", deleteVisaProcessing);
router.put("/document/status", updateDocumentStatus);


module.exports = router;