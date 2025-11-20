"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  createCourseLesson,
  updateCourseLesson,
  uploadLessonDocument,
  uploadLessonVideo,
} from "@/lib/actions/course-lesson.actions";
import { toast } from "sonner";
import {
  Upload,
  Youtube,
  Video,
  Link2,
  FileText,
  Lock,
  Calendar,
  Paperclip,
  X,
  Plus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  lessonType: z.enum(["TEXT", "VIDEO_YOUTUBE", "DOCUMENT"]),
  videoUrl: z.string().max(500).optional(),
  documentPath: z.string().max(500).optional(),
  textContent: z.string().optional(),
  duration: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 9999),
      "Duration must be between 0 and 9999 minutes"
    ),
  // Lesson-level settings
  accessType: z.enum(["PUBLIC", "PASSWORD", "ENROLLED_ONLY"]),
  password: z.string().max(100).optional(),
  isPreview: z.boolean(),
  allowDownload: z.boolean(),
  scheduledAt: z.string().optional(), // ISO date string
});

type FormValues = z.infer<typeof formSchema>;

interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface LessonFormEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string | null;
  lessonType: "TEXT" | "VIDEO_YOUTUBE" | "DOCUMENT" | "ADVANCED";
  editingLesson?: {
    id: string;
    title: string;
    description: string | null;
    lessonType: string;
    videoUrl: string | null;
    documentPath: string | null;
    textContent: string | null;
    duration: number | null;
    accessType: string;
    password: string | null;
    isPreview: boolean;
    allowDownload: boolean;
    scheduledAt: Date | null;
    attachmentsJson: string | null;
  } | null;
  onCompleted?: () => void;
}

export function LessonFormEnhanced({
  open,
  onOpenChange,
  topicId,
  lessonType,
  editingLesson,
  onCompleted,
}: LessonFormEnhancedProps) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [videoSource, setVideoSource] = useState<
    "youtube" | "vimeo" | "url" | "upload"
  >("youtube");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const isEditing = !!editingLesson;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      lessonType: lessonType,
      videoUrl: "",
      documentPath: "",
      textContent: "",
      duration: "",
      accessType: "ENROLLED_ONLY",
      password: "",
      isPreview: false,
      allowDownload: true,
      scheduledAt: "",
    },
  });

  // Reset form when dialog opens/closes or editing lesson changes
  useEffect(() => {
    if (open && editingLesson) {
      form.reset({
        title: editingLesson.title,
        description: editingLesson.description || "",
        lessonType: editingLesson.lessonType as any,
        videoUrl: editingLesson.videoUrl || "",
        documentPath: editingLesson.documentPath || "",
        textContent: editingLesson.textContent || "",
        duration: editingLesson.duration?.toString() || "",
        accessType: (editingLesson.accessType as any) || "ENROLLED_ONLY",
        password: editingLesson.password || "",
        isPreview: editingLesson.isPreview || false,
        allowDownload: editingLesson.allowDownload ?? true,
        scheduledAt: editingLesson.scheduledAt
          ? new Date(editingLesson.scheduledAt).toISOString().slice(0, 16)
          : "",
      });
      if (editingLesson.documentPath) {
        const fileName = editingLesson.documentPath.split("/").pop() || "";
        setUploadedFileName(fileName);
      }
      if (editingLesson.attachmentsJson) {
        try {
          const parsed = JSON.parse(editingLesson.attachmentsJson);
          setAttachments(Array.isArray(parsed) ? parsed : []);
        } catch {
          setAttachments([]);
        }
      }
    } else if (open && !editingLesson) {
      form.reset({
        title: "",
        description: "",
        lessonType: lessonType,
        videoUrl: "",
        documentPath: "",
        textContent: "",
        duration: "",
        accessType: "ENROLLED_ONLY",
        password: "",
        isPreview: false,
        allowDownload: true,
        scheduledAt: "",
      });
      setUploadedFileName("");
      setAttachments([]);
    }
  }, [open, editingLesson, lessonType, form]);

  const handleSubmit = (values: FormValues) => {
    if (!topicId && !isEditing) return;

    const numericDuration = values.duration
      ? Number(values.duration)
      : undefined;

    const scheduledDate = values.scheduledAt
      ? new Date(values.scheduledAt)
      : undefined;

    const attachmentsJson =
      attachments.length > 0 ? JSON.stringify(attachments) : undefined;

    startTransition(async () => {
      const result = isEditing
        ? await updateCourseLesson(editingLesson.id, {
            ...values,
            duration: numericDuration,
            scheduledAt: scheduledDate,
            attachmentsJson,
          })
        : await createCourseLesson(topicId!, {
            ...values,
            duration: numericDuration,
            scheduledAt: scheduledDate,
            attachmentsJson,
          });

      if (result.success) {
        toast.success(
          isEditing
            ? "Lesson updated successfully"
            : "Lesson created successfully"
        );
        form.reset();
        onOpenChange(false);
        onCompleted?.();
      } else {
        toast.error(
          result.error || `Failed to ${isEditing ? "update" : "create"} lesson`
        );
      }
    });
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const lessonId = editingLesson?.id || `temp_${Date.now()}`;
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadLessonDocument(lessonId, formData);

      if (result.success) {
        form.setValue("documentPath", result.data.url);
        setUploadedFileName(result.data.fileName);

        // Auto-fill title from filename if empty
        if (!form.getValues("title")) {
          const titleFromFile = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
          form.setValue("title", titleFromFile);
        }

        toast.success("Document uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const lessonId = editingLesson?.id || `temp_${Date.now()}`;
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadLessonVideo(lessonId, formData);

      if (result.success) {
        form.setValue("videoUrl", result.data.url);
        setUploadedFileName(result.data.fileName);

        toast.success("Video uploaded successfully");
      } else {
        toast.error(result.error || "Failed to upload video");
      }
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName || !newAttachmentUrl) {
      toast.error("Please enter both name and URL");
      return;
    }

    const newAttachment: Attachment = {
      name: newAttachmentName,
      url: newAttachmentUrl,
      type: "link",
    };

    setAttachments([...attachments, newAttachment]);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
    toast.success("Attachment added");
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    toast.success("Attachment removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {isEditing ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Common Fields */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter lesson title"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Max 100 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional helper text for students"
                      maxLength={500}
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Max 500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type-Specific Content */}
            <div className="border-t pt-6">
              {/* TEXT LESSON */}
              {lessonType === "TEXT" && (
                <FormField
                  control={form.control}
                  name="textContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lesson Content *</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Write your lesson content here... Use the toolbar to format text, add images, equations, etc."
                          minHeight="300px"
                        />
                      </FormControl>
                      <FormDescription>
                        💡 Use the toolbar to add formatting, images, math
                        equations, and more
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* DOCUMENT LESSON */}
              {lessonType === "DOCUMENT" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="documentPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload Document *</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={uploading}
                                onClick={() =>
                                  document.getElementById("doc-upload")?.click()
                                }
                                className="w-full sm:w-auto"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading
                                  ? "Uploading..."
                                  : uploadedFileName || "Choose File"}
                              </Button>
                              <input
                                id="doc-upload"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={handleDocumentUpload}
                                className="hidden"
                              />
                            </div>
                            {uploadedFileName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span className="truncate">
                                  {uploadedFileName}
                                </span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Accepted formats: PDF, DOC, DOCX, PPT, PPTX (Max 10MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* VIDEO LESSON */}
              {lessonType === "VIDEO_YOUTUBE" && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Video Source *</Label>
                    <RadioGroup
                      value={videoSource}
                      onValueChange={(value: any) => setVideoSource(value)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div>
                        <RadioGroupItem
                          value="youtube"
                          id="youtube"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="youtube"
                          className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                        >
                          <Youtube className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium">YouTube</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="vimeo"
                          id="vimeo"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="vimeo"
                          className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                        >
                          <Video className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Vimeo</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="url"
                          id="url"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="url"
                          className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                        >
                          <Link2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">URL</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="upload"
                          id="upload"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="upload"
                          className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 dark:peer-data-[state=checked]:bg-violet-950/30 cursor-pointer transition-all"
                        >
                          <Upload className="h-5 w-5 text-violet-600" />
                          <span className="text-sm font-medium">Upload</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {videoSource !== "upload" && (
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {videoSource === "youtube" && "YouTube URL"}
                            {videoSource === "vimeo" && "Vimeo URL"}
                            {videoSource === "url" && "Video URL"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                videoSource === "youtube"
                                  ? "https://www.youtube.com/watch?v=..."
                                  : videoSource === "vimeo"
                                  ? "https://vimeo.com/..."
                                  : "https://example.com/video.mp4"
                              }
                              maxLength={500}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {videoSource === "upload" && (
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upload Video</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={uploading}
                                  onClick={() =>
                                    document
                                      .getElementById("video-upload")
                                      ?.click()
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploading
                                    ? "Uploading..."
                                    : uploadedFileName || "Choose Video"}
                                </Button>
                                <input
                                  id="video-upload"
                                  type="file"
                                  accept="video/mp4,video/webm,video/ogg"
                                  onChange={handleVideoUpload}
                                  className="hidden"
                                />
                              </div>
                              {uploadedFileName && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Video className="h-4 w-4" />
                                  <span className="truncate">
                                    {uploadedFileName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Accepted formats: MP4, WebM, OGG (Max 100MB)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 15"
                            min="0"
                            max="9999"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional - helps students plan their time
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Lesson-Level Settings & Protection */}
            <Separator className="my-6" />
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-semibold">
                  Lesson Settings & Protection
                </h3>
              </div>

              {/* Access Control */}
              <FormField
                control={form.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Control *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          🌐 Public - Anyone can view
                        </SelectItem>
                        <SelectItem value="PASSWORD">
                          🔒 Password Protected
                        </SelectItem>
                        <SelectItem value="ENROLLED_ONLY">
                          🎓 Enrolled Students Only
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Control who can access this lesson
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field (conditional) */}
              {form.watch("accessType") === "PASSWORD" && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter password"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Students will need this password to access the lesson
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Scheduled Release */}
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Scheduled Release Date/Time
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional - Lesson will be hidden until this date/time
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Allow Download */}
                <FormField
                  control={form.control}
                  name="allowDownload"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Download
                        </FormLabel>
                        <FormDescription>
                          Enable download button for documents/videos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Mark as Preview */}
                <FormField
                  control={form.control}
                  name="isPreview"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Mark as Preview
                        </FormLabel>
                        <FormDescription>
                          Free to view without enrollment
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {attachment.url}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Attachment Form */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Attachment name"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    maxLength={500}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAttachment}
                    className="sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add supplementary files, links, or resources for students
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={isPending || uploading}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
              >
                {isPending || uploading
                  ? "Saving..."
                  : isEditing
                  ? "Update Lesson"
                  : "Create Lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
