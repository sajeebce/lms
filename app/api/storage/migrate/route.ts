import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { StorageMigrationService, estimateMigration, isR2Configured } from '@/lib/storage/migration-service'

/**
 * GET /api/storage/migrate
 * Get migration estimate
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') as 'local-to-r2' | 'r2-to-local'

    if (!direction || !['local-to-r2', 'r2-to-local'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "local-to-r2" or "r2-to-local"' },
        { status: 400 }
      )
    }

    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured. Please add R2 credentials to .env file.' },
        { status: 400 }
      )
    }

    const estimate = await estimateMigration(direction)

    return NextResponse.json({
      success: true,
      estimate,
      r2Configured: isR2Configured(),
    })
  } catch (error) {
    console.error('Migration estimate error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate migration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/storage/migrate
 * Start migration process
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')

    const body = await request.json()
    const { direction, deleteSource } = body

    if (!direction || !['local-to-r2', 'r2-to-local'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be "local-to-r2" or "r2-to-local"' },
        { status: 400 }
      )
    }

    // Check if R2 is configured
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured. Please add R2 credentials to .env file.' },
        { status: 400 }
      )
    }

    // Create migration service
    const migrationService = new StorageMigrationService({
      direction,
      deleteSource: deleteSource || false,
    })

    // Start migration (this will run in background)
    const result = await migrationService.migrate()

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to migrate files' },
      { status: 500 }
    )
  }
}

