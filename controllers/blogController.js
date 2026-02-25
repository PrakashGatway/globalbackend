const { default: mongoose } = require('mongoose');
const { Blog, BlogCategory } = require('../models/Blog');

const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

exports.createCategory = async (req, res) => {
    try {
        const category = await BlogCategory.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name or slug already exists',
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await BlogCategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name or slug already exists',
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await BlogCategory.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBlogCategories = async (req, res) => {
    try {
        const {
            search,
            status,
            sort = '-createdAt',
            page = 1,
            limit = 10,
            fromDate,
            toDate,
            type,
            withBlogs,
        } = req.query


        const matchStage = {}

        if (search) {
            matchStage.name = {
                $regex: search,
                $options: 'i',
            }
        }

        if (type) {
            matchStage.type = type
        }

        if (status) {
            matchStage.status = status
        }

        if (fromDate || toDate) {
            matchStage.createdAt = {}
            if (fromDate) matchStage.createdAt.$gte = new Date(fromDate)
            if (toDate) matchStage.createdAt.$lte = new Date(toDate)
        }

        const skip = (Number(page) - 1) * Number(limit)

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'blogs',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'blogs',
                },
            },
            {
                $addFields: {
                    totalBlogs: { $size: '$blogs' },
                },
            },
            {
                $project: {
                    blogs: 0,
                },
            },
        ]

        if (withBlogs === 'true') {
            pipeline.push({
                $match: { totalBlogs: { $gt: 0 } },
            })
        }

        const sortObj = {}
        sort.split(',').forEach(field => {
            if (field.startsWith('-')) {
                sortObj[field.substring(1)] = -1
            } else {
                sortObj[field] = 1
            }
        })

        pipeline.push({ $sort: sortObj })

        pipeline.push({ $skip: skip })
        pipeline.push({ $limit: Number(limit) })

        const categories = await BlogCategory.aggregate(pipeline)

        const totalCountPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'blogs',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'blogs',
                },
            },
            {
                $addFields: {
                    totalBlogs: { $size: '$blogs' },
                },
            },
        ]

        if (withBlogs === 'true') {
            totalCountPipeline.push({
                $match: { totalBlogs: { $gt: 0 } },
            })
        }

        const totalCount = await BlogCategory.aggregate(totalCountPipeline)

        res.status(200).json({
            success: true,
            total: totalCount.length,
            page: Number(page),
            limit: Number(limit),
            data: categories,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


exports.createBlog = async (req, res) => {
    try {
        const blog = await Blog.create({
            ...req.body,
            // author: req.user._id,
        })

        res.status(201).json({
            success: true,
            data: blog,
        })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

exports.getAllBlogs = async (req, res) => {
    try {
        const {
            search,
            catslug,
            category,
            author,
            status,
            isFeatured,
            fromDate,
            toDate,
            type,
            sort = '-createdAt',
            method,
            page = 1,
            limit = 10,
        } = req.query

        console.log(method)

        
        if (method == "flaten") {
            console.log('Flat blogs query:', req.query);
            const categories = await Blog.find({status: "Published"}).select('name slug blogType createdAt')

            return res.status(200).json({
                success: true,
                data: categories,
            })
        }

        const matchStage = {}

        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
            ]
        }

        if (type) {
            matchStage.blogType = type
        }
        if (catslug) {
            const category = await BlogCategory.findOne({ slug: catslug })
            if (category) {
                matchStage.category = category._id
            } else {
                return res.status(200).json({
                    success: true,
                    total: 0,
                    page: Number(page),
                    limit: Number(limit),
                    pages: 0,
                    results: 0,
                    data: [],
                });
            }
        } else {
            if (category) matchStage.category = new mongoose.Types.ObjectId(category)
        }

        if (author) matchStage.author = new mongoose.Types.ObjectId(author)
        if (status) matchStage.status = status
        if (isFeatured !== undefined)
            matchStage.isFeatured = isFeatured === 'true'

        if (fromDate || toDate) {
            matchStage.createdAt = {}
            if (fromDate) matchStage.createdAt.$gte = new Date(fromDate)
            if (toDate) matchStage.createdAt.$lte = new Date(toDate)
        }

        const skip = (Number(page) - 1) * Number(limit)

        const sortObj = {}
        sort.split(',').forEach(field => {
            if (field.startsWith('-')) {
                sortObj[field.substring(1)] = -1
            } else {
                sortObj[field] = 1
            }
        })

        // Create a facet pipeline for better performance
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'blogcategories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },

            { $sort: sortObj },
            // Use $facet to get both paginated data and total count in single query
            {
                $facet: {
                    metadata: [
                        { $count: "total" },
                        {
                            $addFields: {
                                page: Number(page),
                                limit: Number(limit),
                                pages: {
                                    $ceil: {
                                        $divide: ["$total", Number(limit)]
                                    }
                                }
                            }
                        }
                    ],
                    data: [
                        { $skip: skip },
                        { $limit: Number(limit) },
                        {
                            $project: {
                                title: 1,
                                slug: 1,
                                shortDescription: 1,
                                coverImage: 1,
                                status: 1,
                                views: 1,
                                isFeatured: 1,
                                createdAt: 1,
                                category: 1,
                                extraMetadata: 1
                            },
                        }
                    ]
                }
            },
            { $unwind: "$metadata" }
        ]

        const result = await Blog.aggregate(pipeline)

        // If no results, return empty response
        if (result.length === 0) {
            return res.status(200).json({
                success: true,
                total: 0,
                page: Number(page),
                limit: Number(limit),
                pages: 0,
                results: 0,
                data: [],
            })
        }

        const { metadata, data } = result[0]

        res.status(200).json({
            success: true,
            total: metadata.total,
            page: metadata.page,
            limit: metadata.limit,
            pages: metadata.pages,
            results: data.length,
            data: data,
        })
    } catch (error) {
        console.error('Error fetching blogs:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getBlogBySlug = async (req, res) => {

    let isMongooseId = mongoose.Types.ObjectId.isValid(req.params.slug)

    try {
        const pipeline = [
            { $match: isMongooseId ? { _id: new mongoose.Types.ObjectId(req.params.slug) } : { slug: req.params.slug } },

            {
                $lookup: {
                    from: 'blogcategories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },

            //   {
            //     $lookup: {
            //       from: 'users',
            //       localField: 'author',
            //       foreignField: '_id',
            //       as: 'author',
            //     },
            //   },
            //   { $unwind: '$author' },
        ]

        const blogs = await Blog.aggregate(pipeline)

        if (!blogs.length) {
            return res
                .status(404)
                .json({ success: false, message: 'Blog not found' })
        }

        await Blog.updateOne(
            { _id: blogs[0]._id },
            { $inc: { views: 1 } }
        )

        res.status(200).json({
            success: true,
            data: blogs[0],
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })

        res.status(200).json({ success: true, data: blog })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

exports.deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id)
        res.status(200).json({ success: true, message: 'Blog deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}


const slugify = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')

const dummyHTML = (title) => `
  <h1>${title}</h1>
  <p>This is a <strong>dummy blog</strong> created for testing purposes.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
  <ul>
    <li>Clean HTML</li>
    <li>SEO Friendly</li>
    <li>MongoDB + Mongoose</li>
  </ul>
  <blockquote>
    "Good code is its own best documentation."
  </blockquote>
`

const seedBlogs = async () => {
    try {
        await Blog.deleteMany()
        await BlogCategory.deleteMany()

        // ✅ 1. Create Categories
        const categoriesData = [
            { name: 'Tech', description: 'Tech related blogs' },
            { name: 'Business', description: 'Business insights' },
            { name: 'Design', description: 'UI/UX & Design trends' },
            { name: 'Marketing', description: 'Digital marketing tips' },
            { name: 'Programming', description: 'Coding tutorials' },
        ]

        const categories = await BlogCategory.insertMany(
            categoriesData.map((cat) => ({
                ...cat,
                slug: slugify(cat.name),
                status: 'Active',
            }))
        )

        console.log('✅ Categories created')

        // ✅ 2. Create Blogs
        const blogTypes = ['blog']

        const blogsData = Array.from({ length: 10 }).map((_, i) => {
            const title = `Dummy Blog ${i + 1}`
            const category = categories[i % categories.length]

            return {
                title,
                blogType: blogTypes[i % blogTypes.length],
                slug: slugify(title),
                shortDescription: `Short description for ${title}`,
                description: dummyHTML(title),
                category: category._id,
                tags: ['dummy', 'test', 'blog'],
                coverImage: `https://picsum.photos/800/400?random=${i + 1}`,
                status: 'Published',
                isFeatured: true,
                views: Math.floor(Math.random() * 500),
                seo: {
                    metaTitle: title,
                    metaDescription: `SEO description for ${title}`,
                    keywords: ['blog', 'dummy', 'seo'],
                },
            }
        })

        await Blog.insertMany(blogsData)

        console.log('✅ 10 Dummy blogs created')
        process.exit(0)
    } catch (error) {
        console.error('❌ Seeding failed:', error)
        process.exit(1)
    }
}

// seedBlogs()
