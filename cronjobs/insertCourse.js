const mongoose = require('mongoose');
const fetch = require("node-fetch");
const University = require("../models/University");
const Course = require("../models/Course");
const CourseCategory = require("../models/CourseCategory");
const ExtraContent = require("../models/ExtraContent");

const D = require("../src/italy.json");
const { createUniversity } = require('./insertUni');


const country = "United Arab Emirates";

const universities = [
    "John Cabot University"]

function makeSlug(text) {
    return text
        ?.toString()
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // remove special chars
        .replace(/\s+/g, "-")     // spaces to hyphens
        .replace(/--+/g, "-")     // multiple hyphens to one
        .replace(/^-+|-+$/g, ""); // trim hyphens
}

async function generateCourseData(universityName, universityId) {
    try {
        const prompt = `
You are an AI assistant that provides authentic university course data. 
Generate a list of REAL courses offered by ${universityName} in ${country}.
top 10 course list 

**IMPORTANT**: 
- Only provide courses that are ACTUALLY offered by this university
- Verify the data from the university's official website
- Provide accurate, real information

Return ONLY a valid JSON array of course objects in this format:
[
  {
    "name": "Bachelor of Science in Computer Science",
    "shortName": "BSc CS",
    "studyMode": "Full-time or Part-time or Online or Hybrid",
    "tuitionFee": 25000,
    "currency": "EUR",
    "level": "Undergraduate or Graduate or Postgraduate or PhD",
    "tags": ["Engineering", "Computer Science", "Technology"],
    "applicationFee": 50,
    "duration": "3 years or 4 years or 1 year or 2 years",
    "description": "Comprehensive description of the course (100-200 words)",
    "overview": "Overview of the course like what you will learn and what you will do in the course and what is future scope (300-500 words)",
    "requirements": {
  "gre": {
    "value": "66",
    "des":"description of it if any"
  },
  "pte": {
    "value": "io",
     "des":"description of it if any"
  },
  "gmat": {
    "value": "89",
    "des":"description of it if any"
  },
  "ielts": {
    "value": "50",
    "des":"description of it if any"
  },
  "postgraduate": {
    "value": "66",
    "des":"description of it if any"
  },
  "graduate": {
    "value": "50",
    "des":"description of it if any"
  },
  "secondary": {
    "value": "40",
    "des":"description of it if any"
  },
  "sat": {
    "value": "40",
    "des": ""
  },
  "work_experience": {
    "value": "2",
    "des": ""
  },
  "minimum_age": {
    "value": "21",
    "des": ""
  }
},//if some of the requirements are not required, just remove them only add them that actually matter
    "docsRequired": [
      "Academic transcripts",
      "English proficiency test scores",
      "CV/Resume",
      "Statement of Purpose",
      "Letters of Recommendation"
    ]
  }
]

IMPORTANT: Only return valid JSON. Do not include any markdown formatting or additional text.
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer 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`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b:free",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const result = await response.json();
        console.log(result);
        let content = result?.choices?.[0]?.message?.content || "[]";

        console.log(result?.choices?.[0]?.message)


        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        console.log(JSON.parse(content));
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to generate courses for ${universityName}:`, err.message);
        return [];
    }
}

async function insertCourse(courseData, university, category, subject) {
    try {
        const slug = makeSlug(courseData.name + "-" + university.name);

        const existingCourse = await Course.findOne({
            $or: [
                { name: courseData.name },
                { slug: slug }
            ]
        });

        if (existingCourse) {
            console.log(`⚠️ Course already exists: ${courseData.name} at ${university.name}`);
            return null;
        }

        // Create extra content for the course
        const extraContent = await ExtraContent.create({
            sections: [
                {
                    section_key: "overview",
                    heading: "Overview",
                    content: courseData.description || "",
                    order: 1
                },
                {
                    section_key: "requirements",
                    heading: "Requirements",
                    content: JSON.stringify(courseData.requirements || {}),
                    order: 2
                },
                {
                    section_key: "documents",
                    heading: "Required Documents",
                    content: JSON.stringify(courseData.docsRequired || []),
                    order: 3
                }
            ]
        });

        // Create the course
        const course = new Course({
            name: courseData.name,
            slug: slug,
            university: university._id,
            category: category._id,
            subject: subject._id,
            studyMode: courseData.studyMode || "Full-time",
            shortName: courseData.shortName || "",
            tuitionFee: courseData.tuitionFee || 0,
            currency: courseData.currency || "EUR",
            level: courseData.level || "Undergraduate",
            tags: courseData.tags || [],
            applicationFee: courseData.applicationFee || 0,
            duration: courseData.duration || "Not specified",
            status: "Active",
            description: courseData.description || "",
            requirements: courseData.requirements || {},
            docsRequired: courseData.docsRequired || [],
            extra_content: extraContent._id,
            country: "IT",
            seoData: courseData.seoData || {}
        });

        await course.save();
        console.log(`✅ Course Created: ${course.name} at ${university.name}`);
        return course;
    } catch (err) {
        console.error(`❌ Error creating course ${courseData.name}:`, err.message);
        return null;
    }
}

// Main function to process a university
async function processUniversity(universityName) {
    try {
        console.log(`\n📚 Processing university: ${universityName}`);

        const university = await University.findOne({
            $or: [
                { name: universityName },
                { slug: makeSlug(universityName) }
            ]
        });

        if (!university) {
            console.log(`❌ University not found: ${universityName}`);
            return;
        }

        const courseList = await generateCourseData(universityName, university._id);

        return

        if (!courseList || courseList.length === 0) {
            console.log(`⚠️ No courses found for ${universityName}`);
            return;
        }

        console.log(`📊 Found ${courseList.length} courses for ${universityName}`);

        // Insert each course
        let insertedCount = 0;
        for (const courseData of courseList) {
            const result = await insertCourse(courseData, university, category, subject);
            if (result) insertedCount++;
        }

        console.log(`✅ Completed: ${insertedCount}/${courseList.length} courses inserted for ${universityName}`);
    } catch (err) {
        console.error(`❌ Error processing ${universityName}:`, err.message);
    }
}

// Main execution
async function main() {
    console.log("🚀 Course Import Process Started");
    console.log("=================================");
    try {
        for (const universityName of universities) {
            console.log(`📚 Processing university: ${universityName}`);
            await processUniversity(universityName);

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log("\n✅ Course Import Process Completed");
        console.log("=================================");
    } catch (err) {
        console.error("❌ Fatal error:", err.message);
    }
}

async function generateCoursebyai(university, course) {
    try {
        const prompt = `
You are an AI assistant that provides authentic university course data. 
convert data in my format this is for the ${country} for ${university} for the ${course}.

i will provoide a data ${course} convert this data as this format

Return ONLY a valid JSON array of course objects in this format:
  {
    "name": "Bachelor of Science in Computer Science",
    "shortName": "BSc CS",
    "tags": ["Engineering", "Computer Science", "Technology"],
    "description": "Comprehensive description of the course (100-200 words)",
    "overview": "Overview of the course like what you will learn and what you will do in the course and what is future scope (300-500 words)",
    "docsRequired": [
      "Academic transcripts",
      "English proficiency test scores",
      "CV/Resume",
      "Statement of Purpose",
      "Letters of Recommendation"
    ]
  }

IMPORTANT: Only return valid JSON. Do not include any markdown formatting or additional text.
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer `,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b:free",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        const result = await response.json();
        let content = result?.choices?.[0]?.message?.content || "[]";
        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // console.log(JSON.parse(content));
        return JSON.parse(content);
    } catch (err) {
        console.error(`Failed to generate courses for ${university}:`, err.message);
        return [];
    }
}

async function kcmain() {
    console.log("🚀 Course Import Process Started");
    console.log("=================================");
    try {

        let count = 0
        // const courseData = D.data[0];
        for (const courseData of D.data) {
            console.log(`📚 Processing university: ${courseData.Name}`);
            let university;

            count++
            console.log(count)

            university = await University.findOne({
                $or: [
                    { name: courseData.universityName },
                    { slug: makeSlug(courseData.universityName) }
                ]
            });

            if (!university) {
                console.log(`❌ University not found: ${courseData.universityName}`);
                await createUniversity(courseData.universityName);
                university = await University.findOne({
                    $or: [
                        { name: courseData.universityName },
                        { slug: makeSlug(courseData.universityName) }
                    ]
                });
                if (!university) {
                    console.log(`❌ University not found: ${courseData.universityName}`);
                    continue;
                }
            }

            const firstCategoryId = String(courseData.CategoryId)
                .split(",")[0]
                .trim();

            const cate = D["study-area"].find(
                (i) => String(i.value) === firstCategoryId
            );

            console.log(cate);

            const category = await CourseCategory.findOne({
                $or: [
                    { name: cate?.label }
                    // { slug: makeSlug(courseData.categoryName) }
                ]
            });

            if (!category) {
                console.log(`❌ Category not found: ${cate?.label}`);
                continue;
            }

            const isCourseExists = await Course.findOne({
                name: courseData.Name, university: new mongoose.Types.ObjectId(university._id)
            });

            if (isCourseExists) {
                console.log(`⚠️ Course already exists: ${courseData.Name} at ${university.name}`);
                isCourseExists.metaInfo = {
                    initialDeposit: courseData.DepositSortAmount,
                    campus: courseData.Campus,
                    backlog: courseData.backlog,
                    deadline: courseData.ApplicationDeadline,
                    Intakes: courseData.Intakes,
                    UpcomingIntakeDeadLines: courseData.UpcomingIntakeDeadLines,
                    intakeDeadline: courseData.IntakesAndDeadlines,
                    IntakesClosed: courseData.IntakesClosed,
                    applicationFeeWaiver: courseData.AppFeeWaiverAvailable,
                    WithoutEnglishProficiency: courseData.WithoutEnglishProficiency,
                    ScholarshipAvailable: courseData.ScholarshipAvailable,
                    ScholarshipDeatil: courseData.ScholarshipDetail,
                    AverageScholarship: courseData.AverageScholarship,
                    AverageScholarshipRemarks: courseData.AverageScholarshipRemarks,
                    InternshipAvailable: courseData.InternshipAvailable,
                    WithoutMaths: courseData.WithoutMaths,
                    IsStemCourse: courseData.IsStemCourse,
                    EntryRequirement: courseData.EntryRequirement,
                    Remarks: courseData.Remarks,
                    highlight: courseData.Highlights,
                    IsMOIWaiver: courseData.IsMOIWaiver,
                    EnglishMarks12Score: courseData.EnglishMarks12Score
                }
                isCourseExists.requirements={
                    ...(courseData.PteScore && { PteScore: courseData.PteScore }),
                    ...(courseData.PteNoSectionLessThan && { PteNoSectionLessThan: courseData.PteNoSectionLessThan }),
                    ...(courseData.ToeflScore && { ToeflScore: courseData.ToeflScore }),
                    ...(courseData.ToeflNoSectionLessThan && { ToeflNoSectionLessThan: courseData.ToeflNoSectionLessThan }),
                    ...(courseData.IeltsOverall && { Ielts: courseData.IeltsOverall }),
                    ...(courseData.IeltsNoBandLessThan && { IeltsNoBandLessThan: courseData.IeltsNoBandLessThan }),
                    ...(courseData.DETScore && { DETScore: courseData.DETScore }),
                    ...(courseData.GreScore && { GreScore: courseData.GreScore }),
                    ...(courseData.GmatScore && { GmatScore: courseData.GmatScore }),
                    ...(courseData.ActScore && { ActScore: courseData.ActScore }),
                    ...(courseData.SatScore && { SatScore: courseData.SatScore }),
                    ...(courseData.EntryRequirementTwelfth && { EntryRequirementTwelfth: courseData.EntryRequirementTwelfth }),
                    ...(courseData.EntryRequirementUG && { EntryRequirementUG: courseData.EntryRequirementUG }),
                    ...(courseData.WorkExp && { WorkExp: courseData.WorkExp })
                }

                console.log(isCourseExists._id)

                // await isCourseExists.save();

                continue;
            }


            let aiData;
            aiData = await generateCoursebyai(courseData.universityName, courseData.Name)

            if (aiData.length === 0) {
                aiData = await generateCoursebyai(courseData.universityName, courseData.Name)
            }

            if (aiData.length === 0) {
                console.log(`❌ Course not found: ${courseData.Name}`);
                return;
            }


            function getInitials(name) {
                if (!name) return "";

                return name
                    .split(" ")
                    .map(word => word.charAt(0))
                    .join("")
                    .toUpperCase();
            }

            const extraContent = await ExtraContent.create({
                "sections": [
                    {
                        "section_key": "overview",
                        "heading": "Overview",
                        "content": aiData[0].overview || "",
                        "order": 1
                    }]
            });

            console.log(university.code)

            const course = new Course({
                name: courseData.Name,
                slug: makeSlug(`${courseData.Name}-${university.name.toLowerCase()}`),
                extra_content: extraContent._id,
                university: university._id,
                category: category._id,
                tuitionFee: courseData.Amount || 0,
                currency: courseData.Currency || "EUR",
                level: courseData.Studylvl || "Undergraduate",
                studyMode: courseData.IsOnlineCourse ? "Online" : "Full-time",
                shortName: aiData[0].shortName || "",
                applicationFee: courseData.ApplicationFeeAmt || 0,
                metaInfo: {
                    initialDeposit: courseData.DepositSortAmount,
                    campus: courseData.Campus,
                    backlog: courseData.backlog,
                    deadline: courseData.ApplicationDeadline,
                    Intakes: courseData.Intakes,
                    UpcomingIntakeDeadLines: courseData.UpcomingIntakeDeadLines,
                    intakeDeadline: courseData.IntakesAndDeadlines,
                    IntakesClosed: courseData.IntakesClosed,
                    applicationFeeWaiver: courseData.AppFeeWaiverAvailable,
                    WithoutEnglishProficiency: courseData.WithoutEnglishProficiency,
                    ScholarshipAvailable: courseData.ScholarshipAvailable,
                    ScholarshipDeatil: courseData.ScholarshipDetail,
                    AverageScholarship: courseData.AverageScholarship,
                    AverageScholarshipRemarks: courseData.AverageScholarshipRemarks,
                    InternshipAvailable: courseData.InternshipAvailable,
                    WithoutMaths: courseData.WithoutMaths,
                    IsStemCourse: courseData.IsStemCourse,
                    EntryRequirement: courseData.EntryRequirement,
                    Remarks: courseData.Remarks,
                    highlight: courseData.Highlights,
                    IsMOIWaiver: courseData.IsMOIWaiver,
                    EnglishMarks12Score: courseData.EnglishMarks12Score
                },
                duration: `${courseData.Duration} Month` || "Not specified",
                tags: aiData[0].tags || [],
                description: aiData[0].description || "",
                requirements: {
                    ...(courseData.PteScore && { PteScore: courseData.PteScore }),
                    ...(courseData.PteNoSectionLessThan && { PteNoSectionLessThan: courseData.PteNoSectionLessThan }),
                    ...(courseData.ToeflScore && { ToeflScore: courseData.ToeflScore }),
                    ...(courseData.ToeflNoSectionLessThan && { ToeflNoSectionLessThan: courseData.ToeflNoSectionLessThan }),
                    ...(courseData.IeltsOverall && { Ielts: courseData.IeltsOverall }),
                    ...(courseData.IeltsNoBandLessThan && { IeltsNoBandLessThan: courseData.IeltsNoBandLessThan }),
                    ...(courseData.DETScore && { DETScore: courseData.DETScore }),
                    ...(courseData.GreScore && { GreScore: courseData.GreScore }),
                    ...(courseData.GmatScore && { GmatScore: courseData.GmatScore }),
                    ...(courseData.ActScore && { ActScore: courseData.ActScore }),
                    ...(courseData.SatScore && { SatScore: courseData.SatScore }),
                    ...(courseData.EntryRequirementTwelfth && { EntryRequirementTwelfth: courseData.EntryRequirementTwelfth }),
                    ...(courseData.EntryRequirementUG && { EntryRequirementUG: courseData.EntryRequirementUG }),
                    ...(courseData.WorkExp && { WorkExp: courseData.WorkExp })
                },
                docsRequired: aiData[0].docsRequired
            });

            await course.save();

            console.log(`📊 Inserting course: ${course.name} at ${university.name} `);
        }


        console.log("\n✅ Course Import Process Completed");
        console.log("=================================");
    } catch (err) {
        console.error("❌ Fatal error:", err);
    }
}

kcmain();