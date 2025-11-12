"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mathematics from "@tiptap/extension-mathematics";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import { FontFamily } from "@tiptap/extension-font-family";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Extension } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/core";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import "katex/dist/katex.min.css"; // ✅ KaTeX CSS for math rendering
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Sigma,
  Undo,
  Redo,
  Palette,
  Highlighter,
  Type,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  Table as TableIcon,
  Quote,
  Minus,
  Link as LinkIcon,
  Heading,
  IndentIncrease,
  IndentDecrease,
  Sparkles,
} from "lucide-react";
import "katex/dist/katex.min.css";
import "./editor-styles.css";
import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import MathLiveModal from "./mathlive-modal";
import {
  ImagePropertiesDialog,
  type ImageProperties,
} from "@/components/ui/image-properties-dialog";

const lowlight = createLowlight(common);

// Custom Resizable Image Extension with Delete & Alignment
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      textAlign: {
        default: "center",
        renderHTML: (attributes) => {
          if (!attributes.textAlign) return {};
          return { style: `text-align: ${attributes.textAlign}` };
        },
      },
      description: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.description) return {};
          return { "data-description": attributes.description };
        },
      },
      border: {
        default: "none",
        parseHTML: (element) => {
          return element.getAttribute("data-border") || "none";
        },
        renderHTML: (attributes) => {
          if (!attributes.border || attributes.border === "none") return {};
          return { "data-border": attributes.border };
        },
      },
      borderColor: {
        default: "#d1d5db",
        parseHTML: (element) => {
          return element.getAttribute("data-border-color") || "#d1d5db";
        },
        renderHTML: (attributes) => {
          if (!attributes.borderColor) return {};
          return { "data-border-color": attributes.borderColor };
        },
      },
      rotation: {
        default: 0,
        parseHTML: (element) => {
          const rotation = element.getAttribute("data-rotation");
          return rotation ? parseInt(rotation) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.rotation || attributes.rotation === 0) return {};
          return { "data-rotation": attributes.rotation };
        },
      },
      // Phase 2.2: Mirror attributes
      flipH: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute("data-flip-h") === "true";
        },
        renderHTML: (attributes) => {
          if (!attributes.flipH) return {};
          return { "data-flip-h": "true" };
        },
      },
      flipV: {
        default: false,
        parseHTML: (element) => {
          return element.getAttribute("data-flip-v") === "true";
        },
        renderHTML: (attributes) => {
          if (!attributes.flipV) return {};
          return { "data-flip-v": "true" };
        },
      },
      "data-file-id": {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes["data-file-id"]) return {};
          return { "data-file-id": attributes["data-file-id"] };
        },
      },
    };
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let currentNode = node;
      const container = document.createElement("div");
      container.className = "image-wrapper";
      container.style.position = "relative";
      container.style.display = "block";
      container.style.maxWidth = "100%";
      container.style.margin = "10px 0";
      container.style.textAlign = currentNode.attrs.textAlign || "center";

      const img = document.createElement("img");
      img.src = currentNode.attrs.src;
      img.alt = currentNode.attrs.alt || "";
      img.title = currentNode.attrs.title || "";
      if (currentNode.attrs.width) {
        img.width = currentNode.attrs.width;
        img.style.width = currentNode.attrs.width + "px";
      }
      if (currentNode.attrs.height) {
        img.height = currentNode.attrs.height;
        img.style.height = currentNode.attrs.height + "px";
      }
      img.style.maxWidth = "100%";
      // Remove height: auto to allow manual height control
      img.style.cursor = "pointer";
      img.style.display = "inline-block";
      img.style.transition = "all 0.2s ease";

      // Apply border style with custom color
      const borderStyle = currentNode.attrs.border || "none";
      const borderColor = currentNode.attrs.borderColor || "#d1d5db";
      if (borderStyle === "thin") {
        img.style.border = `1px solid ${borderColor}`;
      } else if (borderStyle === "medium") {
        img.style.border = `2px solid ${borderColor}`;
      } else if (borderStyle === "thick") {
        img.style.border = `4px solid ${borderColor}`;
      } else {
        img.style.border = "none";
      }

      // Phase 2.1 & 2.2: Apply rotation and mirror transforms
      const rotation = currentNode.attrs.rotation || 0;
      const flipH = currentNode.attrs.flipH || false;
      const flipV = currentNode.attrs.flipV || false;

      const transforms = [];
      if (rotation !== 0) {
        transforms.push(`rotate(${rotation}deg)`);
      }
      if (flipH || flipV) {
        transforms.push(`scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`);
      }
      if (transforms.length > 0) {
        img.style.transform = transforms.join(" ");
      }

      // Selection border (hidden by default)
      const selectionBorder = document.createElement("div");
      selectionBorder.style.position = "absolute";
      selectionBorder.style.top = "-4px";
      selectionBorder.style.left = "-4px";
      selectionBorder.style.right = "-4px";
      selectionBorder.style.bottom = "-4px";
      selectionBorder.style.border = "3px solid #4F46E5";
      selectionBorder.style.borderRadius = "4px";
      selectionBorder.style.pointerEvents = "none";
      selectionBorder.style.display = "none";
      selectionBorder.style.zIndex = "1";

      const sizeBadge = document.createElement("div");
      sizeBadge.style.position = "absolute";
      sizeBadge.style.top = "-36px";
      sizeBadge.style.left = "50%";
      sizeBadge.style.transform = "translateX(-50%)";
      sizeBadge.style.padding = "4px 10px";
      sizeBadge.style.borderRadius = "999px";
      sizeBadge.style.background = "rgba(15, 23, 42, 0.85)";
      sizeBadge.style.color = "white";
      sizeBadge.style.fontSize = "12px";
      sizeBadge.style.fontWeight = "600";
      sizeBadge.style.display = "none";
      sizeBadge.style.pointerEvents = "none";
      sizeBadge.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.25)";

      const getCurrentDimensions = () => {
        const rect = img.getBoundingClientRect();
        let width =
          rect.width ||
          img.offsetWidth ||
          img.naturalWidth ||
          currentNode.attrs.width ||
          0;
        let height =
          rect.height ||
          img.offsetHeight ||
          img.naturalHeight ||
          currentNode.attrs.height ||
          0;

        if (!height && width && img.naturalWidth) {
          const ratio = img.naturalHeight / img.naturalWidth || 1;
          height = width * ratio;
        }

        if (!width && height && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight || 1;
          width = height * ratio;
        }

        if (!width) width = 100;
        if (!height) height = width;

        return { width, height };
      };

      const updateSizeBadge = (width: number, height: number) => {
        sizeBadge.textContent = `${Math.round(width)}px x ${Math.round(
          height
        )}px`;
      };

      // Phase 2.1: Rotate image using Canvas API
      const rotateImage = async (direction: "left" | "right") => {
        try {
          // Calculate new rotation (0, 90, 180, 270)
          const currentRotation = currentNode.attrs.rotation || 0;
          const rotationDelta = direction === "left" ? -90 : 90;
          let newRotation = (currentRotation + rotationDelta) % 360;
          if (newRotation < 0) newRotation += 360;

          // Create canvas for rotation
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("Canvas context not available");
            return;
          }

          // Load image (use HTMLImageElement to avoid conflict with TipTap Image)
          const sourceImg = document.createElement("img") as HTMLImageElement;
          sourceImg.crossOrigin = "anonymous"; // For CORS
          sourceImg.src = img.src;

          await new Promise((resolve, reject) => {
            sourceImg.onload = resolve;
            sourceImg.onerror = reject;
          });

          // Calculate canvas dimensions (swap width/height for 90/270 rotation)
          const isVerticalRotation = newRotation === 90 || newRotation === 270;
          canvas.width = isVerticalRotation
            ? sourceImg.naturalHeight
            : sourceImg.naturalWidth;
          canvas.height = isVerticalRotation
            ? sourceImg.naturalWidth
            : sourceImg.naturalHeight;

          // Apply rotation
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((newRotation * Math.PI) / 180);
          ctx.drawImage(
            sourceImg,
            -sourceImg.naturalWidth / 2,
            -sourceImg.naturalHeight / 2
          );
          ctx.restore();

          // Convert to data URL
          const rotatedDataURL = canvas.toDataURL("image/png");

          // Update image src
          img.src = rotatedDataURL;

          // Update dimensions (swap if 90/270)
          const currentWidth = currentNode.attrs.width || img.naturalWidth;
          const currentHeight = currentNode.attrs.height || img.naturalHeight;

          const newWidth = isVerticalRotation ? currentHeight : currentWidth;
          const newHeight = isVerticalRotation ? currentWidth : currentHeight;

          img.width = newWidth;
          img.height = newHeight;
          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;

          // Update TipTap node attributes
          if (typeof getPos === "function") {
            editor.commands.updateAttributes("image", {
              src: rotatedDataURL,
              rotation: newRotation,
              width: newWidth,
              height: newHeight,
            });
          }

          // Update current node reference
          currentNode = {
            ...currentNode,
            attrs: {
              ...currentNode.attrs,
              src: rotatedDataURL,
              rotation: newRotation,
              width: newWidth,
              height: newHeight,
            },
          };

          console.log(`✅ Rotated ${direction} to ${newRotation}°`);
        } catch (error) {
          console.error("Failed to rotate image:", error);
        }
      };

      // Phase 2.2: Mirror image using Canvas API
      const mirrorImage = async (direction: "horizontal" | "vertical") => {
        try {
          // Toggle flip state
          const currentFlipH = currentNode.attrs.flipH || false;
          const currentFlipV = currentNode.attrs.flipV || false;
          const newFlipH =
            direction === "horizontal" ? !currentFlipH : currentFlipH;
          const newFlipV =
            direction === "vertical" ? !currentFlipV : currentFlipV;

          // Create canvas for mirroring
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("Canvas context not available");
            return;
          }

          // Load image
          const sourceImg = document.createElement("img") as HTMLImageElement;
          sourceImg.crossOrigin = "anonymous";
          sourceImg.src = img.src;

          await new Promise((resolve, reject) => {
            sourceImg.onload = resolve;
            sourceImg.onerror = reject;
          });

          // Set canvas dimensions (same as source)
          canvas.width = sourceImg.naturalWidth;
          canvas.height = sourceImg.naturalHeight;

          // Apply mirroring
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(newFlipH ? -1 : 1, newFlipV ? -1 : 1);
          ctx.drawImage(
            sourceImg,
            -sourceImg.naturalWidth / 2,
            -sourceImg.naturalHeight / 2
          );
          ctx.restore();

          // Convert to data URL
          const mirroredDataURL = canvas.toDataURL("image/png");

          // Update image src
          img.src = mirroredDataURL;

          // Update TipTap node attributes
          if (typeof getPos === "function") {
            editor.commands.updateAttributes("image", {
              src: mirroredDataURL,
              flipH: newFlipH,
              flipV: newFlipV,
            });
          }

          // Update current node reference
          currentNode = {
            ...currentNode,
            attrs: {
              ...currentNode.attrs,
              src: mirroredDataURL,
              flipH: newFlipH,
              flipV: newFlipV,
            },
          };

          console.log(`✅ Mirrored ${direction}: H=${newFlipH}, V=${newFlipV}`);
        } catch (error) {
          console.error("Failed to mirror image:", error);
        }
      };

      // Toolbar (delete + alignment buttons)
      const toolbar = document.createElement("div");
      toolbar.style.position = "absolute";
      toolbar.style.top = "-45px";
      toolbar.style.left = "50%";
      toolbar.style.transform = "translateX(-50%)";
      toolbar.style.display = "none";
      toolbar.style.gap = "4px";
      toolbar.style.background = "white";
      toolbar.style.border = "1px solid #e5e7eb";
      toolbar.style.borderRadius = "8px";
      toolbar.style.padding = "4px";
      toolbar.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
      toolbar.style.zIndex = "20";
      toolbar.style.alignItems = "center";
      toolbar.className = "flex";

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      `;
      deleteBtn.style.padding = "6px";
      deleteBtn.style.borderRadius = "4px";
      deleteBtn.style.border = "none";
      deleteBtn.style.background = "#ef4444";
      deleteBtn.style.color = "white";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.display = "flex";
      deleteBtn.style.alignItems = "center";
      deleteBtn.style.justifyContent = "center";
      deleteBtn.title = "Delete Image";
      deleteBtn.addEventListener("mouseenter", () => {
        deleteBtn.style.background = "#dc2626";
      });
      deleteBtn.addEventListener("mouseleave", () => {
        deleteBtn.style.background = "#ef4444";
      });
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Delete from server if file ID exists
        const fileId = currentNode.attrs["data-file-id"];
        if (fileId) {
          try {
            await fetch(`/api/files/${fileId}`, { method: "DELETE" });
          } catch (error) {
            console.error("Failed to delete file from server:", error);
          }
        }

        // Delete from editor
        if (typeof getPos === "function") {
          editor.commands.deleteRange({
            from: getPos(),
            to: getPos() + currentNode.nodeSize,
          });
        }
      });

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      `;
      editBtn.style.padding = "6px";
      editBtn.style.borderRadius = "4px";
      editBtn.style.border = "none";
      editBtn.style.background = "#3b82f6";
      editBtn.style.color = "white";
      editBtn.style.cursor = "pointer";
      editBtn.style.display = "flex";
      editBtn.style.alignItems = "center";
      editBtn.style.justifyContent = "center";
      editBtn.title = "Edit Image Properties";
      editBtn.addEventListener("mouseenter", () => {
        editBtn.style.background = "#2563eb";
      });
      editBtn.addEventListener("mouseleave", () => {
        editBtn.style.background = "#3b82f6";
      });
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get editor instance from the node
        const editorView = editor.view;
        if (!editorView) return;

        // Find the React component instance and call the edit handler
        // We'll use a data attribute to store the callback

        // ✅ CRITICAL FIX: Read description from DOM element, not currentNode
        // This ensures we always get the latest value
        const descriptionFromDOM = descriptionCaption?.textContent || null;

        const imageData = {
          src: currentNode.attrs.src,
          alt: currentNode.attrs.alt,
          description: descriptionFromDOM, // ← Read from DOM, not currentNode
          width: currentNode.attrs.width,
          height: currentNode.attrs.height,
          textAlign: currentNode.attrs.textAlign,
          border: currentNode.attrs.border,
          borderColor: currentNode.attrs.borderColor,
          fileId: currentNode.attrs["data-file-id"],
          pos: typeof getPos === "function" ? getPos() : null,
        };

        // 🐛 DEBUG: Log what we're sending to edit modal
        console.log(
          "🔍 Edit Button - Description from DOM:",
          descriptionFromDOM
        );
        console.log("🔍 Edit Button - Current node attrs:", currentNode.attrs);
        console.log("🔍 Edit Button - Image data being sent:", imageData);

        // Store in a global variable that React can access
        (window as any).__editImageData = imageData;
        (window as any).__triggerImageEdit?.();
      });

      // Divider 1
      const divider1 = document.createElement("div");
      divider1.style.width = "1px";
      divider1.style.height = "24px";
      divider1.style.background = "#e5e7eb";

      // Divider 2
      const divider2 = document.createElement("div");
      divider2.style.width = "1px";
      divider2.style.height = "24px";
      divider2.style.background = "#e5e7eb";

      // Alignment buttons
      const createAlignBtn = (
        align: "left" | "center" | "right",
        icon: string
      ) => {
        const btn = document.createElement("button");
        btn.innerHTML = icon;
        btn.style.padding = "6px";
        btn.style.borderRadius = "4px";
        btn.style.border = "none";
        btn.style.background = "#f3f4f6";
        btn.style.color = "#374151";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.title = `Align ${align}`;
        btn.addEventListener("mouseenter", () => {
          btn.style.background = "#e5e7eb";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "#f3f4f6";
        });
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof getPos === "function") {
            const pos = getPos();
            // Update the image's text-align attribute
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes("image", { textAlign: align })
              .run();

            // Also update the parent paragraph alignment
            editor.chain().focus().setTextAlign(align).run();

            // Update container style immediately for visual feedback
            container.style.textAlign = align;
          }
        });
        return btn;
      };

      const alignLeftBtn = createAlignBtn(
        "left",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      `
      );

      const alignCenterBtn = createAlignBtn(
        "center",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" />
        </svg>
      `
      );

      const alignRightBtn = createAlignBtn(
        "right",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" />
        </svg>
      `
      );

      // Phase 2.1: Rotate buttons
      const createDivider = () => {
        const divider = document.createElement("div");
        divider.style.width = "1px";
        divider.style.height = "20px";
        divider.style.background = "#e5e7eb";
        return divider;
      };

      const createRotateBtn = (
        direction: "left" | "right",
        svgIcon: string
      ) => {
        const btn = document.createElement("button");
        btn.innerHTML = svgIcon;
        btn.style.padding = "6px";
        btn.style.borderRadius = "4px";
        btn.style.border = "none";
        btn.style.background = "transparent";
        btn.style.color = "#6b7280";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.title =
          direction === "left" ? "Rotate Left (90°)" : "Rotate Right (90°)";
        btn.addEventListener("mouseenter", () => {
          btn.style.background = "#f3f4f6";
          btn.style.color = "#111827";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "transparent";
          btn.style.color = "#6b7280";
        });
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await rotateImage(direction);
        });
        return btn;
      };

      const rotateLeftBtn = createRotateBtn(
        "left",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      `
      );

      const rotateRightBtn = createRotateBtn(
        "right",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      `
      );

      const divider3 = createDivider();

      // Phase 2.2: Mirror buttons
      const createMirrorBtn = (
        direction: "horizontal" | "vertical",
        svgIcon: string
      ) => {
        const btn = document.createElement("button");
        btn.innerHTML = svgIcon;
        btn.style.padding = "6px";
        btn.style.borderRadius = "4px";
        btn.style.border = "none";
        btn.style.background = "transparent";
        btn.style.color = "#6b7280";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.title =
          direction === "horizontal" ? "Mirror Horizontal" : "Mirror Vertical";
        btn.addEventListener("mouseenter", () => {
          btn.style.background = "#f3f4f6";
          btn.style.color = "#111827";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "transparent";
          btn.style.color = "#6b7280";
        });
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await mirrorImage(direction);
        });
        return btn;
      };

      const mirrorHBtn = createMirrorBtn(
        "horizontal",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      `
      );

      const mirrorVBtn = createMirrorBtn(
        "vertical",
        `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      `
      );

      const divider4 = createDivider();

      toolbar.appendChild(deleteBtn);
      toolbar.appendChild(divider1);
      toolbar.appendChild(editBtn);
      toolbar.appendChild(divider2);
      toolbar.appendChild(alignLeftBtn);
      toolbar.appendChild(alignCenterBtn);
      toolbar.appendChild(alignRightBtn);
      toolbar.appendChild(divider3);
      toolbar.appendChild(rotateLeftBtn);
      toolbar.appendChild(rotateRightBtn);
      toolbar.appendChild(divider4);
      toolbar.appendChild(mirrorHBtn);
      toolbar.appendChild(mirrorVBtn);

      // Phase 1.1: Resize handles (8 handles: 4 corners + 4 edges)
      type HandlePosition = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
      const cornerHandles: HandlePosition[] = ["nw", "ne", "sw", "se"];

      const createHandle = (position: HandlePosition) => {
        const handle = document.createElement("div");
        handle.className = `resize-handle-${position}`;
        handle.style.position = "absolute";
        handle.style.display = "none";
        handle.style.zIndex = "10";
        handle.style.border = "2px solid white";
        handle.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.35)";

        const isCorner = cornerHandles.includes(position);

        if (isCorner) {
          handle.style.width = "12px";
          handle.style.height = "12px";
          handle.style.borderRadius = "50%";
          handle.style.background = "#4F46E5";
          handle.style.cursor =
            position === "nw" || position === "se"
              ? "nwse-resize"
              : "nesw-resize";
        } else {
          handle.style.borderRadius = "6px";
          handle.style.background = "#F97316";
          if (position === "n" || position === "s") {
            handle.style.width = "38px";
            handle.style.height = "6px";
            handle.style.cursor = "ns-resize";
          } else {
            handle.style.width = "6px";
            handle.style.height = "38px";
            handle.style.cursor = "ew-resize";
          }
        }

        const cornerOffset = "-6px";
        const edgeOffset = "-3px";

        switch (position) {
          case "nw":
            handle.style.top = cornerOffset;
            handle.style.left = cornerOffset;
            break;
          case "ne":
            handle.style.top = cornerOffset;
            handle.style.right = cornerOffset;
            break;
          case "sw":
            handle.style.bottom = cornerOffset;
            handle.style.left = cornerOffset;
            break;
          case "se":
            handle.style.bottom = cornerOffset;
            handle.style.right = cornerOffset;
            break;
          case "n":
            handle.style.top = edgeOffset;
            handle.style.left = "50%";
            handle.style.transform = "translateX(-50%)";
            break;
          case "s":
            handle.style.bottom = edgeOffset;
            handle.style.left = "50%";
            handle.style.transform = "translateX(-50%)";
            break;
          case "e":
            handle.style.right = edgeOffset;
            handle.style.top = "50%";
            handle.style.transform = "translateY(-50%)";
            break;
          case "w":
            handle.style.left = edgeOffset;
            handle.style.top = "50%";
            handle.style.transform = "translateY(-50%)";
            break;
        }

        handle.addEventListener("mousedown", (startEvent) => {
          startEvent.preventDefault();
          startEvent.stopPropagation();

          const rect = img.getBoundingClientRect();
          const startX = startEvent.clientX;
          const startY = startEvent.clientY;
          const startWidth =
            rect.width || img.offsetWidth || img.naturalWidth || 100;
          const startHeight =
            rect.height || img.offsetHeight || img.naturalHeight || startWidth;
          const aspectRatio = startWidth / (startHeight || 1);
          const minSize = 40;
          const maxSize = 2400;

          img.style.width = `${startWidth}px`;
          img.style.height = `${startHeight}px`;
          img.width = startWidth;
          img.height = startHeight;

          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let nextWidth = startWidth;
            let nextHeight = startHeight;
            let shouldUpdateWidth = false;
            let shouldUpdateHeight = false;

            if (isCorner) {
              const widthCandidate = position.includes("e")
                ? startWidth + deltaX
                : startWidth - deltaX;
              const heightCandidate = position.includes("s")
                ? startHeight + deltaY
                : startHeight - deltaY;

              if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                nextWidth = widthCandidate;
                nextHeight = nextWidth / (aspectRatio || 1);
              } else {
                nextHeight = heightCandidate;
                nextWidth = nextHeight * (aspectRatio || 1);
              }
              shouldUpdateWidth = true;
              shouldUpdateHeight = true;
            } else if (position === "e") {
              nextWidth = startWidth + deltaX;
              shouldUpdateWidth = true;
            } else if (position === "w") {
              nextWidth = startWidth - deltaX;
              shouldUpdateWidth = true;
            } else if (position === "n") {
              nextHeight = startHeight - deltaY;
              shouldUpdateHeight = true;
            } else if (position === "s") {
              nextHeight = startHeight + deltaY;
              shouldUpdateHeight = true;
            }

            nextWidth = Math.min(Math.max(nextWidth, minSize), maxSize);
            nextHeight = Math.min(Math.max(nextHeight, minSize), maxSize);

            const previewWidth = shouldUpdateWidth ? nextWidth : startWidth;
            const previewHeight = shouldUpdateHeight ? nextHeight : startHeight;

            if (shouldUpdateWidth) {
              img.style.width = `${previewWidth}px`;
              img.width = previewWidth;
            }
            if (shouldUpdateHeight) {
              img.style.height = `${previewHeight}px`;
              img.height = previewHeight;
            }

            updateSizeBadge(previewWidth, previewHeight);

            if (typeof getPos === "function") {
              const attrs: Record<string, number | string | undefined> = {};
              if (shouldUpdateWidth) {
                attrs.width = Math.round(previewWidth);
              }
              if (shouldUpdateHeight) {
                attrs.height = Math.round(previewHeight);
              }

              // ✅ CRITICAL FIX: Read description from DOM element, not currentNode
              // This ensures we always get the latest value, even if currentNode is stale
              if (descriptionCaption && descriptionCaption.textContent) {
                attrs.description = descriptionCaption.textContent;
              }

              // Preserve other attributes from currentNode
              const preservedAttrs = [
                "alt",
                "title",
                "textAlign",
                "border",
                "borderColor",
                "data-file-id",
              ];

              preservedAttrs.forEach((attrName) => {
                const value = currentNode.attrs[attrName];
                if (value !== undefined && value !== null && value !== "") {
                  attrs[attrName] = value;
                }
              });

              // 🐛 DEBUG: Log what we're sending to updateAttributes
              console.log("🔍 Resize - Updating attributes:", attrs);
              console.log(
                "🔍 Description from DOM:",
                descriptionCaption?.textContent
              );
              console.log("🔍 Current node attrs:", currentNode.attrs);

              if (Object.keys(attrs).length) {
                editor.commands.updateAttributes("image", attrs);
              }
            }
          };

          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        return handle;
      };

      const handleOrder: HandlePosition[] = [
        "nw",
        "n",
        "ne",
        "e",
        "se",
        "s",
        "sw",
        "w",
      ];

      const handles: Record<HandlePosition, HTMLDivElement> =
        handleOrder.reduce((acc, position) => {
          acc[position] = createHandle(position);
          return acc;
        }, {} as Record<HandlePosition, HTMLDivElement>);

      const showHandles = () => {
        handleOrder.forEach((position) => {
          handles[position].style.display = "block";
        });
        sizeBadge.style.display = "inline-flex";
      };

      const hideHandles = () => {
        handleOrder.forEach((position) => {
          handles[position].style.display = "none";
        });
        sizeBadge.style.display = "none";
      };

      // Click to select
      let isSelected = false;
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof getPos === "function") {
          editor.commands.setNodeSelection(getPos());
          isSelected = true;
          selectionBorder.style.display = "block";
          toolbar.style.display = "flex";
          const { width, height } = getCurrentDimensions();
          updateSizeBadge(width, height);
          showHandles();
        }
      });

      // Deselect on outside click
      const handleOutsideClick = (e: MouseEvent) => {
        if (!container.contains(e.target as Node)) {
          isSelected = false;
          selectionBorder.style.display = "none";
          toolbar.style.display = "none";
          hideHandles();
        }
      };
      document.addEventListener("click", handleOutsideClick);

      // Description caption (if exists)
      let descriptionCaption: HTMLDivElement | null = null;
      if (currentNode.attrs.description) {
        descriptionCaption = document.createElement("div");
        descriptionCaption.className = "image-description";
        descriptionCaption.textContent = currentNode.attrs.description;
        descriptionCaption.style.fontSize = "14px";
        descriptionCaption.style.color = "#6b7280";
        descriptionCaption.style.marginTop = "8px";
        descriptionCaption.style.fontStyle = "italic";
        descriptionCaption.style.textAlign =
          currentNode.attrs.textAlign || "center";
        descriptionCaption.style.padding = "0 4px";
      }

      container.appendChild(selectionBorder);
      container.appendChild(img);
      if (descriptionCaption) {
        container.appendChild(descriptionCaption);
      }
      container.appendChild(sizeBadge);
      container.appendChild(toolbar);
      handleOrder.forEach((position) => {
        container.appendChild(handles[position]);
      });

      return {
        dom: container,
        update(updatedNode) {
          // Only update if it's the same image node type
          if (updatedNode.type.name !== "image") return false;
          currentNode = updatedNode;

          // Update image src, alt, dimensions
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || "";
          img.title = updatedNode.attrs.title || "";

          if (updatedNode.attrs.width) {
            img.width = updatedNode.attrs.width;
            img.style.width = updatedNode.attrs.width + "px";
          }
          if (updatedNode.attrs.height) {
            img.height = updatedNode.attrs.height;
            img.style.height = updatedNode.attrs.height + "px";
          }

          // Update border
          const borderStyle = updatedNode.attrs.border || "none";
          const borderColor = updatedNode.attrs.borderColor || "#d1d5db";
          if (borderStyle === "thin") {
            img.style.border = `1px solid ${borderColor}`;
          } else if (borderStyle === "medium") {
            img.style.border = `2px solid ${borderColor}`;
          } else if (borderStyle === "thick") {
            img.style.border = `4px solid ${borderColor}`;
          } else {
            img.style.border = "none";
          }

          // Phase 2.1 & 2.2: Update rotation and mirror
          const rotation = updatedNode.attrs.rotation || 0;
          const flipH = updatedNode.attrs.flipH || false;
          const flipV = updatedNode.attrs.flipV || false;

          const transforms = [];
          if (rotation !== 0) {
            transforms.push(`rotate(${rotation}deg)`);
          }
          if (flipH || flipV) {
            transforms.push(`scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`);
          }
          if (transforms.length > 0) {
            img.style.transform = transforms.join(" ");
          } else {
            img.style.transform = "";
          }

          // Update description caption
          if (descriptionCaption) {
            if (updatedNode.attrs.description) {
              descriptionCaption.textContent = updatedNode.attrs.description;
              descriptionCaption.style.display = "block";
            } else {
              descriptionCaption.style.display = "none";
            }
          } else if (updatedNode.attrs.description) {
            // Create caption if it doesn't exist
            descriptionCaption = document.createElement("div");
            descriptionCaption.className = "image-description";
            descriptionCaption.textContent = updatedNode.attrs.description;
            descriptionCaption.style.fontSize = "14px";
            descriptionCaption.style.color = "#6b7280";
            descriptionCaption.style.marginTop = "8px";
            descriptionCaption.style.fontStyle = "italic";
            descriptionCaption.style.textAlign =
              updatedNode.attrs.textAlign || "center";
            descriptionCaption.style.padding = "0 4px";
            container.insertBefore(descriptionCaption, toolbar);
          }

          // Update alignment
          container.style.textAlign = updatedNode.attrs.textAlign || "center";
          if (descriptionCaption) {
            descriptionCaption.style.textAlign =
              updatedNode.attrs.textAlign || "center";
          }

          const latestWidth =
            updatedNode.attrs.width || img.offsetWidth || img.naturalWidth || 0;
          const latestHeight =
            updatedNode.attrs.height ||
            img.offsetHeight ||
            img.naturalHeight ||
            0;
          updateSizeBadge(latestWidth, latestHeight);

          return true;
        },
        destroy() {
          document.removeEventListener("click", handleOutsideClick);
        },
      };
    };
  },
});

// Phase 3.1: Custom Blockquote Extension with Styles and Colors
const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: "classic",
        parseHTML: (element) => element.getAttribute("data-style") || "classic",
        renderHTML: (attributes) => {
          return { "data-style": attributes.style };
        },
      },
      color: {
        default: "#4F46E5",
        parseHTML: (element) => element.getAttribute("data-color") || "#4F46E5",
        renderHTML: (attributes) => {
          return { "data-color": attributes.color };
        },
      },
      icon: {
        default: "💡",
        parseHTML: (element) => element.getAttribute("data-icon") || "💡",
        renderHTML: (attributes) => {
          return { "data-icon": attributes.icon };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "blockquote",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `blockquote-${HTMLAttributes["data-style"] || "classic"}`,
        style: `--blockquote-color: ${
          HTMLAttributes["data-color"] || "#4F46E5"
        }`,
      }),
      0,
    ];
  },
});

// Phase 3.2: Custom Horizontal Rule Extension with Styles
const CustomHorizontalRule = HorizontalRule.extend({
  addAttributes() {
    return {
      style: {
        default: "solid",
        parseHTML: (element) => element.getAttribute("data-style") || "solid",
        renderHTML: (attributes) => {
          return { "data-style": attributes.style };
        },
      },
      color: {
        default: "#e5e7eb",
        parseHTML: (element) => element.getAttribute("data-color") || "#e5e7eb",
        renderHTML: (attributes) => {
          return { "data-color": attributes.color };
        },
      },
      thickness: {
        default: "medium",
        parseHTML: (element) =>
          element.getAttribute("data-thickness") || "medium",
        renderHTML: (attributes) => {
          return { "data-thickness": attributes.thickness };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "hr",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `hr-${HTMLAttributes["data-style"] || "solid"} hr-thickness-${
          HTMLAttributes["data-thickness"] || "medium"
        }`,
        style: `--hr-color: ${HTMLAttributes["data-color"] || "#e5e7eb"}`,
      }),
    ];
  },
});

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Type here...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const [showMathLive, setShowMathLive] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [editingImageData, setEditingImageData] = useState<any>(null);
  const wasMathLiveOpen = useRef(false);

  // Phase 3.2: Horizontal Rule state
  const [hrStyle, setHrStyle] = useState("solid");
  const [hrThickness, setHrThickness] = useState("medium");
  const [hrColor, setHrColor] = useState("#e5e7eb");

  const editor = useEditor({
    immediatelyRender: false, // ✅ Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (we use lowlight)
        underline: false, // Avoid duplicate underline extension
        blockquote: false, // Disable default blockquote (we use custom)
        horizontalRule: false, // Disable default horizontal rule (we use custom)
      }),
      CustomBlockquote, // Phase 3.1: Custom blockquote with styles
      CustomHorizontalRule, // Phase 3.2: Custom horizontal rule with styles
      Mathematics.configure({
        // ✅ Configure inline and block math nodes
        inlineOptions: {
          HTMLAttributes: {
            class: "math-inline",
          },
        },
        blockOptions: {
          HTMLAttributes: {
            class: "math-block",
          },
        },
        katexOptions: {
          throwOnError: false, // Don't throw on LaTeX errors
        },
      }),
      ResizableImage, // ✅ Custom resizable image with delete support
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      // Phase 1: Text Color & Highlight
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      // Phase 1: Subscript & Superscript
      Subscript,
      Superscript,
      // Phase 1: Code Blocks with Syntax Highlighting
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      // Phase 1: Tables
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      // Phase 3: Link
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300",
        },
      }),
      // Phase 3: Font Family
      FontFamily.configure({
        types: ["textStyle"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) {
      wasMathLiveOpen.current = showMathLive;
      return;
    }

    if (!showMathLive && wasMathLiveOpen.current) {
      const timer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          editor.commands.focus("end");
        });
      }, 0);
      wasMathLiveOpen.current = false;

      return () => window.clearTimeout(timer);
    }

    wasMathLiveOpen.current = showMathLive;
  }, [showMathLive, editor]);

  // Set up global callback for image editing (called from ResizableImage extension)
  useEffect(() => {
    (window as any).__triggerImageEdit = () => {
      const imageData = (window as any).__editImageData;
      if (imageData) {
        setEditingImageData(imageData);
        setShowImageDialog(true);
        // Clear the data
        (window as any).__editImageData = null;
      }
    };

    return () => {
      (window as any).__triggerImageEdit = null;
      (window as any).__editImageData = null;
    };
  }, []);

  if (!editor) {
    return null;
  }

  const insertMathNode = (rawLatex: string) => {
    if (!editor) return;

    const latex = rawLatex.trim();
    if (!latex) return;

    const shouldUseBlock = latex.includes("\n") || latex.startsWith("\\begin");

    if (shouldUseBlock) {
      const inserted = editor.chain().focus().insertBlockMath({ latex }).run();
      if (!inserted) {
        editor.chain().focus().insertInlineMath({ latex }).run();
      }
    } else {
      editor.chain().focus().insertInlineMath({ latex }).run();
    }
  };

  const addMath = () => {
    const latex = prompt(
      "Enter LaTeX equation:\n\nExamples:\n- E = mc^2\n- \\frac{a}{b}\n- \\sqrt{x}\n- \\int_{0}^{\\infty} x^2 dx\n- \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}"
    );
    if (latex) {
      insertMathNode(latex);
    }
  };

  const handleImageInsert = (props: ImageProperties) => {
    if (!editor) return;

    // Check if we're editing an existing image
    if (editingImageData && editingImageData.pos !== null) {
      // Update existing image
      editor
        .chain()
        .focus()
        .setNodeSelection(editingImageData.pos)
        .updateAttributes("image", {
          src: props.url,
          alt: props.alt,
          title: props.alt,
          description: props.description,
          width: props.width,
          height: props.height,
          textAlign: props.alignment,
          border: props.border,
          borderColor: props.borderColor,
          "data-file-id": props.fileId,
        })
        .run();

      // Clear editing state
      setEditingImageData(null);
    } else {
      // Insert new image
      editor
        .chain()
        .focus()
        .setImage({
          src: props.url,
          alt: props.alt,
          title: props.alt,
          description: props.description,
          width: props.width,
          height: props.height,
          textAlign: props.alignment,
          border: props.border,
          borderColor: props.borderColor,
          "data-file-id": props.fileId,
        })
        .run();

      // Apply alignment if specified
      if (props.alignment && props.alignment !== "left") {
        editor.chain().focus().setTextAlign(props.alignment).run();
      }
    }
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const handleMathLiveInsert = (latex: string) => {
    insertMathNode(latex);
    setShowMathLive(false);
  };

  // Color presets
  const textColors = [
    "#000000",
    "#374151",
    "#DC2626",
    "#EA580C",
    "#D97706",
    "#CA8A04",
    "#65A30D",
    "#16A34A",
    "#059669",
    "#0891B2",
    "#0284C7",
    "#2563EB",
    "#4F46E5",
    "#7C3AED",
    "#C026D3",
    "#DB2777",
  ];

  const highlightColors = [
    "#FEF3C7",
    "#FED7AA",
    "#FECACA",
    "#E9D5FF",
    "#DBEAFE",
    "#D1FAE5",
  ];

  const fontSizes = [
    { label: "Small", value: "12px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "Huge", value: "24px" },
  ];

  return (
    <div className="border rounded-lg dark:border-slate-700 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={
            editor.isActive("bold") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={
            editor.isActive("italic") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={
            editor.isActive("underline") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1">
              <Palette className="h-4 w-4" />
              <div
                className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
                style={{
                  backgroundColor:
                    editor.getAttributes("textStyle").color || "#000000",
                }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Text Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Remove Color
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="gap-1">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Highlight</Label>
              <div className="grid grid-cols-6 gap-2">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor.chain().focus().toggleHighlight({ color }).run()
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Remove Highlight
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Size</Label>
              {fontSizes.map((size) => (
                <Button
                  key={size.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .setMark("textStyle", { fontSize: size.value })
                      .run()
                  }
                >
                  {size.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Phase 3.5: Font Family */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Font Family">
              <Type className="h-4 w-4 mr-1" />
              Font
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Font Family</Label>
              {[
                { label: "Default", value: "" },
                { label: "Serif", value: "serif" },
                { label: "Monospace", value: "monospace" },
                { label: "Cursive", value: "cursive" },
              ].map((font) => (
                <Button
                  key={font.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (font.value) {
                      editor.chain().focus().setFontFamily(font.value).run();
                    } else {
                      editor.chain().focus().unsetFontFamily().run();
                    }
                  }}
                >
                  <span style={{ fontFamily: font.value || "inherit" }}>
                    {font.label}
                  </span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Phase 3.6: Heading Levels */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Heading">
              <Heading className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Heading</Label>
              {[
                { label: "Normal", level: 0 },
                { label: "Heading 1", level: 1 },
                { label: "Heading 2", level: 2 },
                { label: "Heading 3", level: 3 },
                { label: "Heading 4", level: 4 },
                { label: "Heading 5", level: 5 },
                { label: "Heading 6", level: 6 },
              ].map((heading) => (
                <Button
                  key={heading.level}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    if (heading.level === 0) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: heading.level as any })
                        .run();
                    }
                  }}
                >
                  {heading.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Subscript & Superscript */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={
            editor.isActive("subscript") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
        >
          <SubscriptIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={
            editor.isActive("superscript")
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <SuperscriptIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            editor.isActive("bulletList")
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            editor.isActive("orderedList")
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Phase 3.1: Blockquote with Styles and Preset Themes */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                editor.isActive("blockquote")
                  ? "bg-slate-200 dark:bg-slate-700"
                  : ""
              }
            >
              <Quote className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Blockquote Style</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: "classic", label: "Classic", icon: "📝" },
                    { value: "modern", label: "Modern", icon: "✨" },
                    { value: "minimal", label: "Minimal", icon: "▫️" },
                    { value: "callout", label: "Callout", icon: "💡" },
                    { value: "quote", label: "Quote", icon: "💬" },
                    { value: "highlight", label: "Highlight", icon: "🎨" },
                  ].map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`justify-start ${
                        editor.getAttributes("blockquote").style === style.value
                          ? "bg-violet-100 dark:bg-violet-900 border-violet-500"
                          : ""
                      }`}
                      onClick={() => {
                        if (editor.isActive("blockquote")) {
                          editor
                            .chain()
                            .focus()
                            .updateAttributes("blockquote", {
                              style: style.value,
                            })
                            .run();
                        } else {
                          editor
                            .chain()
                            .focus()
                            .toggleBlockquote()
                            .updateAttributes("blockquote", {
                              style: style.value,
                            })
                            .run();
                        }
                      }}
                    >
                      <span className="mr-2">{style.icon}</span>
                      {style.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Color Theme</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    {
                      name: "Default",
                      icon: "🔵",
                      color: "#4f46e5",
                      emoji: "💡",
                      isCallout: false,
                    },
                    {
                      name: "Success",
                      icon: "✅",
                      color: "#10b981",
                      emoji: "✅",
                      isCallout: true,
                    },
                    {
                      name: "Warning",
                      icon: "⚠️",
                      color: "#f59e0b",
                      emoji: "⚠️",
                      isCallout: true,
                    },
                    {
                      name: "Error",
                      icon: "❌",
                      color: "#ef4444",
                      emoji: "❌",
                      isCallout: true,
                    },
                    {
                      name: "Info",
                      icon: "ℹ️",
                      color: "#3b82f6",
                      emoji: "ℹ️",
                      isCallout: true,
                    },
                  ].map((theme) => (
                    <Button
                      key={theme.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`justify-start ${
                        editor.getAttributes("blockquote").color === theme.color
                          ? "ring-2 ring-offset-2"
                          : ""
                      }`}
                      style={{
                        borderColor: theme.color,
                        color:
                          editor.getAttributes("blockquote").color ===
                          theme.color
                            ? theme.color
                            : undefined,
                      }}
                      onClick={() => {
                        if (editor.isActive("blockquote")) {
                          // Update existing blockquote
                          const updates: any = { color: theme.color };
                          if (theme.isCallout) {
                            updates.style = "callout";
                            updates.icon = theme.emoji;
                          }
                          editor
                            .chain()
                            .focus()
                            .updateAttributes("blockquote", updates)
                            .run();
                        } else {
                          // Create new blockquote
                          const attrs: any = { color: theme.color };
                          if (theme.isCallout) {
                            attrs.style = "callout";
                            attrs.icon = theme.emoji;
                          }
                          editor
                            .chain()
                            .focus()
                            .toggleBlockquote()
                            .updateAttributes("blockquote", attrs)
                            .run();
                        }
                      }}
                    >
                      <span className="mr-1">{theme.icon}</span>
                      <span className="text-xs">{theme.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Custom Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={
                      editor.getAttributes("blockquote").color || "#4f46e5"
                    }
                    onChange={(e) => {
                      if (editor.isActive("blockquote")) {
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("blockquote", {
                            color: e.target.value,
                          })
                          .run();
                      }
                    }}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={
                      editor.getAttributes("blockquote").color || "#4f46e5"
                    }
                    onChange={(e) => {
                      if (editor.isActive("blockquote")) {
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("blockquote", {
                            color: e.target.value,
                          })
                          .run();
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border rounded font-mono dark:bg-slate-800"
                    placeholder="#4f46e5"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click color box or enter hex code
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (editor.isActive("blockquote")) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                }}
              >
                Remove Blockquote
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Phase 3.3: Indent/Outdent (for lists) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
          title="Indent (Tab)"
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
          title="Outdent (Shift+Tab)"
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={
            editor.isActive({ textAlign: "left" })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={
            editor.isActive({ textAlign: "right" })
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Code Block */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={
            editor.isActive("codeBlock") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Table */}
        <Button type="button" variant="ghost" size="sm" onClick={insertTable}>
          <TableIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Phase 3.1: Blockquote */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            editor.isActive("blockquote")
              ? "bg-slate-200 dark:bg-slate-700"
              : ""
          }
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* Phase 3.2: Horizontal Rule with Styles */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                editor.isActive("horizontalRule")
                  ? "bg-slate-200 dark:bg-slate-700"
                  : ""
              }
              title="Horizontal Rule"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  Horizontal Rule Style
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: "solid", label: "Solid", icon: "━" },
                    { value: "dashed", label: "Dashed", icon: "╌" },
                    { value: "dotted", label: "Dotted", icon: "┄" },
                    { value: "double", label: "Double", icon: "═" },
                    { value: "gradient", label: "Gradient", icon: "▬" },
                    { value: "decorative", label: "Decorative", icon: "✦" },
                  ].map((style) => (
                    <Button
                      key={style.value}
                      type="button"
                      variant={hrStyle === style.value ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setHrStyle(style.value)}
                    >
                      <span className="mr-2 text-lg">{style.icon}</span>
                      <span className="text-xs">{style.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Thickness</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: "thin", label: "Thin" },
                    { value: "medium", label: "Medium" },
                    { value: "thick", label: "Thick" },
                  ].map((thickness) => (
                    <Button
                      key={thickness.value}
                      type="button"
                      variant={
                        hrThickness === thickness.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setHrThickness(thickness.value)}
                    >
                      <span className="text-xs">{thickness.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Color Theme</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { name: "Gray", color: "#e5e7eb" },
                    { name: "Blue", color: "#3b82f6" },
                    { name: "Green", color: "#10b981" },
                    { name: "Orange", color: "#f59e0b" },
                    { name: "Red", color: "#ef4444" },
                    { name: "Purple", color: "#a855f7" },
                  ].map((theme) => (
                    <Button
                      key={theme.name}
                      type="button"
                      variant={hrColor === theme.color ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setHrColor(theme.color)}
                    >
                      <div
                        className="w-4 h-4 rounded mr-2 border"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Custom Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={hrColor}
                    onChange={(e) => setHrColor(e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hrColor}
                    onChange={(e) => setHrColor(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded font-mono dark:bg-slate-800"
                    placeholder="#e5e7eb"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click color box or enter hex code
                </p>
              </div>

              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-medium"
                onClick={() => {
                  // Insert HR with custom attributes using insertContent
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "horizontalRule",
                      attrs: {
                        style: hrStyle,
                        thickness: hrThickness,
                        color: hrColor,
                      },
                    })
                    .run();
                }}
              >
                <Minus className="h-4 w-4 mr-2" />
                Insert Horizontal Rule
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Phase 3.4: Link */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={
            editor.isActive("link") ? "bg-slate-200 dark:bg-slate-700" : ""
          }
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Math (LaTeX Prompt) */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={addMath}
          title="Insert LaTeX (Prompt)"
        >
          <Sigma className="h-4 w-4 mr-1" />
          LaTeX
        </Button>

        {/* Math (MathLive Visual Editor) */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setShowMathLive(true)}
          title="Insert Math (Visual Editor)"
        >
          <Sigma className="h-4 w-4 mr-1" />
          Math
        </Button>

        {/* Image - Enhanced with File Upload */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => setShowImageDialog(true)}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Image
        </Button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose dark:prose-invert max-w-none p-4"
        style={{ minHeight }}
      />

      {/* MathLive Modal */}
      <MathLiveModal
        open={showMathLive}
        onClose={() => setShowMathLive(false)}
        onInsert={handleMathLiveInsert}
      />

      {/* Image Properties Dialog - Enhanced File Upload */}
      <ImagePropertiesDialog
        open={showImageDialog}
        onClose={() => {
          setShowImageDialog(false);
          setEditingImageData(null);
        }}
        onInsert={handleImageInsert}
        isEditMode={!!editingImageData}
        category="question_image"
        entityType="question"
        entityId="temp"
        initialUrl={editingImageData?.src || ""}
        initialAlt={editingImageData?.alt || ""}
        initialDescription={editingImageData?.description || ""}
        initialWidth={editingImageData?.width}
        initialHeight={editingImageData?.height}
        initialAlignment={editingImageData?.textAlign || "center"}
        initialBorder={editingImageData?.border || "none"}
        initialBorderColor={editingImageData?.borderColor || "#d1d5db"}
      />
    </div>
  );
}
