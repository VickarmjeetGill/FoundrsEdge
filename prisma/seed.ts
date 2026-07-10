import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import "dotenv/config"; // Load environment variables from .env/env.local

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STAGES = ["Validate", "Build", "Grow", "Scale"];
const INDUSTRIES = ["Technology", "Energy", "Finance", "Healthcare", "Real Estate", "Professional Services"];
const BUSINESS_TYPES = ["B2B SaaS", "Professional Services", "E-commerce", "Marketing Agency", "Manufacturing"];
const REVENUES = ["<$100k", "$100k-$500k", "$500k-$2M", "$2M-$5M", "$5M+"];
const EMPLOYEES = ["1-5", "6-15", "16-50", "51-200", "200+"];

async function main() {
    console.log("🌱 Cleaning up database...");

    // Clean up existing data to avoid unique constraint conflicts on multiple seeds
    await prisma.businesses.deleteMany({});
    await prisma.members.deleteMany({});
    // await prisma.user.deleteMany({}); // Preserves manual test accounts

    console.log("👥 Seeding members and businesses...");

    for (let i = 0; i < 15; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });
        const phone = faker.phone.number();
        const stage = faker.helpers.arrayElement(STAGES);
        const industry = faker.helpers.arrayElement(INDUSTRIES);
        const linkedin = `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

        // 1. Create member and retrieve their generated database ID
        const member = await prisma.members.create({
            data: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                stage: stage,
                industry: industry,
                linkedin: linkedin
            }
        });

        // 2. Create the associated business for this member
        const businessName = faker.company.name();
        const businessType = faker.helpers.arrayElement(BUSINESS_TYPES);
        const revenue = faker.helpers.arrayElement(REVENUES);
        const employees = faker.helpers.arrayElement(EMPLOYEES);

        await prisma.businesses.create({
            data: {
                member_id: member.id,
                business_name: businessName,
                business_desc: faker.company.buzzPhrase() + ". " + faker.company.catchPhrase(),
                website: `https://www.${faker.helpers.slugify(businessName).toLowerCase()}.ca`,
                business_type: businessType,
                revenue: revenue,
                employees: employees,
                geographic_focus: ["Calgary", "Alberta"],
                ideal_client_industries: [faker.helpers.arrayElement(INDUSTRIES)],
                referral_partner_industries: [faker.helpers.arrayElement(INDUSTRIES)],
                priorities: ["Scaling sales", "Finding investors"],
                open_to_matching: true
            }
        });
    }

    console.log("✅ 15 Members and associated Businesses seeded successfully!");

    // 3. Create a default test login account
    console.log("🔑 Seeding default test login account...");
    const testEmail = "admin@foundersedge.com";
    const testPassword = "password123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await prisma.user.upsert({
        where: { email: testEmail },
        update: {
            password: hashedPassword,
            role: "ADMIN"
        },
        create: {
            email: testEmail,
            password: hashedPassword,
            name: "Default Admin",
            role: "ADMIN"
        }
    });

    console.log(`✅ Default user seeded!`);
    console.log(`👉 Login Email: ${testEmail}`);
    console.log(`👉 Password: ${testPassword}`);

    console.log("🗺 Seeding default roadmap steps...");
    
    // Clean up existing steps first to prevent duplicates/drift
    await prisma.roadmapStep.deleteMany({});
    
    const stepsData = [
        // START track
        {
            track: "START",
            weekNumber: 1,
            title: "Complete Member Profile",
            description: "Fill out your profile details to get introduced.",
            actionText: "Edit Profile",
            actionHref: "/dashboard/settings",
            order: 1
        },
        {
            track: "START",
            weekNumber: 2,
            title: "Connect with Matches",
            description: "Reach out and connect with your recommended matches.",
            actionText: "View Matches",
            actionHref: "/dashboard?tab=matches",
            order: 2
        },
        {
            track: "START",
            weekNumber: 3,
            title: "Explore Resource Hub",
            description: "Browse guides and playbooks in the Resource Hub.",
            actionText: "Browse Resources",
            actionHref: "/resources",
            order: 3
        },
        {
            track: "START",
            weekNumber: 4,
            title: "Offers and Awards",
            description: "Explore member discounts and open award directories.",
            actionText: "Explore Awards",
            actionHref: "/awards",
            order: 4
        },
        // GROW track
        {
            track: "GROW",
            weekNumber: 1,
            title: "Register for Local Events",
            description: "Find and register for upcoming mixer events.",
            actionText: "Browse Events",
            actionHref: "/events",
            order: 1
        },
        {
            track: "GROW",
            weekNumber: 2,
            title: "Search Business Directory",
            description: "Browse local businesses to find partners or clients.",
            actionText: "Search Directory",
            actionHref: "/directory",
            order: 2
        },
        {
            track: "GROW",
            weekNumber: 3,
            title: "Connect with Growth Matches",
            description: "Connect with growth-stage referral matches.",
            actionText: "View Matches",
            actionHref: "/dashboard?tab=matches",
            order: 3
        },
        {
            track: "GROW",
            weekNumber: 4,
            title: "Watch Masterclasses",
            description: "Watch expert webinars and business masterclasses.",
            actionText: "Watch Webinars",
            actionHref: "/webinars",
            order: 4
        },
        // SCALE track
        {
            track: "SCALE",
            weekNumber: 1,
            title: "Share Offers & Awards",
            description: "Submit a discount offer or nominate for awards.",
            actionText: "Nominate for Awards",
            actionHref: "/awards",
            order: 1
        },
        {
            track: "SCALE",
            weekNumber: 2,
            title: "RSVP to Supper Club",
            description: "Join private dinner events with other scaling founders.",
            actionText: "View Supper Club",
            actionHref: "/supper-club",
            order: 2
        },
        {
            track: "SCALE",
            weekNumber: 3,
            title: "Connect with Advisory Matches",
            description: "Connect with scaling mentors and advisors.",
            actionText: "View Matches",
            actionHref: "/dashboard?tab=matches",
            order: 3
        },
        {
            track: "SCALE",
            weekNumber: 4,
            title: "Scale Funding & Capital",
            description: "Explore funding offers and expansion capital options.",
            actionText: "View Funding Offers",
            actionHref: "/offers",
            order: 4
        }
    ];

    for (const step of stepsData) {
        await prisma.roadmapStep.create({
            data: step
        });
    }
    console.log(`✅ Seeded ${stepsData.length} roadmap steps successfully!`);
}

main()
    .then(async () => {
        await pool.end();
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Seeding failed with error:", e);
        await pool.end();
        await prisma.$disconnect();
        process.exit(1);
    });