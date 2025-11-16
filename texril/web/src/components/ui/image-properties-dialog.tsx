"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadTab } from "./file-upload-tab";
import { ServerFilesTab } from "./server-files-tab";
import { RecentFilesTab } from "./recent-files-tab";
import { ExternalUrlTab } from "./external-url-tab";
import { toast } from "sonner";
import { Upload, Server, Clock, Link } from "lucide-react";
import { addRecentFile } from "@/lib/storage/recent-files";

export interface ImageProperties {
  url: string;
  alt?: string; // Optional alt text
  description?: string; // Image description (like Sun Editor)
  width?: number;
  height?: number;
  alignment: "left" | "center" | "right";
  border?: "none" | "thin" | "medium" | "thick"; // Border style
  borderColor?: string; // Border color (hex)
  fileId?: string; // For server-side deletion
}

interface ImagePropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (props: ImageProperties) => void;
  isEditMode?: boolean; // To show "Update" instead of "Insert Image"
  initialUrl?: string;
  initialAlt?: string;
  initialDescription?: string;
  initialWidth?: number;
  initialHeight?: number;
  initialAlignment?: "left" | "center" | "right";
  initialBorder?: "none" | "thin" | "medium" | "thick";
  initialBorderColor?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
}

export function ImagePropertiesDialog({
  open,
  onClose,
  onInsert,
  isEditMode = false,
  initialUrl = "",
  initialAlt = "",
  initialDescription = "",
  initialWidth,
  initialHeight,
  initialAlignment = "center",
  initialBorder = "none",
  initialBorderColor = "#d1d5db",
  category = "question_image",
  entityType,
  entityId,
}: ImagePropertiesDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [alt, setAlt] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState<number | undefined>();
  const [height, setHeight] = useState<number | undefined>();
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(
    "center"
  );
  const [border, setBorder] = useState<"none" | "thin" | "medium" | "thick">(
    "none"
  );
  const [borderColor, setBorderColor] = useState("#d1d5db"); // Default gray
  const [autoSize, setAutoSize] = useState(true);
  const [fileId, setFileId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("upload"); // Tab state

  useEffect(() => {
    if (open) {
      setUrl(initialUrl || "");
      setAlt(initialAlt || "");
      setDescription(initialDescription || "");
      setWidth(initialWidth);
      setHeight(initialHeight);
      setAlignment(initialAlignment || "center");
      setBorder(initialBorder || "none");
      setBorderColor(initialBorderColor || "#d1d5db");
      setAutoSize(!initialWidth && !initialHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFileSelect = (file: {
    url: string
    fileName: string
    fileSize: number
    mimeType: string
    id?: string
  }) => {
    setUrl(file.url);
    setFileId(file.id); // Store file ID for deletion

    // Auto-fill alt text with filename if empty
    if (!alt) {
      setAlt(file.fileName.replace(/\.[^/.]+$/, "")); // Remove extension
    }

    // Add to recent files
    addRecentFile({
      url: file.url,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      id: file.id,
      timestamp: Date.now(),
    });

    // Keep the main dialog open so user can adjust size/alignment
  };

  // Check if URL is internal (local storage or R2)
  const isInternalUrl = (url: string) => {
    if (!url) return false;
    return (
      url.startsWith("/api/storage/") ||
      url.includes("r2.cloudflarestorage.com") ||
      url.includes(".r2.dev") ||
      url.startsWith("/storage/")
    );
  };

  // Get display URL (hide internal URLs for security)
  const getDisplayUrl = () => {
    if (isInternalUrl(url)) {
      return "[Internal Storage - URL Hidden for Security]";
    }
    return url;
  };

  const handleInsert = () => {
    if (!url.trim()) {
      toast.error("Please select or enter an image URL");
      return;
    }

    if (alt.length > 125) {
      toast.error("Alt text must be 125 characters or less");
      return;
    }

    onInsert({
      url,
      alt: alt.trim() || undefined,
      description: description.trim() || undefined,
      width: autoSize ? undefined : width,
      height: autoSize ? undefined : height,
      alignment,
      border,
      borderColor: border !== "none" ? borderColor : undefined,
      fileId, // Pass file ID for deletion
    });

    // Don't close here - let parent handle closing after update
    if (!isEditMode) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Image" : "Insert Image"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Selection Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="server" className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Server Files
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <FileUploadTab
                  category={category}
                  entityType={entityType}
                  entityId={entityId}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                  onFileSelect={handleFileSelect}
                />
              </TabsContent>

              <TabsContent value="server" className="mt-4">
                <ServerFilesTab
                  category={category}
                  entityType={entityType}
                  entityId={entityId}
                  onFileSelect={handleFileSelect}
                />
              </TabsContent>

              <TabsContent value="recent" className="mt-4">
                <RecentFilesTab onFileSelect={handleFileSelect} />
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <ExternalUrlTab
                  onUrlSubmit={(externalUrl) => {
                    setUrl(externalUrl)
                    toast.success('External URL added')
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Image Preview */}
            {url && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-sm font-medium mb-2">Selected Image Preview:</p>
                <img
                  src={url}
                  alt="Preview"
                  className="max-w-full max-h-48 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image.png";
                  }}
                />
              </div>
            )}

            {/* Alt Text (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text (Optional)</Label>
              <Textarea
                id="alt-text"
                placeholder="Describe the image for accessibility (optional)"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={125}
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {alt.length}/125 characters
              </p>
            </div>

            {/* Description Field (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this image (for metadata/gallery)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions</Label>

              {/* Current Size Display */}
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                Current size: {width || "auto"} × {height || "auto"}
                {width && height && (
                  <span className="ml-2 text-xs">
                    ({width}px × {height}px)
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-size"
                  checked={autoSize}
                  onCheckedChange={(checked) => setAutoSize(checked as boolean)}
                />
                <Label
                  htmlFor="auto-size"
                  className="text-sm font-normal cursor-pointer"
                >
                  Auto size
                </Label>
              </div>

              {!autoSize && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="Auto"
                      value={width || ""}
                      onChange={(e) =>
                        setWidth(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Auto"
                      value={height || ""}
                      onChange={(e) =>
                        setHeight(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      min={1}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Alignment & Border - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alignment */}
              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Select
                  value={alignment}
                  onValueChange={(value: any) => setAlignment(value)}
                >
                  <SelectTrigger id="alignment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Border */}
              <div className="space-y-2">
                <Label htmlFor="border">Border</Label>
                <Select
                  value={border}
                  onValueChange={(value: any) => setBorder(value)}
                >
                  <SelectTrigger id="border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="thin">Thin (1px solid)</SelectItem>
                    <SelectItem value="medium">Medium (2px solid)</SelectItem>
                    <SelectItem value="thick">Thick (4px solid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Border Color (only show if border is not "none") */}
            {border !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="borderColor">Border Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="borderColor"
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    placeholder="#d1d5db"
                    maxLength={7}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleInsert}>
              {isEditMode ? "Update" : "Insert Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
