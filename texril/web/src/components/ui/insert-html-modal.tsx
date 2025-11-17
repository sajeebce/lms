"use client";

import { useState, useEffect } from "react";
import { Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DOMPurify from "dompurify";
import { toast } from "sonner";

interface InsertHTMLModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  initialHtml?: string; // For edit mode
  isEditMode?: boolean; // Flag to indicate edit mode
}

export function InsertHTMLModal({
  open,
  onClose,
  onInsert,
  initialHtml = "",
  isEditMode = false,
}: InsertHTMLModalProps) {
  const [htmlCode, setHtmlCode] = useState("");
  const [preview, setPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Load initial HTML when modal opens in edit mode
  useEffect(() => {
    if (open && isEditMode && initialHtml) {
      setHtmlCode(initialHtml);
      // Auto-preview in edit mode
      try {
        const clean = DOMPurify.sanitize(initialHtml, {
          ALLOWED_TAGS: [
            "div",
            "p",
            "span",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "strong",
            "em",
            "u",
            "b",
            "i",
            "s",
            "mark",
            "small",
            "ul",
            "ol",
            "li",
            "br",
            "hr",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "blockquote",
            "pre",
            "code",
            "a",
            "img",
          ],
          ALLOWED_ATTR: [
            "style",
            "class",
            "href",
            "target",
            "src",
            "alt",
            "width",
            "height",
          ],
          ALLOWED_STYLES: {
            "*": {
              color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
              background: [
                /^#[0-9a-f]{3,6}$/i,
                /^rgb\(/,
                /^rgba\(/,
                /^linear-gradient\(/,
                /^radial-gradient\(/,
              ],
              "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
              padding: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
              margin: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
              border: [/.*/],
              "border-radius": [/^\d+px$/, /^\d+%$/],
              "font-size": [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
              "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
              "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
              width: [/^\d+px$/, /^\d+%$/],
              height: [/^\d+px$/, /^\d+%$/],
              display: [
                /^block$/,
                /^inline$/,
                /^inline-block$/,
                /^flex$/,
                /^grid$/,
              ],
              flex: [/.*/],
              "justify-content": [/.*/],
              "align-items": [/.*/],
              gap: [/^\d+px$/, /^\d+rem$/],
            },
          },
          FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
          FORBID_ATTR: [
            "onerror",
            "onload",
            "onclick",
            "onmouseover",
            "onfocus",
            "onblur",
          ],
        });
        setPreview(clean);
        setShowPreview(true);
      } catch (error) {
        console.error("Failed to preview initial HTML:", error);
      }
    }
  }, [open, isEditMode, initialHtml]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setHtmlCode("");
      setPreview("");
      setShowPreview(false);
    }
  }, [open]);

  const handlePreview = () => {
    if (!htmlCode.trim()) {
      toast.error("Please enter HTML code first");
      return;
    }

    try {
      // ✅ Sanitize HTML with strict whitelist
      const clean = DOMPurify.sanitize(htmlCode, {
        ALLOWED_TAGS: [
          "div",
          "p",
          "span",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "strong",
          "em",
          "u",
          "b",
          "i",
          "s",
          "mark",
          "small",
          "ul",
          "ol",
          "li",
          "br",
          "hr",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "blockquote",
          "pre",
          "code",
          "a",
          "img",
        ],
        ALLOWED_ATTR: [
          "style",
          "class",
          "href",
          "target",
          "src",
          "alt",
          "width",
          "height",
        ],
        ALLOWED_STYLES: {
          "*": {
            color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
            background: [
              /^#[0-9a-f]{3,6}$/i,
              /^rgb\(/,
              /^rgba\(/,
              /^linear-gradient\(/,
              /^radial-gradient\(/,
            ],
            "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
            padding: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            margin: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            border: [/.*/],
            "border-radius": [/^\d+px$/, /^\d+%$/],
            "font-size": [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
            "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
            width: [/^\d+px$/, /^\d+%$/],
            height: [/^\d+px$/, /^\d+%$/],
            display: [
              /^block$/,
              /^inline$/,
              /^inline-block$/,
              /^flex$/,
              /^grid$/,
            ],
            flex: [/.*/],
            "justify-content": [/.*/],
            "align-items": [/.*/],
            gap: [/^\d+px$/, /^\d+rem$/],
          },
        },
        // Remove script tags and event handlers
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
        FORBID_ATTR: [
          "onerror",
          "onload",
          "onclick",
          "onmouseover",
          "onfocus",
          "onblur",
        ],
      });

      setPreview(clean);
      setShowPreview(true);
      toast.success("Preview generated successfully");
    } catch (error) {
      toast.error("Failed to generate preview");
      console.error("HTML sanitization error:", error);
    }
  };

  const handleInsert = () => {
    if (!htmlCode.trim()) {
      toast.error("Please enter HTML code first");
      return;
    }

    try {
      // ✅ Sanitize HTML before inserting (same config as preview)
      const clean = DOMPurify.sanitize(htmlCode, {
        ALLOWED_TAGS: [
          "div",
          "p",
          "span",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "strong",
          "em",
          "u",
          "b",
          "i",
          "s",
          "mark",
          "small",
          "ul",
          "ol",
          "li",
          "br",
          "hr",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "blockquote",
          "pre",
          "code",
          "a",
          "img",
        ],
        ALLOWED_ATTR: [
          "style",
          "class",
          "href",
          "target",
          "src",
          "alt",
          "width",
          "height",
        ],
        ALLOWED_STYLES: {
          "*": {
            color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
            background: [
              /^#[0-9a-f]{3,6}$/i,
              /^rgb\(/,
              /^rgba\(/,
              /^linear-gradient\(/,
              /^radial-gradient\(/,
            ],
            "background-color": [/^#[0-9a-f]{3,6}$/i, /^rgb\(/, /^rgba\(/],
            padding: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            margin: [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            border: [/.*/],
            "border-radius": [/^\d+px$/, /^\d+%$/],
            "font-size": [/^\d+px$/, /^\d+rem$/, /^\d+em$/],
            "font-weight": [/^\d+$/, /^bold$/, /^normal$/],
            "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/],
            width: [/^\d+px$/, /^\d+%$/],
            height: [/^\d+px$/, /^\d+%$/],
            display: [
              /^block$/,
              /^inline$/,
              /^inline-block$/,
              /^flex$/,
              /^grid$/,
            ],
            flex: [/.*/],
            "justify-content": [/.*/],
            "align-items": [/.*/],
            gap: [/^\d+px$/, /^\d+rem$/],
          },
        },
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
        FORBID_ATTR: [
          "onerror",
          "onload",
          "onclick",
          "onmouseover",
          "onfocus",
          "onblur",
        ],
      });

      if (!clean.trim()) {
        toast.error("HTML code was blocked for security reasons");
        return;
      }

      // Delegate success/error feedback to the editor handler so the toast
      // reflects the real update result (e.g. node found or not).
      onInsert(clean);
      onClose();
    } catch (error) {
      toast.error("Failed to process HTML");
      console.error("HTML insertion error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {isEditMode ? "Edit HTML Code" : "Insert HTML Code"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {isEditMode
              ? "Modify your HTML code with inline CSS. The code will be sanitized for security."
              : "Paste your HTML code with inline CSS. The code will be sanitized for security."}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left: Code Input */}
          <div className="flex flex-col gap-2 overflow-hidden">
            <Label className="text-sm font-medium">HTML Code</Label>
            <Textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder='<div style="background: linear-gradient(to right, #ec4899, #f97316); padding: 20px; border-radius: 8px;">
  <h2 style="color: white; margin: 0;">Hello World</h2>
  <p style="color: #fef3c7;">Custom styled content</p>
</div>'
              className="font-mono text-sm flex-1 resize-none"
              rows={15}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col gap-2 overflow-hidden">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="flex-1 border rounded-lg p-4 bg-white dark:bg-slate-950 overflow-auto">
              {showPreview ? (
                <div
                  dangerouslySetInnerHTML={{ __html: preview }}
                  className="prose dark:prose-invert max-w-none"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Click "Preview" to see rendered HTML
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            ⚠️ Scripts and event handlers are automatically removed for security
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>
              {isEditMode ? "Update HTML" : "Insert HTML"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
