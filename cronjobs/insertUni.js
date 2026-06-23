const cron = require("node-cron");
const fetch = require("node-fetch");
const University = require("../models/University");
const ExtraContent = require("../models/ExtraContent");

const universities = [
  "JOHN CABOT UNIVERSITY"
];

const country = "Italy";

async function generateUniversityData(universityName) {
    try {
        const prompt = `
Generate complete university data in JSON format.

here rank type only i want type:"QS World", type:"THE" use this format only

i want exact real data don't give fake data give me exact data on form there website of university find authnticated data and give me authnticated data

University Name: ${universityName}
Country: ${country}

Return ONLY valid JSON.
give me clean data.
and give me authnticated data.search for ${universityName} and ${country} or there campus only
{
  "name":"",
  "slogan":"",
  "uni_type":"public or private",
  "short_description":"",
  "address":"",
  "intakes":[example(array of month in which the intake open):["February", "September"]],
  "code":"",
  "city":"",
  "google_location":example-google_location: {
  "lat": "40.17514",
  "lng": "74.1574545"
},
  "uni_web":"",
  "uni_contact":"",
  "uni_logo":"",
  "cover_photo":"",
  "overview":give arround 300 word or max of the overview of the university,
  "uni_rank":[
      {
          type:"QS World",
          rank:"50"
          year:"2026"
      },
      {
  "type": "THE",
  "rank": "401",
  "year": "2026"
}
    ],
  "established_year":0,
  "acceptanceRate":0,
  "uni_rank":"",
  "on_campus_accommodation":false,
  "off_campus_accommodation":false,
  "financials":financials: {
  "cost_of_living": "NZD 15,000 – NZD 22,000",
  "ug_fees": "NZD 28,000 – NZD 45,000",
  "pg_fees": "NZD 30,000 – NZD 50,000",
  "other_fees": "NZD 10,000 – NZD 22,000"
},
  "social_links":{
      "facebook":"",
      "twitter":"",
      "instagram":"",
      "linkedin":""
  },
  "tags":"comma seprated"
}
`;
        console.log("api called")
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
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
            }
        );

        const result = await response.json();
        let content =
            result?.choices?.[0]?.message?.content || "{}";


        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        return JSON.parse(content);
    } catch (err) {
        console.error(
            `Failed generating ${universityName}`,
            err.message
        );
        return null;
    }
}
async function createUniversity(universityName) {
    try {

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

        const exists = await University.findOne({
            $or: [
                { name: universityName },
                { slug: makeSlug(universityName) }
            ]
        });

        if (exists) {
            console.log(`⚠️ Already exists: ${universityName}`);
            return;
        }

        const aiData = await generateUniversityData(universityName);

        console.log(aiData)

        if (!aiData) return

        const extraContent = await ExtraContent.create({
            "sections": [
                {
                    "section_key": "overview",
                    "heading": "Overview",
                    "content": aiData.overview || "",
                    "order": 1
                }]
        });

        const university = new University({
            name: universityName,
            extra_content: extraContent._id,
            slug: makeSlug(aiData.name),
            slogan: aiData.slogan || "",
            uni_type: aiData.uni_type || "Public",
            short_description:
                aiData.short_description || "",
            code: aiData.code || "",
            address: aiData.address || "",
            country: "IT",
            city: aiData.city || "",
            social_links: aiData.social_links || {},
            uni_web: aiData.uni_web || "",
            uni_contact: aiData.uni_contact || "",
            uni_logo: aiData.uni_logo || "",
            cover_photo: aiData.cover_photo || "",
            intakes: aiData.intakes || [],
            established_year:
                aiData.established_year || null,
            acceptanceRate:Number(
                    String(aiData.acceptanceRate || 0).replace("%", "")
                ) || 0,
            uni_rank: aiData.uni_rank || "",
            google_location: aiData.google_location || "",
            seo_metadata:
                aiData.seo_metadata || {},
            financials: aiData.financials || {},
            tags: aiData.tags || "",
            on_campus_accommodation: aiData.on_campus_accommodation || false,
            off_campus_accommodation: aiData.off_campus_accommodation || false,
        });

        await university.save();

        console.log(
            `✅ University Created: ${university.name}`
        );
    } catch (err) {
        console.error(
            `❌ Create University Error`,
            err.message
        );
    }
}

// cron.schedule("*/20 * * * * *", async () => {
//     console.log("🚀 University Import Started");

//     for (const universityName of universities) {
//         await createUniversity(universityName);
//     }

//     console.log("✅ University Import Completed");
// });

// (async () => {
//     console.log("🚀 University Import Started");

//     for (const universityName of universities) {
//         await createUniversity(universityName);
//     }

//     console.log("✅ University Import Completed");
// })();

exports.createUniversity = createUniversity