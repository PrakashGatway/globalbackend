const router = require("express").Router();
const visaController = require("../controllers/visaprocessingController");
  const { protect } = require("../middleware/auth");
const upload = require("../middleware/DocumentUpload");


router.post("/",protect, visaController.createVisaProcessing);

router.get("/", visaController.getAllVisaProcessing);

router.get("/my",protect, visaController.getUserVisaProcessing);
router.get("/counsellor",protect, visaController.getcounsellorVisaProcessing);

router.get("/:id", visaController.getSingleVisaProcessing);

router.put("/:id",protect, visaController.updateVisaProcessing);

router.delete("/:id", visaController.deleteVisaProcessing);

// Add these routes to your visa routes file
router.post(
  "/document",
  visaController.createDocumentRequirement
);
router.post("/upload", upload.single('file'), visaController.uploadDocument);
router.get("/:id/documents", visaController.getDocuments);
router.delete("/:id/documents/:documentId", visaController.deleteDocument);

module.exports = router;