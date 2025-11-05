/**
 * Master Seed Script
 * 
 * Seeds all academic data in the correct order:
 * 1. Subjects
 * 2. Chapters
 * 3. Topics
 * 
 * Usage:
 *   npx tsx scripts/seed-all.ts
 * 
 * Safe to run multiple times - skips duplicates
 */

import { execSync } from 'child_process'

console.log('🌱 Starting Master Seed Process...\n')

try {
  // Step 1: Seed Subjects
  console.log('📚 Step 1/3: Seeding Subjects...')
  execSync('npx tsx scripts/seed-subjects.ts', { stdio: 'inherit' })
  console.log('')

  // Step 2: Seed Chapters
  console.log('📖 Step 2/3: Seeding Chapters...')
  execSync('npx tsx scripts/seed-chapters.ts', { stdio: 'inherit' })
  console.log('')

  // Step 3: Seed Topics
  console.log('📝 Step 3/3: Seeding Topics...')
  execSync('npx tsx scripts/seed-topics.ts', { stdio: 'inherit' })
  console.log('')

  console.log('✅ Master Seed Process Complete!\n')
  console.log('🔍 Run verification scripts to confirm:')
  console.log('   npx tsx scripts/verify-subject-setup.ts')
  console.log('   npx tsx scripts/verify-chapter-setup.ts')
  console.log('   npx tsx scripts/verify-topic-setup.ts')
} catch (error) {
  console.error('❌ Master Seed Process Failed:', error)
  process.exit(1)
}

