"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Link as LinkIcon, Trash2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, openInNewTab: boolean) => void;
  onRemove?: () => void;
  initialUrl?: string;
  initialOpenInNewTab?: boolean;
  isEditMode?: boolean;
}

// 🔒 SECURITY: URL Validation & Sanitization
const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === "") return false;

  // Prevent dangerous protocols
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "about:",
  ];

  const lowerUrl = url.toLowerCase().trim();
  if (dangerousProtocols.some((protocol) => lowerUrl.startsWith(protocol))) {
    return false;
  }

  // Allow http, https, mailto, tel
  const allowedProtocols = ["http://", "https://", "mailto:", "tel:"];
  const hasProtocol = allowedProtocols.some((protocol) =>
    lowerUrl.startsWith(protocol)
  );

  // If no protocol, assume https://
  if (!hasProtocol && !lowerUrl.startsWith("mailto:") && !lowerUrl.startsWith("tel:")) {
    return true; // Will be auto-prefixed
  }

  // Basic URL validation
  try {
    new URL(hasProtocol ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();

  // Auto-add https:// if no protocol
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("mailto:") &&
    !trimmed.startsWith("tel:")
  ) {
    return `https://${trimmed}`;
  }

  return trimmed;
};

export function LinkDialog({
  open,
  onClose,
  onInsert,
  onRemove,
  initialUrl = "",
  initialOpenInNewTab = true,
  isEditMode = false,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setOpenInNewTab(initialOpenInNewTab);
      setError("");
    }
  }, [open, initialUrl, initialOpenInNewTab]);

  const handleInsert = () => {
    // Validate URL
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    // Sanitize and insert
    const sanitizedUrl = sanitizeUrl(url);
    onInsert(sanitizedUrl, openInNewTab);
    onClose();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInsert();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            {isEditMode ? "Edit Link" : "Insert Link"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the link URL and settings"
              : "Add a hyperlink to your content"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-semibold">
              URL *
            </Label>
            <div className="relative">
              <Input
                id="url"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                className={`pr-10 ${
                  error
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-blue-500"
                }`}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {url && isValidUrl(url) ? (
                  <ExternalLink className="h-4 w-4 text-green-500" />
                ) : url ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : null}
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supported: https://, http://, mailto:, tel:
            </p>
          </div>

          {/* Open in New Tab */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-0.5">
              <Label htmlFor="new-tab" className="text-sm font-semibold cursor-pointer">
                Open in New Tab
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Link will open in a new browser tab
              </p>
            </div>
            <Switch
              id="new-tab"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
            />
          </div>

          {/* URL Preview */}
          {url && isValidUrl(url) && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Preview:
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 break-all font-mono">
                {sanitizeUrl(url)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isEditMode && onRemove && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="mr-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Link
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
            disabled={!url || !isValidUrl(url)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {isEditMode ? "Update Link" : "Insert Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

