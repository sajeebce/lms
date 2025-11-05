import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  console.log('🔍 Verifying Subject Management Setup...\n')

  const tenantId = 'tenant_1'
  let passed = 0
  let failed = 0

  // Test 1: Check if subjects exist
  console.log('Test 1: Check if subjects exist in database')
  const subjects = await prisma.subject.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { courses: true, chapters: true },
      },
    },
  })

  if (subjects.length > 0) {
    console.log(`✅ PASS: Found ${subjects.length} subjects`)
    passed++
  } else {
    console.log('❌ FAIL: No subjects found')
    failed++
  }

  // Test 2: Check subject fields
  console.log('\nTest 2: Check subject fields')
  const mathSubject = subjects.find((s) => s.name === 'Mathematics')
  if (mathSubject) {
    const hasAllFields =
      mathSubject.id &&
      mathSubject.tenantId &&
      mathSubject.name &&
      mathSubject.status &&
      mathSubject.createdAt &&
      mathSubject.updatedAt

    if (hasAllFields) {
      console.log('✅ PASS: Subject has all required fields')
      console.log(`   - ID: ${mathSubject.id}`)
      console.log(`   - Name: ${mathSubject.name}`)
      console.log(`   - Code: ${mathSubject.code}`)
      console.log(`   - Icon: ${mathSubject.icon}`)
      console.log(`   - Status: ${mathSubject.status}`)
      console.log(`   - Courses: ${mathSubject._count.courses}`)
      console.log(`   - Chapters: ${mathSubject._count.chapters}`)
      passed++
    } else {
      console.log('❌ FAIL: Subject missing required fields')
      failed++
    }
  } else {
    console.log('❌ FAIL: Mathematics subject not found')
    failed++
  }

  // Test 3: Check unique constraint (tenantId + name)
  console.log('\nTest 3: Check unique constraint (tenantId + name)')
  try {
    await prisma.subject.create({
      data: {
        tenantId,
        name: 'Mathematics', // Duplicate
        status: 'ACTIVE',
      },
    })
    console.log('❌ FAIL: Duplicate name allowed (should have failed)')
    failed++
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ PASS: Duplicate name prevented by unique constraint')
      passed++
    } else {
      console.log('❌ FAIL: Unexpected error:', error.message)
      failed++
    }
  }

  // Test 4: Check status enum
  console.log('\nTest 4: Check status enum')
  const activeSubjects = subjects.filter((s) => s.status === 'ACTIVE')
  if (activeSubjects.length === subjects.length) {
    console.log(`✅ PASS: All ${subjects.length} subjects have ACTIVE status`)
    passed++
  } else {
    console.log('❌ FAIL: Some subjects have invalid status')
    failed++
  }

  // Test 5: Check order field
  console.log('\nTest 5: Check order field')
  const orderedSubjects = subjects.sort((a, b) => a.order - b.order)
  const firstSubject = orderedSubjects[0]
  if (firstSubject && firstSubject.order >= 0) {
    console.log(`✅ PASS: Subjects have valid order (first: ${firstSubject.order})`)
    passed++
  } else {
    console.log('❌ FAIL: Invalid order values')
    failed++
  }

  // Test 6: Check tenant isolation
  console.log('\nTest 6: Check tenant isolation')
  const otherTenantSubjects = await prisma.subject.findMany({
    where: { tenantId: 'tenant_2' },
  })
  if (otherTenantSubjects.length === 0) {
    console.log('✅ PASS: Tenant isolation working (no subjects for tenant_2)')
    passed++
  } else {
    console.log('❌ FAIL: Tenant isolation broken')
    failed++
  }

  // Test 7: Check relations
  console.log('\nTest 7: Check relations')
  const subjectWithRelations = await prisma.subject.findFirst({
    where: { tenantId },
    include: {
      tenant: true,
      courses: true,
      chapters: true,
    },
  })

  if (subjectWithRelations) {
    const hasRelations =
      subjectWithRelations.tenant &&
      Array.isArray(subjectWithRelations.courses) &&
      Array.isArray(subjectWithRelations.chapters)

    if (hasRelations) {
      console.log('✅ PASS: Subject relations working')
      console.log(`   - Tenant: ${subjectWithRelations.tenant.name}`)
      console.log(`   - Courses: ${subjectWithRelations.courses.length}`)
      console.log(`   - Chapters: ${subjectWithRelations.chapters.length}`)
      passed++
    } else {
      console.log('❌ FAIL: Subject relations not working')
      failed++
    }
  } else {
    console.log('❌ FAIL: Could not load subject with relations')
    failed++
  }

  // Test 8: Check Course model has new fields
  console.log('\nTest 8: Check Course model has academic fields')
  const courseFields = await prisma.$queryRaw`
    SELECT * FROM pragma_table_info('courses') 
    WHERE name IN ('classId', 'subjectId', 'streamId')
  `

  if (Array.isArray(courseFields) && courseFields.length === 3) {
    console.log('✅ PASS: Course model has classId, subjectId, streamId fields')
    passed++
  } else {
    console.log('❌ FAIL: Course model missing academic fields')
    failed++
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('='.repeat(50))

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Subject Management is ready.')
    console.log('\n📝 Next steps:')
    console.log('   1. Test manually in browser: http://localhost:3000/academic-setup/subjects')
    console.log('   2. Follow checklist in scripts/test-subject-management.md')
    console.log('   3. Proceed to Week 2: Course Academic Integration')
  } else {
    console.log('\n⚠️  Some tests failed. Please fix issues before proceeding.')
    process.exit(1)
  }
}

verify()
  .catch((e) => {
    console.error('❌ Error during verification:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

