const mongoose = require('mongoose');
const University = require('../models/University'); // Adjust path as needed
const ExtraContent = require('../models/ExtraContent'); // Adjust path as needed

const createUniversity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { extra_content, ...universityData } = req.body;

    const extraContentDoc = await ExtraContent.create(
      [extra_content || {}],
      { session }
    );

    const university = await University.create(
      [{ ...universityData, extra_content: extraContentDoc[0]._id }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: university[0], // because create returns an array when using array input
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUniversitie = async (req, res) => {
  try {
    const { name } = req.query;


    // data = await University.find({},{'country':1,'name' : 1, 'uni_logo':1}).select('-__v');

    const data = await University.aggregate([
      {
        $match: {
          status: 'Active',
          $or: [
            { isWeb: true },
            { isWeb: { $exists: false } }
          ]
        }
      },
      {
        $lookup: {
          from: "countries",           // The name of the collection to join with
          localField: "country",      // The field in University collection
          foreignField: "code",        // The field in countrys collection to match
          as: "countryData"           // Name of the output array field
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          uni_logo: 1,
          country: 1,
          'countryData.name': 1,             // Includes the joined data
          'countryData.flg': 1
          // __v: 0                      // Explicitly exclude version key
        }
      }
    ]);


    res.status(200).json({ success: true, count: data.length, data });


  } catch (error) {
    console.error('get universities error : ', error);
    res.status(500).json({ success: false, message: 'server error' });
  }
}

const getAllUniversities = async (req, res) => {
  try {
    const {
      name,
      country,
      city,
      status: uniStatus,
      code,
      established_year,
      on_compus_accommodation,
      isPublished,
      location_alias,
      extraStatus,
      populateExtra,
      intake,
      type,
      isWeb,
      page = 1,
      limit = 10
    } = req.query;


    console.log('req.query : ', req.query);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100)); // max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const uniMatch = {};

    if (isWeb) {
      uniMatch.$or = [
        { isWeb: isWeb ? false : true },
        { isWeb: { $exists: false } }
      ];
    } else {
      uniMatch.$or = [
        { isWeb: true },
        { isWeb: { $exists: false } }
      ];
    }

    if (name) uniMatch.name = { $regex: name, $options: 'i' };


    // if (country && country.trim() !== "") uniMatch.country = { $regex: country, $options: 'i' };

    const countryVal = country ? country.trim() : "";
    const countryArray = countryVal ? countryVal.split(",").map(c => c.trim()).filter(c => c !== "") : [];

    if (countryArray.length > 0) {
      uniMatch.country = { $in: countryArray };
    } else if (countryVal !== "") {
      uniMatch.country = { $regex: countryVal, $options: 'i' };
    }

    if (city) uniMatch.city = { $regex: city, $options: 'i' };
    if (uniStatus) uniMatch.status = uniStatus;
    if (!uniStatus) uniMatch.status = "Active"

    if (intake) {
      const intakeRegex = intake.split(",").map(item => new RegExp(`^${item.trim()}$`, "i"));

      uniMatch.intakes = {
        $in: intakeRegex,
      };
    }
    if (location_alias) uniMatch.location_alias = { $regex: location_alias, $options: 'i' };
    if (code) uniMatch.code = { $regex: code, $options: 'i' };
    if (established_year !== undefined) {
      const year = Number(established_year);
      if (!isNaN(year)) uniMatch.established_year = year;
    }
    if (on_compus_accommodation !== undefined) {
      uniMatch.on_compus_accommodation = on_compus_accommodation === 'true';
    }
    if (type) uniMatch.uni_type = type;

    const pipeline = [];

    if (Object.keys(uniMatch).length > 0) {
      pipeline.push({ $match: uniMatch });
    }

    const shouldPopulate = populateExtra === 'true';

    if (shouldPopulate) {
      pipeline.push({
        $lookup: {
          from: 'extracontents', // Mongoose default collection name
          localField: 'extra_content',
          foreignField: '_id',
          as: 'extra_content'
        }
      });

      pipeline.push({
        $unwind: {
          path: '$extra_content',
          preserveNullAndEmptyArrays: true
        }
      });
      const extraMatch = {};
      if (isPublished !== undefined) {
        extraMatch['extra_content.isPublished'] = isPublished === 'true';
      }
      if (extraStatus) {
        extraMatch['extra_content.status'] = extraStatus;
      }

      if (Object.keys(extraMatch).length > 0) {
        pipeline.push({ $match: extraMatch });
      }

      pipeline.push({
        $project: {
          __v: 0,
          'extra_content.__v': 0
        }
      });
    } else {
      pipeline.push({ $project: { __v: 0 } });
    }

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    pipeline.push(
      { $skip: skip },
      { $limit: limitNum }
    );

    const [result, countResult] = await Promise.all([
      University.aggregate(pipeline),
      University.aggregate(countPipeline)
    ]);

    console.log(countResult);

    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: result.length,
      total,
      page: pageNum,
      totalPages,
      result
    });
  } catch (error) {
    console.error('University aggregation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUniversityById = async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = [
      { $match: mongoose.Types.ObjectId.isValid(id) ? { _id: new mongoose.Types.ObjectId(id) } : { slug: id } },

      {
        $lookup: {
          from: 'extracontents',
          localField: 'extra_content',
          foreignField: '_id',
          as: 'extra_content'
        }
      },

      {
        $unwind: {
          path: '$extra_content',
          preserveNullAndEmptyArrays: true // in case ref is broken or null
        }
      },

      {
        $project: {
          __v: 0,
          'extra_content.__v': 0
        }
      }
    ];

    const result = await University.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    res.status(200).json({
      success: true,
      result: result[0]
    });
  } catch (error) {
    console.error('University fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateUniversity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { extra_content, ...universityData } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid university ID format'
      });
    }

    const university = await University.findById(id).session(session);
    if (!university) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    if (extra_content) {
      await ExtraContent.findByIdAndUpdate(
        university.extra_content,
        extra_content,
        {
          new: true,
          runValidators: true,
          session
        }
      );
    }

    const updatedUniversity = await University.findByIdAndUpdate(
      id,
      universityData,
      {
        new: true,
        runValidators: true,
        session
      }
    );

    let populatedUniversity = updatedUniversity.toObject({ getters: true });

    if (updatedUniversity.extra_content) {
      const extraDoc = await ExtraContent.findById(updatedUniversity.extra_content)
        .select('-__v')
        .session(session);
      populatedUniversity.extra_content = extraDoc || null;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      populatedUniversity
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    if (error instanceof mongoose.CastError || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    console.error('Update university error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const deleteUniversity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid university ID format'
      });
    }

    const university = await University.findById(id).session(session);
    if (!university) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'University not found'
      });
    }

    await ExtraContent.findByIdAndDelete(university.extra_content).session(session);

    await University.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'University and associated content deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof mongoose.CastError || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    console.error('Delete university error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const getFlatUniversities = async (req, res) => {
  try {
    const { name, limit = 100, slug } = req.query;

    const query = {};

    // Optional search by name
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (slug) {
      query.location_alias = slug
    }


    const universities = await University.find(query)
      .select('_id name slug cover_photo uni_logo address short_description acceptanceRate')   // only required fields
      .sort({ name: 1 })    // optional sorting
      .limit(Math.min(parseInt(limit) || 100, 500))
      .lean();

    res.status(200).json({
      success: true,
      count: universities.length,
      data: universities
    });

  } catch (error) {
    console.error('Flat universities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createUniversity,
  getAllUniversities,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  getFlatUniversities,
  getUniversitie
};