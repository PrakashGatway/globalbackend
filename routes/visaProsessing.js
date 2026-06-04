const router = require("express").Router();
const visaController = require("../controllers/visaprocessingController");
  const { protect } = require("../middleware/auth");

router.post("/",protect, visaController.createVisaProcessing);

router.get("/", visaController.getAllVisaProcessing);

router.get("/my",protect, visaController.getUserVisaProcessing);

router.get("/:id", visaController.getSingleVisaProcessing);

router.put("/:id",protect, visaController.updateVisaProcessing);

router.put("/:id/current-step", visaController.updateCurrentStep);

router.delete("/:id", visaController.deleteVisaProcessing);

module.exports = router;