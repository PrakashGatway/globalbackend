const express = require("express");
const router = express.Router();

const {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/auth");

router.post("/",protect, createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id",protect,authorize('admin', 'manager'), updateSubject);
router.delete("/:id",protect, authorize('admin', 'manager'),  deleteSubject);

module.exports = router;
