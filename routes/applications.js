const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/DocumentUpload");
const counsellorApplication = require("../controllers/counsoller_application");

router.post("/create", protect, counsellorApplication.masterControllerWithTransaction);

router.get("/documents/:userId", protect, applicationController.getUserDocuments);


router.get(
  "/getDataByAssignTo",
  protect,
  counsellorApplication.getDataByAssignTo
);

router.get('/getApplicationsByCounsellor', protect, counsellorApplication.getApplicationsByCounsellor);

router.post(
  "/existing_user",
  protect,
  counsellorApplication.createApplication
)

router.put(
  "/updateApplication/:id",
  protect,
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "academic", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "experience", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  counsellorApplication.updateApplication
);

router.post("/", protect, applicationController.createApplication);

router.put(
  "/documents/:applicationId/:documentId",
  protect,
  upload.single("file"),
  applicationController.uploadAndUpdateDocument,
);

router.get("/", protect, applicationController.getApplications);
router.put(
  "/update/:id",
  protect,
  applicationController.updateIntakeAndBackups,
);
router.get("/:id", protect, applicationController.getApplication);
router.put("/:id", protect, applicationController.updateApplication);
router.delete("/:id", protect, applicationController.deleteApplication);


module.exports = router;
