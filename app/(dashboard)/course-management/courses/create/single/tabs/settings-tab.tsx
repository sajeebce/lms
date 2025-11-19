"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Button } from "@/components/ui/button";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import type { CourseFormData } from "../single-course-form";

type Props = {
  data: CourseFormData;
  onChange: (data: Partial<CourseFormData>) => void;
  courseId?: string;
};

export default function SettingsTab({ data, onChange, courseId }: Props) {
  // Derive display values from explicit UI fields first, then fallback to scheduledAt
  const baseLocal = data.scheduledAt ? new Date(data.scheduledAt) : null;

  const fallbackDate = baseLocal
    ? `${baseLocal.getFullYear()}-${String(baseLocal.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(baseLocal.getDate()).padStart(2, "0")}`
    : "";

  const fallbackTime = baseLocal
    ? `${String(baseLocal.getHours()).padStart(2, "0")}:${String(
        baseLocal.getMinutes()
      ).padStart(2, "0")}`
    : "";
  const entityId = courseId || "temp";

  const scheduledDateValue = data.scheduledDate ?? fallbackDate;
  const scheduledTimeValue = data.scheduledTime ?? fallbackTime;

  const visibilityDescriptions: Record<CourseFormData["visibility"], string> = {
    PUBLIC:
      "Public courses are listed in catalog and searchable by all eligible learners.",
    UNLISTED:
      "Unlisted courses do not appear in catalog/search. Learners need the direct link.",
    PRIVATE:
      "Private courses are hidden. Only learners you manually enroll or invite can access.",
    INTERNAL_ONLY:
      "Internal-only courses are visible only to users inside your organization, not external guests.",
  };

  const statusDescriptions: Record<CourseFormData["status"], string> = {
    DRAFT:
      "Draft courses are only visible to admins and instructors and cannot be enrolled in.",
    PUBLISHED:
      "Published courses are live and visible to learners based on visibility and enrollment settings.",
    SCHEDULED:
      "Scheduled courses will automatically publish at the selected date and time.",
    PRIVATE:
      "Private status keeps this course hidden; only directly enrolled or invited learners can access.",
  };

  const updateSchedule = (nextDate?: string, nextTime?: string) => {
    const date = nextDate !== undefined ? nextDate : scheduledDateValue;
    const time = nextTime !== undefined ? nextTime : scheduledTimeValue;

    let scheduledAt: Date | undefined;

    if (date && time) {
      const [year, month, day] = date.split("-").map((part) => Number(part));
      const [hours, minutes] = time.split(":").map((part) => Number(part));

      scheduledAt = new Date(year, month - 1, day, hours, minutes);
    }

    onChange({
      scheduledDate: date || undefined,
      scheduledTime: time || undefined,
      scheduledAt,
    });
  };

  const formatDateTimeLocal = (date: Date | undefined) => {
    if (!date) return "";
    const local = new Date(date);
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, "0");
    const day = String(local.getDate()).padStart(2, "0");
    const hours = String(local.getHours()).padStart(2, "0");
    const minutes = String(local.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const enrollmentStartValue = formatDateTimeLocal(data.enrollmentStartAt);
  const enrollmentEndValue = formatDateTimeLocal(data.enrollmentEndAt);

  return (
    <div className="space-y-6">
      {/* Visibility */}
      <div className="space-y-2">
        <Label>Course visibility</Label>
        <SearchableDropdown
          options={[
            { value: "PUBLIC", label: "Public (listed in catalog)" },
            { value: "UNLISTED", label: "Unlisted (link only)" },
            { value: "PRIVATE", label: "Private (manual access only)" },
            { value: "INTERNAL_ONLY", label: "Internal only" },
          ]}
          value={data.visibility}
          onChange={(value) => {
            if (!value) return;
            onChange({
              visibility: value as CourseFormData["visibility"],
            });
          }}
          placeholder="Select visibility"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {visibilityDescriptions[data.visibility] ??
            "Visibility controls who can discover this course in catalog/search."}
        </p>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label>Course status *</Label>
        <SearchableDropdown
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "SCHEDULED", label: "Scheduled" },
            { value: "PRIVATE", label: "Private" },
          ]}
          value={data.status}
          onChange={(value) => {
            if (!value) return;
            onChange({ status: value as CourseFormData["status"] });
          }}
          placeholder="Select status"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {statusDescriptions[data.status] ??
            "Status controls whether learners can see and enroll in this course."}
        </p>

        {/* Schedule (when status = Scheduled) */}
        {data.status === "SCHEDULED" && (
          <div className="space-y-2 rounded-lg border bg-neutral-50 p-4 dark:bg-neutral-900/40">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label>Scheduled publish date &amp; time *</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  The course will be treated as{" "}
                  <span className="font-semibold">Scheduled</span> and can be
                  auto-published at this date &amp; time.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={scheduledDateValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateSchedule(value, undefined);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={scheduledTimeValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateSchedule(undefined, value);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-full bg-purple-50 px-3 py-2 text-xs dark:bg-purple-900/40">
                  <span className="font-medium text-purple-700 dark:text-purple-200">
                    Show as "Coming soon"
                  </span>
                  <Switch
                    checked={data.showComingSoon}
                    onCheckedChange={(checked) =>
                      onChange({ showComingSoon: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-full bg-indigo-50 px-3 py-2 text-xs dark:bg-indigo-900/40">
                  <span className="font-medium text-indigo-700 dark:text-indigo-200">
                    Allow curriculum preview
                  </span>
                  <Switch
                    checked={data.allowCurriculumPreview}
                    onCheckedChange={(checked) =>
                      onChange({ allowCurriculumPreview: checked })
                    }
                  />
                </div>
              </div>

              {/* Scheduled featured image (coming soon cover) */}
              <div className="mt-4 space-y-2 rounded-xl border border-dashed border-sky-300/70 bg-sky-50/60 p-3 dark:border-sky-500/50 dark:bg-sky-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold">
                      <ImageIcon className="h-4 w-4 text-sky-500" />
                      <span>Scheduled featured image (coming soon cover)</span>
                    </Label>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      This image is shown while the course is scheduled. After
                      publish it is removed and the Media tab featured image is
                      used again.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileUploadButton
                      category="course_scheduled_image"
                      entityType="course"
                      entityId={entityId}
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      buttonText={
                        data.comingSoonImage
                          ? "Change image"
                          : "Upload scheduled image"
                      }
                      buttonVariant="outline"
                      showImageProperties={false}
                      className="whitespace-nowrap text-xs"
                      onUploadComplete={(url) =>
                        onChange({ comingSoonImage: url })
                      }
                    />
                    {data.comingSoonImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onChange({ comingSoonImage: undefined })}
                        aria-label="Remove scheduled image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {data.comingSoonImage && (
                  <div className="mt-2 rounded-lg border bg-neutral-50/80 p-2 dark:bg-neutral-900/60">
                    <p className="mb-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
                      Scheduled cover preview
                    </p>
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={data.comingSoonImage}
                        alt="Scheduled featured"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400">
              Required when status is{" "}
              <span className="font-semibold">Scheduled</span>.
            </p>
          </div>
        )}
      </div>

      {/* Enrollment */}
      <div className="space-y-3 rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Enrollment settings</Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Control how learners can join this course and any capacity limits.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Maximum students</Label>
            <Input
              type="number"
              min={0}
              max={9999}
              value={data.maxStudents ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onChange({
                  maxStudents: value === "" ? undefined : Number(value),
                });
              }}
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Empty = no limit.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Enrollment status</Label>
            <SearchableDropdown
              options={[
                { value: "OPEN", label: "Open" },
                { value: "PAUSED", label: "Paused" },
                { value: "CLOSED", label: "Closed" },
                { value: "INVITE_ONLY", label: "Invite only" },
              ]}
              value={data.enrollmentStatus}
              onChange={(value) => {
                if (!value) return;
                onChange({
                  enrollmentStatus: value as CourseFormData["enrollmentStatus"],
                });
              }}
              placeholder="Select enrollment status"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default access duration (days)</Label>
            <Input
              type="number"
              min={0}
              max={9999}
              value={data.defaultEnrollmentDurationDays ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                onChange({
                  defaultEnrollmentDurationDays:
                    value === "" ? undefined : Number(value),
                });
              }}
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Empty or 0 = lifetime access.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Enrollment start (optional)</Label>
            <Input
              type="datetime-local"
              value={enrollmentStartValue}
              onChange={(event) =>
                onChange({
                  enrollmentStartAt: event.target.value
                    ? new Date(event.target.value)
                    : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Enrollment end (optional)</Label>
            <Input
              type="datetime-local"
              value={enrollmentEndValue}
              onChange={(event) =>
                onChange({
                  enrollmentEndAt: event.target.value
                    ? new Date(event.target.value)
                    : undefined,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4">
        {/* Featured Course */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Featured Course</Label>
            <p className="text-sm text-neutral-500">
              Show this course in featured section on homepage
            </p>
          </div>
          <Switch
            checked={data.isFeatured}
            onCheckedChange={(checked) => onChange({ isFeatured: checked })}
          />
        </div>

        {/* Allow Comments */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Allow Comments</Label>
            <p className="text-sm text-neutral-500">
              Students can comment on lessons and topics
            </p>
          </div>
          <Switch
            checked={data.allowComments}
            onCheckedChange={(checked) => onChange({ allowComments: checked })}
          />
        </div>

        {/* Certificate Enabled */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label>Certificate Enabled</Label>
            <p className="text-sm text-neutral-500">
              Issue certificate upon course completion
            </p>
          </div>
          <Switch
            checked={data.certificateEnabled}
            onCheckedChange={(checked) =>
              onChange({ certificateEnabled: checked })
            }
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="border rounded-lg p-4 space-y-2 bg-violet-50 dark:bg-violet-950/20">
        <h3 className="font-medium text-violet-600 dark:text-violet-400">
          Course Visibility
        </h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li>
            • <strong>Draft:</strong> Only visible to admins/instructors
          </li>
          <li>
            • <strong>Published:</strong> Visible to all students (can enroll)
          </li>
          <li>
            • <strong>Scheduled:</strong> Will be published at scheduled date
          </li>
          <li>
            • <strong>Private:</strong> Only accessible via direct invite link
          </li>
        </ul>
      </div>
    </div>
  );
}
