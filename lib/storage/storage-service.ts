// Storage Service - Business logic layer for file operations

import { getStorage } from "./storage-factory";
import { getTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class StorageService {
  private async getStorageAdapter() {
    return await getStorage();
  }

  /**
   * Generate storage key with tenant isolation
   */
  private async generateKey(
    category:
      | "students"
      | "teachers"
      | "courses"
      | "assignments"
      | "exams"
      | "library"
      | "notices"
      | "reports"
      | "questions",
    subPath: string
  ): Promise<string> {
    const tenantId = await getTenantId();
    return `tenants/${tenantId}/${category}/${subPath}`;
  }

  /**
   * Upload student photo (auto-replaces old photo)
   */
  async uploadStudentPhoto(studentId: string, file: File): Promise<string> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();
    const key = await this.generateKey(
      "students",
      `photos/${studentId}/profile.jpg`
    );

    // ✅ Delete old file if exists
    if (await storage.exists(key)) {
      await storage.delete(key);
    }

    // ✅ Upload new file
    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        studentId,
        uploadedAt: new Date().toISOString(),
      },
      isPublic: true, // Photos can be public
    });

    // ✅ Track in database (upsert for fixed-name files)
    await prisma.uploadedFile.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
      create: {
        tenantId,
        key,
        url: result.url,
        fileName: file.name,
        fileSize: result.size,
        mimeType: file.type,
        category: "student_photo",
        entityType: "student",
        entityId: studentId,
        isPublic: true,
      },
      update: {
        url: result.url,
        fileName: file.name,
        fileSize: result.size,
        mimeType: file.type,
        uploadedAt: new Date(),
      },
    });

    return result.url;
  }

  /**
   * Upload student document
   */
  async uploadStudentDocument(
    studentId: string,
    documentType:
      | "birth_certificate"
      | "transfer_certificate"
      | "marksheet"
      | "other",
    file: File
  ): Promise<string> {
    const storage = await this.getStorageAdapter();
    const extension = file.name.split(".").pop();
    const key = await this.generateKey(
      "students",
      `documents/${studentId}/${documentType}.${extension}`
    );

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
    });

    return result.url;
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
    const storage = await this.getStorageAdapter();
    const extension = file.name.split(".").pop();
    const key = await this.generateKey(
      "assignments",
      `${assignmentId}/submissions/${studentId}/submission_v${version}.${extension}`
    );

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
    });

    return result.url;
  }

  /**
   * Upload course material
   */
  async uploadCourseMaterial(
    courseId: string,
    materialType: "notes" | "syllabus" | "video" | "other",
    file: File
  ): Promise<string> {
    const storage = await this.getStorageAdapter();
    const extension = file.name.split(".").pop();
    const timestamp = Date.now();
    const key = await this.generateKey(
      "courses",
      `${courseId}/materials/${materialType}_${timestamp}.${extension}`
    );

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
    });

    return result.url;
  }

  /**
   * Upload course featured image (with database tracking)
   */
  async uploadCourseFeaturedImage(
    courseId: string,
    file: File,
    options?: {
      author?: string;
      description?: string;
      altText?: string;
      width?: number;
      height?: number;
    }
  ): Promise<{ url: string; id: string }> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();

    const extension = file.name.split(".").pop();
    const timestamp = Date.now();
    const key = await this.generateKey(
      "courses",
      `${courseId}/featured/${timestamp}.${extension}`
    );

    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        courseId,
        role: "featured_image",
        uploadedAt: new Date().toISOString(),
      },
      isPublic: true, // Featured images are public
    });

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        tenantId,
        key,
        url: result.url,
        fileName: file.name,
        fileSize: result.size,
        mimeType: file.type,
        category: "course_featured_image",
        entityType: "course",
        entityId: courseId,
        isPublic: true,
        author: options?.author,
        description: options?.description,
        altText: options?.altText,
        width: options?.width,
        height: options?.height,
      },
    });

    return { url: result.url, id: uploadedFile.id };
  }

  /**
   * Upload course intro video (with database tracking)
   */
  async uploadCourseIntroVideo(
    courseId: string,
    file: File,
    options?: {
      author?: string;
      description?: string;
      duration?: number;
    }
  ): Promise<{ url: string; id: string }> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();

    const extension = file.name.split(".").pop();
    const timestamp = Date.now();
    const key = await this.generateKey(
      "courses",
      `${courseId}/intro-video/${timestamp}.${extension}`
    );

    const result = await storage.upload({
      key,
      file,
      contentType: file.type,
      metadata: {
        courseId,
        role: "intro_video",
        duration: options?.duration?.toString() || "0",
        uploadedAt: new Date().toISOString(),
      },
      isPublic: true, // Intro videos are public marketing assets
    });

    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        tenantId,
        key,
        url: result.url,
        fileName: file.name,
        fileSize: result.size,
        mimeType: file.type,
        category: "course_intro_video",
        entityType: "course",
        entityId: courseId,
        isPublic: true,
        author: options?.author,
        description: options?.description,
      },
    });

    return { url: result.url, id: uploadedFile.id };
  }

  /**
   * Delete student files (cascade delete)
   */
  async deleteStudentFiles(studentId: string): Promise<void> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();

    // List all files for this student
    const photoPrefix = `tenants/${tenantId}/students/photos/${studentId}/`;
    const docPrefix = `tenants/${tenantId}/students/documents/${studentId}/`;

    const [photos, documents] = await Promise.all([
      storage.list(photoPrefix),
      storage.list(docPrefix),
    ]);

    const allKeys = [...photos, ...documents].map((obj) => obj.key);

    if (allKeys.length > 0) {
      await storage.deleteMany(allKeys);
    }
  }

  /**
   * Delete assignment submissions for a student
   */
  async deleteAssignmentSubmissions(
    assignmentId: string,
    studentId: string
  ): Promise<void> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();
    const prefix = `tenants/${tenantId}/assignments/${assignmentId}/submissions/${studentId}/`;

    const files = await storage.list(prefix);
    const keys = files.map((obj) => obj.key);

    if (keys.length > 0) {
      await storage.deleteMany(keys);
    }
  }

  /**
   * Delete all files for an assignment
   */
  async deleteAssignmentFiles(assignmentId: string): Promise<void> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();
    const prefix = `tenants/${tenantId}/assignments/${assignmentId}/`;

    const files = await storage.list(prefix);
    const keys = files.map((obj) => obj.key);

    if (keys.length > 0) {
      await storage.deleteMany(keys);
    }
  }

  /**
   * Delete all files for a course
   */
  async deleteCourseFiles(courseId: string): Promise<void> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();
    const prefix = `tenants/${tenantId}/courses/${courseId}/`;

    const files = await storage.list(prefix);
    const keys = files.map((obj) => obj.key);

    if (keys.length > 0) {
      await storage.deleteMany(keys);
    }
  }

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const storage = await this.getStorageAdapter();
    return await storage.getUrl(key, expiresIn);
  }

  /**
   * Delete file by key
   */
  async deleteFile(key: string): Promise<void> {
    const storage = await this.getStorageAdapter();
    await storage.delete(key);
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const storage = await this.getStorageAdapter();
    return await storage.exists(key);
  }

  /**
   * List files in a directory
   */
  async listFiles(
    prefix: string
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    const storage = await this.getStorageAdapter();
    return await storage.list(prefix);
  }

  /**
   * Upload question image (with database tracking)
   */
  async uploadQuestionImage(
    questionId: string,
    file: File,
    options?: {
      author?: string;
      description?: string;
      altText?: string;
      width?: number;
      height?: number;
    }
  ): Promise<{ url: string; id: string }> {
    try {
      console.log("[StorageService] uploadQuestionImage called:", {
        questionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        options,
      });

      const storage = await this.getStorageAdapter();
      const tenantId = await getTenantId();
      console.log("[StorageService] TenantId:", tenantId);

      const extension = file.name.split(".").pop();
      const timestamp = Date.now();
      const key = await this.generateKey(
        "questions",
        `images/${questionId}/${timestamp}.${extension}`
      );
      console.log("[StorageService] Generated key:", key);

      // ✅ Upload file
      console.log("[StorageService] Starting file upload...");
      const result = await storage.upload({
        key,
        file,
        contentType: file.type,
        metadata: {
          questionId,
          uploadedAt: new Date().toISOString(),
        },
        isPublic: false, // Question images are private
      });
      console.log("[StorageService] File uploaded successfully:", result);

      // ✅ Save to database with metadata
      console.log("[StorageService] Saving to database...");
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          tenantId,
          key,
          url: result.url,
          fileName: file.name,
          fileSize: result.size,
          mimeType: file.type,
          category: "question_image",
          entityType: "question",
          entityId: questionId,
          isPublic: false,
          author: options?.author,
          description: options?.description,
          altText: options?.altText,
          width: options?.width,
          height: options?.height,
        },
      });
      console.log("[StorageService] Database record created:", uploadedFile.id);

      return { url: result.url, id: uploadedFile.id };
    } catch (error) {
      console.error("[StorageService] uploadQuestionImage failed:", error);
      throw error;
    }
  }

  /**
   * Upload question audio (with database tracking)
   */
  async uploadQuestionAudio(
    questionId: string,
    file: File,
    options?: {
      author?: string;
      description?: string;
      duration?: number;
    }
  ): Promise<{ url: string; id: string }> {
    try {
      console.log("[StorageService] uploadQuestionAudio called:", {
        questionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        options,
      });

      const storage = await this.getStorageAdapter();
      const tenantId = await getTenantId();
      console.log("[StorageService] TenantId:", tenantId);

      const extension = file.name.split(".").pop();
      const timestamp = Date.now();
      const key = await this.generateKey(
        "questions",
        `audio/${questionId}/${timestamp}.${extension}`
      );
      console.log("[StorageService] Generated key:", key);

      // ✅ Upload file
      console.log("[StorageService] Starting audio upload...");
      const result = await storage.upload({
        key,
        file,
        contentType: file.type,
        metadata: {
          questionId,
          duration: options?.duration?.toString() || "0",
          uploadedAt: new Date().toISOString(),
        },
        isPublic: false, // Question audio is private
      });
      console.log("[StorageService] Audio uploaded successfully:", result);

      // ✅ Save to database with metadata
      console.log("[StorageService] Saving to database...");
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          tenantId,
          key,
          url: result.url,
          fileName: file.name,
          fileSize: result.size,
          mimeType: file.type,
          category: "question_audio",
          entityType: "question",
          entityId: questionId,
          isPublic: false,
          author: options?.author,
          description: options?.description,
        },
      });
      console.log("[StorageService] Database record created:", uploadedFile.id);

      return { url: result.url, id: uploadedFile.id };
    } catch (error) {
      console.error("[StorageService] uploadQuestionAudio failed:", error);
      throw error;
    }
  }

  /**
   * Delete question files (with database cleanup)
   */
  async deleteQuestionFiles(questionId: string): Promise<void> {
    const storage = await this.getStorageAdapter();
    const tenantId = await getTenantId();

    // ✅ Get all files for this question from database
    const files = await prisma.uploadedFile.findMany({
      where: {
        tenantId,
        entityType: "question",
        entityId: questionId,
      },
    });

    // ✅ Delete from storage
    await Promise.all(files.map((f) => storage.delete(f.key)));

    // ✅ Delete from database
    await prisma.uploadedFile.deleteMany({
      where: {
        tenantId,
        entityType: "question",
        entityId: questionId,
      },
    });
  }

  /**
   * List uploaded files by category and entity
   */
  async listUploadedFiles(
    category?: string,
    entityType?: string,
    entityId?: string
  ): Promise<
    Array<{
      id: string;
      key: string;
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      category: string;
      entityType: string;
      entityId: string;
      isPublic: boolean;
      uploadedAt: Date;
      // Metadata fields
      author?: string | null;
      description?: string | null;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    }>
  > {
    const tenantId = await getTenantId();

    return await prisma.uploadedFile.findMany({
      where: {
        tenantId,
        ...(category && { category }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });
  }

  /**
   * Delete uploaded file by ID
   */
  async deleteUploadedFile(fileId: string): Promise<void> {
    const tenantId = await getTenantId();

    // Get file record
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        tenantId,
      },
    });

    if (!file) {
      throw new Error("File not found");
    }

    // Delete from storage
    const storage = await this.getStorageAdapter();
    await storage.delete(file.key);

    // Delete from database
    await prisma.uploadedFile.delete({
      where: {
        id: fileId,
      },
    });
  }
}

// Singleton instance
let serviceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!serviceInstance) {
    serviceInstance = new StorageService();
  }
  return serviceInstance;
}
