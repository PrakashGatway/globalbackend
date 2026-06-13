const Course = require('../models/Course')
const mongoose = require('mongoose');
const ExtraContent = require('../models/ExtraContent');
const University = require('../models/University');

exports.createCourse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { extra_content, ...courseData } = req.body;
  try {
    let extraContentId;
    if (mongoose.Types.ObjectId.isValid(extra_content)) {
      extraContentId = new mongoose.Types.ObjectId(extra_content)
    } else {
      const extraContentDoc = await ExtraContent.create(
        [extra_content || {}],
        { session }
      );
      extraContentId = extraContentDoc[0]._id
    }

    courseData.extra_content = extraContentId

    const universityDetail = await University.findById(new mongoose.Types.ObjectId(courseData.university)).session(session);

    courseData.country = universityDetail.country;

    const course = await Course.create([courseData], { session })

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true
    })
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}


// exports.getAllCourses = async (req, res) => {
//   try {
//     let {
//       search,
//       country,
//       university,
//       subject,
//       level,
//       category,
//       studyMode,
//       currency,
//       status,
//       minFee,
//       maxFee,
//       duration,
//       page = 1,
//       limit = 10,
//       isExtra = "true",
//       sort = '-createdAt',
//     } = req.query

//     page = Number(page)
//     limit = Number(limit)

//     const matchStage = {}

//     // 🔍 SEARCH (name, shortName, tags)
//     if (search && search.trim()) {
//       matchStage.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { shortName: { $regex: search, $options: 'i' } },
//         { tags: { $regex: search, $options: 'i' } }
//       ]
//     }

//     // 🎓 FILTERS
//     if (university) matchStage.university = new mongoose.Types.ObjectId(university)
//     if (category) matchStage.category = new mongoose.Types.ObjectId(category)
//     if (subject) matchStage.subject = new mongoose.Types.ObjectId(subject)
//     if (level) matchStage.level = level
//     if (studyMode) matchStage.studyMode = studyMode
//     if (currency) matchStage.currency = currency
//     if (status) matchStage.status = status
//     if (!status) matchStage.status = 'Active' // Default to active courses
//     if (duration) matchStage.duration = duration

//     if (minFee || maxFee) {
//       matchStage.tuitionFee = {}
//       if (minFee) matchStage.tuitionFee.$gte = Number(minFee)
//       if (maxFee) matchStage.tuitionFee.$lte = Number(maxFee)
//     }

//     const sortStage = {}
//     if (sort.startsWith('-')) {
//       sortStage[sort.slice(1)] = -1
//     } else {
//       sortStage[sort] = 1
//     }
//     let lookupStages = []
//     if (isExtra == 'true') {
//       lookupStages = [{
//         $lookup: {
//           from: 'extracontents',
//           localField: 'extra_content',
//           foreignField: '_id',
//           as: 'extra_content',
//         },
//       },
//       { $unwind: '$extra_content' }]
//     } else {
//       lookupStages = []
//     }

//     const pipeline = [
//       { $match: matchStage },
//       {
//         $lookup: {
//           from: 'universities',
//           localField: 'university',
//           foreignField: '_id',
//           as: 'university',
//           pipeline: [{ $project: { name: 1, slug: 1, uni_type: 1, intakes: 1, address: 1, country: 1, city: 1, uni_logo: 1, acceptanceRate: 1 } }],
//         },
//       },
//       { $unwind: '$university' },
//       {
//         $lookup: {
//           from: 'coursecategories',
//           localField: 'category',
//           foreignField: '_id',
//           as: 'category',
//           pipeline: [{ $project: { name: 1 } }],
//         },
//       },
//       { $unwind: '$category' },
//       {
//         $lookup: {
//           from: 'subjects',
//           localField: 'subject',
//           foreignField: '_id',
//           as: 'subject',
//           pipeline: [{ $project: { name: 1 } }],
//         },
//       },
//       { $unwind: '$subject' },
//       ...lookupStages,

//       // {
//       //   $lookup: {
//       //     from: 'scholarships',
//       //     localField: 'scholarShip',
//       //     foreignField: '_id',
//       //     as: 'scholarShip',
//       //   },
//       // },
//       // { $unwind: { path: '$scholarShip', preserveNullAndEmptyArrays: true } },

//       {
//         $facet: {
//           data: [
//             { $sort: sortStage },
//             { $skip: (page - 1) * limit },
//             { $limit: limit },
//           ],
//           totalCount: [{ $count: 'count' }],
//         },
//       },
//     ]

//     const result = await Course.aggregate(pipeline)

//     const data = result[0].data
//     const total = result[0].totalCount[0]?.count || 0

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       pages: Math.ceil(total / limit),
//       data,
//     })
//   } catch (error) {
//     console.error('Get Courses Error:', error)
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     })
//   }
// }


exports.getAllCourses = async (req, res) => {
  try {
    let {
      search,
      country,
      university,
      subject,
      level,
      category,
      studyMode,
      currency,
      status,
      minFee,
      maxFee,
      duration,
      page = 1,
      limit = 10,
      isExtra = "true",
      sort = '-createdAt',
      gre,
      pte,
      gmat,
      ielts,
      sat,
      gpa,
      toefl,
      work_experience,
      minimum_age
    } = req.query

    page = Number(page)
    limit = Number(limit)

    const matchStage = {}

    // 🔍 SEARCH (name, shortName, tags)
    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }

    const requirementKeys = [
      'gre',
      'pte',
      'gmat',
      'ielts',
      'sat',
      'gpa',
      'toefl',
      'postgraduate',
      'graduate',
      'secondary',
      'work_experience',
      'minimum_age',
    ]

    const requirementFilters = requirementKeys
      .filter((key) => req.query[key])
      .map((key) => ({
        [`requirements.${key}.value`]: { $lte: String(req.query[key]) },
      }))

    if (requirementFilters.length) {
      matchStage.$and = [
        ...(matchStage.$and || []),
        ...requirementFilters,
      ]
    }





    // 🎓 FILTERS
    if (university) matchStage.university = new mongoose.Types.ObjectId(university)
    if (category) matchStage.category = new mongoose.Types.ObjectId(category)
    if (subject) matchStage.subject = new mongoose.Types.ObjectId(subject)
    if (level) matchStage.level = level
    if (studyMode) matchStage.studyMode = studyMode
    if (currency) matchStage.currency = currency
    if (status) matchStage.status = status
    if (!status) matchStage.status = 'Active' // Default to active courses
    if (duration) matchStage.duration = duration

    if (minFee || maxFee) {
      matchStage.tuitionFee = {}
      if (minFee) matchStage.tuitionFee.$gte = Number(minFee)
      if (maxFee) matchStage.tuitionFee.$lte = Number(maxFee)
    }
 
    
    const sortStage = {}
    if (sort.startsWith('-')) {
      sortStage[sort.slice(1)] = -1
    } else {
      sortStage[sort] = 1
    }
    let lookupStages = []
    if (isExtra == 'true') {
      lookupStages = [{
        $lookup: {
          from: 'extracontents',
          localField: 'extra_content',
          foreignField: '_id',
          as: 'extra_content',
        },
      },
      { $unwind: '$extra_content' }]
    } else {
      lookupStages = []
    }

    console.log("GRE:", gre)
console.log(JSON.stringify(matchStage, null, 2))

const test = await Course.find(matchStage).limit(5)
console.log("TEST COUNT:", test.length)

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'universities',
          localField: 'university',
          foreignField: '_id',
          as: 'university',
          pipeline: [{ $project: { name: 1, slug: 1, uni_type: 1, intakes: 1, address: 1, country: 1, city: 1, uni_logo: 1, acceptanceRate: 1 } }],
        },
      },
      { $unwind: '$university' },
      {
        $lookup: {
          from: 'coursecategories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subject',
          foreignField: '_id',
          as: 'subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: '$subject' },
      ...lookupStages,

      // {
      //   $lookup: {
      //     from: 'scholarships',
      //     localField: 'scholarShip',
      //     foreignField: '_id',
      //     as: 'scholarShip',
      //   },
      // },
      // { $unwind: { path: '$scholarShip', preserveNullAndEmptyArrays: true } },

      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]

    const result = await Course.aggregate(pipeline)

    const data = result[0].data
    const total = result[0].totalCount[0]?.count || 0

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    })
  } catch (error) {
    console.error('Get Courses Error:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getCourseById = async (req, res) => {
  const { id } = req.params
  try {
    const course = await Course.findOne(mongoose.Types.ObjectId.isValid(id) ? { _id: new mongoose.Types.ObjectId(id) } : { slug: id })
      .populate('university')
      .populate('subject')
      .populate('extra_content')

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      })
    }

    res.status(200).json({
      success: true,
      data: course,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateCourse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { extra_content, ...courseData } = req.body;

  try {
    const course = await Course.findById(req.params.id).session(session);

    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let extraContentId = course.extra_content;

    if (extra_content) {
      if (mongoose.Types.ObjectId.isValid(extra_content)) {
        extraContentId = new mongoose.Types.ObjectId(extra_content);
      } else {
        if (course.extra_content) {
          await ExtraContent.findByIdAndUpdate(
            course.extra_content,
            extra_content,
            { new: true, session }
          );
        } else {
          const extraContentDoc = await ExtraContent.create(
            [extra_content],
            { session }
          );
          extraContentId = extraContentDoc[0]._id;
        }
      }
    }

    courseData.extra_content = extraContentId;

    await Course.findByIdAndUpdate(
      req.params.id,
      courseData,
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}


exports.getExtraContentWithCourse = async (req, res) => {
  try {
    const courses = await Course.find({ extra_content: { $exists: true } })
      .select('name extra_content')
      .populate({
        path: 'extra_content',
        select: 'isPublished status',
      });

    const response = courses.map(course => ({
      courseName: course.name,
      extraContent: course.extra_content,
    }));

    res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
