"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Load the heavy TipTap editor only on the client
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor"),
  { ssr: false }
);

export default function EmbedPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const context = searchParams.get("context") ?? "lesson";
  const lessonId =
    searchParams.get("lesson_id") ?? searchParams.get("lessonId");

  const [value, setValue] = useState<string>("");

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm">
          Missing embed token. Make sure your WordPress plugin is configured
          correctly.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Inject theme CSS variables for button gradients (Purple/Violet theme - matching LMS) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --theme-active-from: #5b21b6;
            --theme-active-to: #7c3aed;
            --theme-hover-from: #f5f3ff;
            --theme-hover-to: #ede9fe;
            --theme-border: #c4b5fd;
            --theme-button-from: #5b21b6;
            --theme-button-to: #7c3aed;
            --theme-hover-text: #5b21b6;
          }
        `,
        }}
      />

      <div className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <RichTextEditor
              value={value}
              onChange={setValue}
              placeholder="Start writing your lesson content..."
              minHeight="300px"
              showIndentGuides
            />
            <p className="mt-2 text-xs text-slate-400">
              Context: {context}
              {lessonId ? `  Lesson ID: ` : null}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
