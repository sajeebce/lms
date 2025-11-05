// Storage Service - Business logic layer for file operations

import { getStorage } from './storage-factory'
import { getTenantId } from '@/lib/auth'

export class StorageService {
  private async getStorageAdapter() {
    return await getStorage()
  }

  /**
   * Generate storage key with tenant isolation
   */
  private async generateKey(
    category: 'students' | 'teachers' | 'courses' | 'assignments' | 'exams' | 'library' | 'notices' | 'reports' | 'questions',
    subPath: string
  ): Promise<string> {
    const tenantId = await getTenantId()
    return `tenants/${tenantId}/${category}/${subPath}`
  }

  /**
   * Upload student photo
   */
  async uploadStudentPhoto(studentId: string, file: File): Promise<string> {
    const storage = await this.getStorageAdapter()
    const key = await this.generateKey('students', `photos/${studentId}/profile.jpg`)
    
    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        studentId,
        uploadedAt: new Date().toISOString(),
      },
      isPublic: true, // Photos can be public
    })

    return result.url
  }

  /**
   * Upload student document
   */
  async uploadStudentDocument(
    studentId: string,
    documentType: 'birth_certificate' | 'transfer_certificate' | 'marksheet' | 'other',
    file: File
  ): Promise<string> {
    const storage = await this.getStorageAdapter()
    const extension = file.name.split('.').pop()
    const key = await this.generateKey('students', `documents/${studentId}/${documentType}.${extension}`)
    
    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        studentId,
        documentType,
        uploadedAt: new Date().toISOString(),
      },
      isPublic: false, // Documents are private
    })

    return result.url
  }

  /**
   * Upload assignment submission
   */
  async uploadAssignmentSubmission(
    assignmentId: string,
    studentId: string,
    file: File,
    version: number = 1
  ): Promise<string> {
    const storage = await this.getStorageAdapter()
    const extension = file.name.split('.').pop()
    const key = await this.generateKey(
      'assignments',
      `${assignmentId}/submissions/${studentId}/submission_v${version}.${extension}`
    )
    
    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        assignmentId,
        studentId,
        version: version.toString(),
        uploadedAt: new Date().toISOString(),
      },
      isPublic: false,
    })

    return result.url
  }

  /**
   * Upload course material
   */
  async uploadCourseMaterial(
    courseId: string,
    materialType: 'notes' | 'syllabus' | 'video' | 'other',
    file: File
  ): Promise<string> {
    const storage = await this.getStorageAdapter()
    const extension = file.name.split('.').pop()
    const timestamp = Date.now()
    const key = await this.generateKey(
      'courses',
      `${courseId}/materials/${materialType}_${timestamp}.${extension}`
    )
    
    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        courseId,
        materialType,
        uploadedAt: new Date().toISOString(),
      },
      isPublic: false,
    })

    return result.url
  }

  /**
   * Delete student files (cascade delete)
   */
  async deleteStudentFiles(studentId: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    const tenantId = await getTenantId()
    
    // List all files for this student
    const photoPrefix = `tenants/${tenantId}/students/photos/${studentId}/`
    const docPrefix = `tenants/${tenantId}/students/documents/${studentId}/`
    
    const [photos, documents] = await Promise.all([
      storage.list(photoPrefix),
      storage.list(docPrefix),
    ])

    const allKeys = [...photos, ...documents].map(obj => obj.key)

    if (allKeys.length > 0) {
      await storage.deleteMany(allKeys)
    }
  }

  /**
   * Delete assignment submissions for a student
   */
  async deleteAssignmentSubmissions(assignmentId: string, studentId: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    const tenantId = await getTenantId()
    const prefix = `tenants/${tenantId}/assignments/${assignmentId}/submissions/${studentId}/`
    
    const files = await storage.list(prefix)
    const keys = files.map(obj => obj.key)

    if (keys.length > 0) {
      await storage.deleteMany(keys)
    }
  }

  /**
   * Delete all files for an assignment
   */
  async deleteAssignmentFiles(assignmentId: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    const tenantId = await getTenantId()
    const prefix = `tenants/${tenantId}/assignments/${assignmentId}/`
    
    const files = await storage.list(prefix)
    const keys = files.map(obj => obj.key)

    if (keys.length > 0) {
      await storage.deleteMany(keys)
    }
  }

  /**
   * Delete all files for a course
   */
  async deleteCourseFiles(courseId: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    const tenantId = await getTenantId()
    const prefix = `tenants/${tenantId}/courses/${courseId}/`
    
    const files = await storage.list(prefix)
    const keys = files.map(obj => obj.key)

    if (keys.length > 0) {
      await storage.deleteMany(keys)
    }
  }

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const storage = await this.getStorageAdapter()
    return await storage.getUrl(key, expiresIn)
  }

  /**
   * Delete file by key
   */
  async deleteFile(key: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    await storage.delete(key)
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const storage = await this.getStorageAdapter()
    return await storage.exists(key)
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix: string): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    const storage = await this.getStorageAdapter()
    return await storage.list(prefix)
  }
}

// Singleton instance
let serviceInstance: StorageService | null = null

  /**
   * Upload question image
   */
  async uploadQuestionImage(questionId: string, file: File): Promise<string> {
    const storage = await this.getStorageAdapter()
    const extension = file.name.split('.').pop()
    const timestamp = Date.now()
    const key = await this.generateKey('questions', `images/${questionId}/${timestamp}.${extension}`)

    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        questionId,
        uploadedAt: new Date().toISOString(),
      },
      isPublic: false, // Question images are private
    })

    return result.url
  }

  /**
   * Delete question files
   */
  async deleteQuestionFiles(questionId: string): Promise<void> {
    const storage = await this.getStorageAdapter()
    const prefix = await this.generateKey('questions', `images/${questionId}/`)
    await storage.deleteByPrefix(prefix)
  }
}

// Singleton instance
let serviceInstance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!serviceInstance) {
    serviceInstance = new StorageService()
  }
  return serviceInstance
}

