"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import BasicInfoTab from "../../create/single/tabs/basic-info-tab";
import PricingTab from "../../create/single/tabs/pricing-tab";
import MediaTab from "../../create/single/tabs/media-tab";
import SeoTab from "../../create/single/tabs/seo-tab";
import SettingsTab from "../../create/single/tabs/settings-tab";
import FaqTab from "../../create/single/tabs/faq-tab";
import { updateCourse } from "./actions";
import type { CourseFormData } from "../../create/single/single-course-form";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
};

type Subject = {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
};

type Class = {
  id: string;
  name: string;
  alias: string | null;
  order: number;
};

type Stream = {
  id: string;
  name: string;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  categoryId: string | null;
  description: string | null;
  shortDescription: string | null;
  classId: string | null;
  subjectId: string | null;
  streamId: string | null;
  paymentType: string;
  invoiceTitle: string | null;
  regularPrice: number | null;
  offerPrice: number | null;
  currency: string;
  subscriptionDuration: number | null;
  subscriptionType: string | null;
  autoGenerateInvoice: boolean;
  featuredImage: string | null;
  introVideoUrl: string | null;
  introVideoAutoplay: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  fakeEnrollmentCount: number | null;
  status: string;
  visibility: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  showComingSoon: boolean;
  comingSoonImage: string | null;
  allowCurriculumPreview: boolean;
  isFeatured: boolean;
  allowComments: boolean;
  certificateEnabled: boolean;
  maxStudents: number | null;
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  enrollmentStatus: string;
  defaultEnrollmentDurationDays: number | null;
  faqs: FAQ[];
};

type Props = {
  course: Course;
  categories: Category[];
  subjects: Subject[];
  classes: Class[];
  streams: Stream[];
};

export default function EditCourseForm({
  course,
  categories,
  subjects,
  classes,
  streams,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);

  const scheduledLocal = course.scheduledAt
    ? new Date(course.scheduledAt)
    : null;
  const scheduledDate = scheduledLocal
    ? `${scheduledLocal.getFullYear()}-${String(
        scheduledLocal.getMonth() + 1
      ).padStart(2, "0")}-${String(scheduledLocal.getDate()).padStart(2, "0")}`
    : undefined;
  const scheduledTime = scheduledLocal
    ? `${String(scheduledLocal.getHours()).padStart(2, "0")}:${String(
        scheduledLocal.getMinutes()
      ).padStart(2, "0")}`
    : undefined;

  const [formData, setFormData] = useState<CourseFormData>({
    title: course.title,
    slug: course.slug,
    categoryId: course.categoryId || undefined,
    description: course.description || undefined,
    shortDescription: course.shortDescription || undefined,
    classId: course.classId || undefined,
    subjectId: course.subjectId || undefined,
    streamId: course.streamId || undefined,
    paymentType: course.paymentType as "FREE" | "ONE_TIME" | "SUBSCRIPTION",
    invoiceTitle: course.invoiceTitle || undefined,
    regularPrice: course.regularPrice || undefined,
    offerPrice: course.offerPrice || undefined,
    currency: course.currency,
    subscriptionDuration: course.subscriptionDuration || undefined,
    subscriptionType: course.subscriptionType as
      | "MONTHLY"
      | "QUARTERLY"
      | "YEARLY"
      | "CUSTOM",
    autoGenerateInvoice: course.autoGenerateInvoice,
    featuredImage: course.featuredImage || undefined,
    introVideoUrl: course.introVideoUrl || undefined,
    introVideoAutoplay: course.introVideoAutoplay ?? false,
    metaTitle: course.metaTitle || undefined,
    metaDescription: course.metaDescription || undefined,
    metaKeywords: course.metaKeywords || undefined,
    fakeEnrollmentCount: course.fakeEnrollmentCount ?? undefined,
    status: course.status as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "PRIVATE",
    visibility: (course.visibility || "PUBLIC") as
      | "PUBLIC"
      | "UNLISTED"
      | "PRIVATE"
      | "INTERNAL_ONLY",
    publishedAt: course.publishedAt || undefined,
    scheduledAt: course.scheduledAt || undefined,
    scheduledDate,
    scheduledTime,
    showComingSoon: course.showComingSoon ?? false,
    comingSoonImage: course.comingSoonImage || undefined,
    allowCurriculumPreview: course.allowCurriculumPreview ?? false,
    isFeatured: course.isFeatured,
    allowComments: course.allowComments,
    certificateEnabled: course.certificateEnabled,
    maxStudents: course.maxStudents ?? undefined,
    enrollmentStartAt: course.enrollmentStartAt || undefined,
    enrollmentEndAt: course.enrollmentEndAt || undefined,
    enrollmentStatus: (course.enrollmentStatus || "OPEN") as
      | "OPEN"
      | "PAUSED"
      | "CLOSED"
      | "INVITE_ONLY",
    defaultEnrollmentDurationDays:
      course.defaultEnrollmentDurationDays ?? undefined,
    authors: [],
    instructors: [],
    faqs: course.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    })),
  });

  const updateFormData = (data: Partial<CourseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    setSaving(true);

    const result = await updateCourse(course.id, formData);

    if (result.success) {
      toast.success("Course updated successfully! 🎉");
      router.push("/course-management/courses");
    } else {
      toast.error(result.error || "Failed to update course");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/course-management/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Edit Course
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Update course details
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.slug}
            className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic">
                <BasicInfoTab
                  data={formData}
                  categories={categories}
                  subjects={subjects}
                  classes={classes}
                  streams={streams}
                  onChange={updateFormData}
                />
              </TabsContent>

              <TabsContent value="pricing">
                <PricingTab data={formData} onChange={updateFormData} />
              </TabsContent>

              <TabsContent value="media">
                <MediaTab
                  data={formData}
                  onChange={updateFormData}
                  courseId={course.id}
                />
              </TabsContent>

              <TabsContent value="seo">
                <SeoTab data={formData} onChange={updateFormData} />
              </TabsContent>

              <TabsContent value="settings">
                <SettingsTab data={formData} onChange={updateFormData} />
              </TabsContent>

              <TabsContent value="faq">
                <FaqTab data={formData} onChange={updateFormData} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !formData.title || !formData.slug}
          className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
