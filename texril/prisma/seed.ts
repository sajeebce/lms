import { PrismaClient, UserRole, PlatformCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const defaultPlans = [
  {
    code: "starter",
    name: "Starter",
    description: "For solo creators and MVP embeds",
    limits: {
      domains: 1,
      embeds: 2000,
      storageMB: 512,
      features: {
        math: true,
        audio: true,
        aiAssist: false,
      },
    },
    priceMonthly: 2900,
    priceYearly: 29000,
  },
  {
    code: "pro",
    name: "Pro",
    description: "Growing teams who need multiple domains",
    limits: {
      domains: 5,
      embeds: 10000,
      storageMB: 2048,
      features: {
        math: true,
        audio: true,
        aiAssist: true,
      },
    },
    priceMonthly: 9900,
    priceYearly: 99000,
  },
  {
    code: "agency",
    name: "Agency",
    description: "Agencies or LMS vendors with many clients",
    limits: {
      domains: 20,
      embeds: 50000,
      storageMB: 8192,
      features: {
        math: true,
        audio: true,
        aiAssist: true,
        whiteLabel: true,
      },
    },
    priceMonthly: 24900,
    priceYearly: 249000,
  },
];

const defaultPlatforms = [
  { code: "wordpress", name: "WordPress", category: PlatformCategory.CMS },
  { code: "learndash", name: "LearnDash", category: PlatformCategory.LMS },
  { code: "tutorlms", name: "Tutor LMS", category: PlatformCategory.LMS },
  { code: "moodle", name: "Moodle", category: PlatformCategory.LMS },
  { code: "talentlms", name: "TalentLMS", category: PlatformCategory.LMS },
  { code: "thinkific", name: "Thinkific", category: PlatformCategory.APP_STORE },
  { code: "kajabi", name: "Kajabi", category: PlatformCategory.APP_STORE },
  { code: "teachable", name: "Teachable", category: PlatformCategory.APP_STORE },
  { code: "canvas", name: "Canvas LMS", category: PlatformCategory.LMS },
  { code: "openedx", name: "Open edX", category: PlatformCategory.LMS },
  { code: "blackboard", name: "Blackboard", category: PlatformCategory.LMS },
  { code: "salesforce", name: "Salesforce", category: PlatformCategory.CRM },
];

async function seedPlans() {
  for (const plan of defaultPlans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        limits: plan.limits,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        isActive: true,
      },
      create: plan,
    });
  }
}

async function seedPlatforms() {
  for (const platform of defaultPlatforms) {
    await prisma.platform.upsert({
      where: { code: platform.code },
      update: {
        name: platform.name,
        category: platform.category,
        isActive: true,
      },
      create: platform,
    });
  }
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@texril.local";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      name: "Super Admin",
    },
  });
}

async function main() {
  await seedPlans();
  await seedPlatforms();
  await seedSuperAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
