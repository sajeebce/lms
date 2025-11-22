import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

const prisma = new PrismaClient();

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      id: "tenant_1",
      name: "Demo School",
      slug: "demo-school",
    },
  });

  // Create admin user
  await prisma.user.upsert({
    where: { id: "user_1" },
    update: {},
    create: {
      id: "user_1",
      tenantId: tenant.id,
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
    },
  });

  // Create default theme settings
  await prisma.themeSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      mode: "light",
      themeName: "pink-orange",
      isCustom: false,
      activeFrom: "#ec4899",
      activeTo: "#f97316",
      hoverFrom: "#fdf2f8",
      hoverTo: "#fff7ed",
      borderColor: "#fbcfe8",
      buttonFrom: "#ec4899",
      buttonTo: "#f97316",
    },
  });

  // Create tenant settings with enableCohorts = true
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      enableCohorts: true,
    },
  });

  // Create branches
  const branches = [
    { name: "Vashantek", status: "ACTIVE" as const },
    { name: "Matikata", status: "ACTIVE" as const },
  ];

  const createdBranches = [];
  for (const branch of branches) {
    const created = await prisma.branch.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: branch.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...branch,
      },
    });
    createdBranches.push(created);
  }

  // Create academic years
  const academicYears = [
    {
      name: "2024-25",
      code: "2024-25",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      state: "ACTIVE" as const,
    },
    {
      name: "2025-26",
      code: "2025-26",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      state: "PLANNED" as const,
    },
  ];

  const createdYears = [];
  for (const year of academicYears) {
    const created = await prisma.academicYear.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: year.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...year,
      },
    });
    createdYears.push(created);
  }

  // Create streams
  const streams = [{ name: "Science" }, { name: "Commerce" }, { name: "Arts" }];

  const createdStreams = [];
  for (const stream of streams) {
    const created = await prisma.stream.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: stream.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...stream,
      },
    });
    createdStreams.push(created);
  }

  // Create classes
  const classes = [
    { name: "Nine", order: 1 },
    { name: "Ten", order: 2 },
  ];

  const createdClasses = [];
  for (const cls of classes) {
    const created = await prisma.class.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: cls.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...cls,
      },
    });
    createdClasses.push(created);
  }

  // Create cohorts with new naming format
  const cohortData = [
    {
      name: "nine-science-morning 2024-25 (Vashantek)",
      yearId: createdYears[0].id,
      classId: createdClasses[0].id,
      streamId: createdStreams[0].id,
      branchId: createdBranches[0].id,
      status: "ACTIVE" as const,
      enrollmentOpen: true,
    },
    {
      name: "nine-science-evening 2024-25 (Vashantek)",
      yearId: createdYears[0].id,
      classId: createdClasses[0].id,
      streamId: createdStreams[0].id,
      branchId: createdBranches[0].id,
      status: "ACTIVE" as const,
      enrollmentOpen: true,
    },
    {
      name: "nine-commerce-morning 2024-25 (Matikata)",
      yearId: createdYears[0].id,
      classId: createdClasses[0].id,
      streamId: createdStreams[1].id,
      branchId: createdBranches[1].id,
      status: "ACTIVE" as const,
      enrollmentOpen: true,
    },
  ];

  const createdCohorts = [];
  for (const cohort of cohortData) {
    // Find existing cohort
    const existing = await prisma.cohort.findFirst({
      where: {
        tenantId: tenant.id,
        yearId: cohort.yearId,
        classId: cohort.classId,
        streamId: cohort.streamId || null,
        branchId: cohort.branchId,
        name: cohort.name,
      },
    });

    const created =
      existing ||
      (await prisma.cohort.create({
        data: {
          tenantId: tenant.id,
          ...cohort,
        },
      }));
    createdCohorts.push(created);
  }

  // Create sections for each cohort
  for (const cohort of createdCohorts) {
    const sectionNames = ["Morning A", "Morning B", "Evening A"];
    for (let i = 0; i < sectionNames.length; i++) {
      const sectionName = `${cohort.name} - ${sectionNames[i]}`;

      // Create or find section
      const section = await prisma.section.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: sectionName,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          name: sectionName,
          capacity: 40,
        },
      });

      // Link section to cohort via CohortSection junction table
      await prisma.cohortSection.upsert({
        where: {
          tenantId_cohortId_sectionId: {
            tenantId: tenant.id,
            cohortId: cohort.id,
            sectionId: section.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          cohortId: cohort.id,
          sectionId: section.id,
        },
      });
    }
  }

  // Create sample teachers
  const teachers = [
    {
      name: "Dr. Sarah Ahmed",
      email: "sarah@example.com",
      phone: "01711111111",
    },
    {
      name: "Prof. Karim Rahman",
      email: "karim@example.com",
      phone: "01722222222",
    },
    {
      name: "Ms. Fatima Khan",
      email: "fatima@example.com",
      phone: "01733333333",
    },
    {
      name: "Mr. Rahim Hossain",
      email: "rahim@example.com",
      phone: "01744444444",
    },
  ];

  for (const teacher of teachers) {
    await prisma.teacher.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: teacher.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...teacher,
      },
    });
  }

  // Create sample rooms
  const rooms = [
    { name: "Room 101", capacity: 40, status: "ACTIVE" as const },
    { name: "Room 102", capacity: 40, status: "ACTIVE" as const },
    { name: "Room 201", capacity: 50, status: "ACTIVE" as const },
    { name: "Room 202", capacity: 50, status: "ACTIVE" as const },
    { name: "Lab A", capacity: 30, status: "ACTIVE" as const },
    { name: "Lab B", capacity: 30, status: "ACTIVE" as const },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: room.name } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...room,
      },
    });
  }

  // Create sample courses (Course Management - new schema)
  const courses = [
    {
      title: "Mathematics",
      slug: "mathematics",
      description: "Basic Mathematics",
    },
    { title: "English", slug: "english", description: "English Language" },
    { title: "Physics", slug: "physics", description: "Physics Fundamentals" },
    { title: "Chemistry", slug: "chemistry", description: "Chemistry Basics" },
    { title: "Biology", slug: "biology", description: "Biology Essentials" },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: course.slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        ...course,
      },
    });
  }

  // Create sample students
  const studentData = [
    {
      fullName: "Ahmed Hassan",
      email: "ahmed.hassan@example.com",
      phone: "01911111111",
      dateOfBirth: "2008-05-15",
      gender: "Male",
      address: "Dhaka, Bangladesh",
      fatherName: "Hassan Ali",
      fatherPhone: "01911111110",
    },
    {
      fullName: "Fatima Khan",
      email: "fatima.khan@example.com",
      phone: "01922222222",
      dateOfBirth: "2008-08-20",
      gender: "Female",
      address: "Chittagong, Bangladesh",
      fatherName: "Khan Sahab",
      fatherPhone: "01922222220",
    },
    {
      fullName: "Karim Rahman",
      email: "karim.rahman@example.com",
      phone: "01933333333",
      dateOfBirth: "2008-03-10",
      gender: "Male",
      address: "Sylhet, Bangladesh",
      fatherName: "Rahman Ahmed",
      fatherPhone: "01933333330",
    },
  ];

  for (let i = 0; i < studentData.length; i++) {
    const data = studentData[i];
    const studentUser = await prisma.user.upsert({
      where: { id: `student_user_${i + 1}` },
      update: {},
      create: {
        id: `student_user_${i + 1}`,
        tenantId: tenant.id,
        email: data.email,
        name: data.fullName,
        role: "STUDENT",
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: studentUser.id,
        name: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender.toUpperCase() as "MALE" | "FEMALE" | "OTHER",
        status: "ACTIVE",
      },
    });

    // Enroll student in first cohort's first section
    const firstCohort = createdCohorts[0];
    const sections = await prisma.section.findMany({
      where: {
        cohortSections: {
          some: {
            cohortId: firstCohort.id,
          },
        },
      },
      take: 1,
    });

    if (sections.length > 0) {
      await prisma.studentEnrollment.upsert({
        where: {
          tenantId_studentId_academicYearId: {
            tenantId: tenant.id,
            studentId: student.id,
            academicYearId: firstCohort.yearId,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          studentId: student.id,
          sectionId: sections[0].id,
          academicYearId: firstCohort.yearId,
          classId: firstCohort.classId,
          branchId: firstCohort.branchId,
          status: "ACTIVE",
        },
      });
    }
  }

  console.log("✅ Seed data created successfully");
  console.log("📊 Created:");
  console.log(`  - ${createdBranches.length} branches`);
  console.log(`  - ${createdYears.length} academic years`);
  console.log(`  - ${createdStreams.length} streams`);
  console.log(`  - ${createdClasses.length} classes`);
  console.log(`  - ${createdCohorts.length} cohorts`);
  console.log(`  - ${courses.length} courses`);
  console.log(`  - ${studentData.length} students`);
  console.log(`  - ${teachers.length} teachers`);
  console.log(`  - ${rooms.length} rooms`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
