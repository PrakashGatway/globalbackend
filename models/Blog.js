const mongoose = require('mongoose')

const blogCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
        },
        type:{
            type: String,
            default: 'blog',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
    },
    { timestamps: true }
)



const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Blog title is required'],
            trim: true,
        },
        blogType:{
            type: String,
            default: 'blog',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        shortDescription: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            required: true, // HTML allowed
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BlogCategory',
            required: true,
        },
        tags: [String],
        coverImage: {
            type: String,
            default: '',
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Draft', 'Published'],
            default: 'Draft',
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
        seo: {
            metaTitle: String,
            metaDescription: String,
            og: {
                type: mongoose.Schema.Types.Mixed,
            },
            keywords: [String],
        },
        extraMetadata: {
            type: mongoose.Schema.Types.Mixed,
        }
    },
    { timestamps: true }
)


module.exports = {
    BlogCategory: mongoose.model('BlogCategory', blogCategorySchema),
    Blog: mongoose.model('Blog', blogSchema)
}