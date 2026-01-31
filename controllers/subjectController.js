const Subject = require("../models/SubjectModel");
exports.createSubject = async (req, res) => {
    try {
        const { name, description, slug, icon, isActive } = req.body;

        const subject = await Subject.create({
            name,
            slug: slug,
            description,
            icon,
            isActive,
        });

        res.status(201).json({
            success: true,
            message: "Subject created successfully",
            data: subject,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// GET ALL SUBJECTS
exports.getAllSubjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      all
    } = req.query;

    let query = Subject.find().sort({ order: 1 });

    // ❌ No pagination if all=true
    if (!all || all === "false") {
      const skip = (Number(page) - 1) * Number(limit);
      query = query.skip(skip).limit(Number(limit));
    }

    const subjects = await query;

    const total = await Subject.countDocuments();

    res.status(200).json({
      success: true,
      count: subjects.length,
      total,
      page: all ? null : Number(page),
      pages: all ? null : Math.ceil(total / limit),
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET SINGLE SUBJECT
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        res.status(200).json({
            success: true,
            data: subject,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// UPDATE SUBJECT
exports.updateSubject = async (req, res) => {
    try {
        const updates = { ...req.body };

        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Subject updated successfully",
            data: subject,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// DELETE SUBJECT
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Subject deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
