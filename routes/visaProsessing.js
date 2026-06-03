const router = require("express").Router();
const visaController = require("../controllers/visaprocessingController");
  const { protect } = require("../middleware/auth");

router.post("/",protect, visaController.createVisaProcessing);

router.get("/", visaController.getAllVisaProcessing);

router.get("/my",protect, visaController.getUserVisaProcessing);

router.get("/:id", visaController.getSingleVisaProcessing);

router.put("/:id", visaController.updateVisaProcessing);

router.put("/:id/current-step", visaController.updateCurrentStep);

router.put("/step/:stepId", visaController.updateStep);

router.put("/step-section/update", visaController.updateStepSection);

router.delete("/:id", visaController.deleteVisaProcessing);

module.exports = router;