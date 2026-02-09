const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true,
        },
        description: String,
        icon: String,
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CourseCategory",
            required: true,
        },
        order: {
            type: Number,
            unique: true,
            default: 0,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);


subjectSchema.pre("save", async function (next) {
    if (this.isNew) {
        const lastSubject = await mongoose
            .model("Subject")
            .findOne()
            .sort({ order: -1 });
        this.order = lastSubject ? lastSubject.order + 1 : 0;
    }
    next();
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;