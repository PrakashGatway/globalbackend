const mongoose = require("mongoose");

const courseCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: [true, "Category slug is required"],
            lowercase: true,
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        icon: {
            type: String, // icon url or icon name
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CourseCategory", courseCategorySchema);
