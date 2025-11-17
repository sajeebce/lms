"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { useReducer } from "react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { TaskList, TaskItem } from "@tiptap/extension-list";
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
import { Table, TableView } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import Link from "@tiptap/extension-link";
import { FontFamily } from "@tiptap/extension-font-family";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Extension, Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/core";
import type { Level } from "@tiptap/extension-heading";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { CustomAudioPlayer } from "@/components/ui/custom-audio-player";
import "katex/dist/katex.min.css"; // ✅ KaTeX CSS for math rendering
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  ChevronDown,
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
  SlidersHorizontal,
  Trash2,
  Mic,
  Maximize2,
  Minimize2,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MathLiveModal from "./mathlive-modal";
import {
  ImagePropertiesDialog,
  type ImageProperties,
} from "@/components/ui/image-properties-dialog";
import { LinkDialog } from "@/components/ui/link-dialog";
import { InsertHTMLModal } from "@/components/ui/insert-html-modal";
import { HTMLBlock } from "@/components/editor/html-block-extension";
import { FontFamilySelector } from "@/components/ui/font-family-selector";
import { TableGridSelector } from "./table-grid-selector"; // Phase 4.1: Modern table grid selector
import { TableBubbleMenu } from "./table-bubble-menu"; // Phase 4.2: Floating table toolbar
import { AudioRecorderDialog } from "@/components/ui/audio-recorder-dialog"; // Phase 5.1: Audio recording

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

// ✅ Phase 5.1: Audio NodeView Component
const AudioNodeView = (props: any) => {
  const { node } = props;
  const { src, fileName, allowDownload } = node.attrs;

  return (
    <NodeViewWrapper className="audio-wrapper">
      <CustomAudioPlayer
        src={src}
        fileName={fileName || "audio.webm"}
        allowDownload={allowDownload !== false}
      />
    </NodeViewWrapper>
  );
};

// Phase 5.1: Custom Audio Node (NOT Extension - needs to be a Node to insert content)
const Audio = Node.create({
  name: "audio",

  group: "block", // ✅ Block-level node (like image, not inline)

  atom: true, // ✅ Atomic node (cannot be split)

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      fileName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-file-name"),
        renderHTML: (attributes) => {
          if (!attributes.fileName) return {};
          return { "data-file-name": attributes.fileName };
        },
      },
      duration: {
        default: 0,
        parseHTML: (element) => {
          const duration = element.getAttribute("data-duration");
          return duration ? parseInt(duration, 10) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.duration) return {};
          return { "data-duration": attributes.duration };
        },
      },
      fileSize: {
        default: 0,
        parseHTML: (element) => {
          const size = element.getAttribute("data-file-size");
          return size ? parseInt(size, 10) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.fileSize) return {};
          return { "data-file-size": attributes.fileSize };
        },
      },
      allowDownload: {
        default: true,
        parseHTML: (element) => {
          const allow = element.getAttribute("data-allow-download");
          return allow === "false" ? false : true;
        },
        renderHTML: (attributes) => {
          return {
            "data-allow-download": attributes.allowDownload ? "true" : "false",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.audio-wrapper",
        getAttrs: (element) => {
          const allowDownloadStr = (element as HTMLElement).getAttribute(
            "data-allow-download"
          );
          return {
            src: (element as HTMLElement).getAttribute("data-src"),
            fileName: (element as HTMLElement).getAttribute("data-file-name"),
            duration: parseInt(
              (element as HTMLElement).getAttribute("data-duration") || "0",
              10
            ),
            fileSize: parseInt(
              (element as HTMLElement).getAttribute("data-file-size") || "0",
              10
            ),
            allowDownload: allowDownloadStr === "false" ? false : true,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const allowDownload = HTMLAttributes.allowDownload !== false;

    return [
      "div",
      {
        class: "audio-wrapper",
        "data-src": HTMLAttributes.src,
        "data-file-name": HTMLAttributes.fileName || "Audio",
        "data-duration": (HTMLAttributes.duration || 0).toString(),
        "data-file-size": (HTMLAttributes.fileSize || 0).toString(),
        "data-allow-download": allowDownload ? "true" : "false",
      },
    ];
  },

  addCommands() {
    return {
      setAudio:
        (options: {
          src: string;
          fileName: string;
          duration: number;
          fileSize: number;
          allowDownload?: boolean;
        }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              allowDownload: options.allowDownload !== false, // Default true
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
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

// Phase 3.6: Heading Keyboard Shortcuts Extension
const HeadingShortcuts = Extension.create({
  name: "headingShortcuts",

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-0": () => this.editor.commands.setParagraph(),
      "Mod-Alt-1": () =>
        this.editor.commands.toggleHeading({ level: 1 as Level }),
      "Mod-Alt-2": () =>
        this.editor.commands.toggleHeading({ level: 2 as Level }),
      "Mod-Alt-3": () =>
        this.editor.commands.toggleHeading({ level: 3 as Level }),
      "Mod-Alt-4": () =>
        this.editor.commands.toggleHeading({ level: 4 as Level }),
      "Mod-Alt-5": () =>
        this.editor.commands.toggleHeading({ level: 5 as Level }),
      "Mod-Alt-6": () =>
        this.editor.commands.toggleHeading({ level: 6 as Level }),
    };
  },
});

// Phase 3.3: Custom Indent Extension for Paragraphs, Headings, and Lists
const CustomIndent = Extension.create({
  name: "customIndent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "listItem"],
      minLevel: 0,
      maxLevel: 8,
      indentSize: 40, // 40px per level
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indent = element.getAttribute("data-indent");
              return indent ? parseInt(indent, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                "data-indent": attributes.indent,
                style: `padding-left: ${
                  attributes.indent * this.options.indentSize
                }px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Check if we're in a list
          const isInList =
            editor.isActive("bulletList") || editor.isActive("orderedList");

          if (isInList) {
            // Use default list indent behavior
            return editor.commands.sinkListItem("listItem");
          }

          // For paragraphs and headings
          let updated = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent + 1,
                  });
                }
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },

      outdent:
        () =>
        ({ tr, state, dispatch, editor }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Check if we're in a list
          const isInList =
            editor.isActive("bulletList") || editor.isActive("orderedList");

          if (isInList) {
            // Use default list outdent behavior
            return editor.commands.liftListItem("listItem");
          }

          // For paragraphs and headings
          let updated = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                if (dispatch) {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: currentIndent - 1,
                  });
                }
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    };
  },
});

// Custom list item to sync bullet/number size & color with text
const CustomListItem = ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font-size") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return {
            "data-font-size": attributes.fontSize,
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
      textColor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-text-color") || null,
        renderHTML: (attributes) => {
          if (!attributes.textColor) return {};
          return {
            "data-text-color": attributes.textColor,
            style: `color: ${attributes.textColor}`,
          };
        },
      },
      markerBold: {
        default: false,
        parseHTML: (element) =>
          element.getAttribute("data-marker-bold") === "true",
        renderHTML: (attributes) => {
          if (!attributes.markerBold) return {};
          return {
            "data-marker-bold": "true",
          };
        },
      },
    };
  },
});

// Custom task item so checkbox + text follow font size & color
const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font-size") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return {
            "data-font-size": attributes.fontSize,
            // Don't set inline style - let CSS handle it via data attribute
          };
        },
      },
      textColor: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-text-color") || null,
        renderHTML: (attributes) => {
          if (!attributes.textColor) return {};
          return {
            "data-text-color": attributes.textColor,
            // Don't set inline style - let CSS handle it via data attribute
          };
        },
      },
    };
  },
});

// Phase 1: Custom Bullet & Ordered List with styles
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bulletStyle: {
        default: "disc",
        parseHTML: (element) =>
          element.getAttribute("data-bullet-style") || "disc",
        renderHTML: (attributes) => {
          return {
            "data-bullet-style": attributes.bulletStyle || "disc",
          };
        },
      },
    };
  },
});

const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      numStyle: {
        default: "decimal",
        parseHTML: (element) =>
          element.getAttribute("data-num-style") || "decimal",
        renderHTML: (attributes) => {
          return {
            "data-num-style": attributes.numStyle || "decimal",
          };
        },
      },
    };
  },
});

// Sync ordered list marker boldness when the entire list item text is bold
const ListItemMarkerBoldSync = Extension.create({
  name: "listItemMarkerBoldSync",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("listItemMarkerBoldSync"),
        appendTransaction(transactions, _oldState, newState) {
          // Only run when the document actually changed
          if (!transactions.some((tr) => tr.docChanged)) {
            return;
          }

          const boldMark = newState.schema.marks.bold;
          const listItemType = newState.schema.nodes.listItem;

          if (!boldMark || !listItemType) {
            return;
          }

          let tr = null;

          newState.doc.descendants((node, pos) => {
            if (node.type !== listItemType) {
              return;
            }

            let hasText = false;
            let fullyBold = true;

            node.descendants((child) => {
              if (!child.isText) {
                return;
              }

              const text = child.text || "";
              if (text.trim().length === 0) {
                return;
              }

              hasText = true;
              const hasBold = child.marks.some(
                (mark) => mark.type === boldMark
              );
              if (!hasBold) {
                fullyBold = false;
              }
            });

            const shouldMarkerBeBold = hasText && fullyBold;
            const currentMarkerBold = !!node.attrs.markerBold;

            if (shouldMarkerBeBold !== currentMarkerBold) {
              if (!tr) {
                tr = newState.tr;
              }

              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                markerBold: shouldMarkerBeBold,
              });
            }
          });

          if (tr && tr.docChanged) {
            return tr;
          }

          return;
        },
      }),
    ];
  },
});

// Keep task list checkbox size in sync with text font size
const TaskItemFontSizeSync = Extension.create({
  name: "taskItemFontSizeSync",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("taskItemFontSizeSync"),
        appendTransaction(transactions, _oldState, newState) {
          // Only run when the document actually changed
          if (!transactions.some((tr) => tr.docChanged)) {
            return;
          }

          const textStyleMark = newState.schema.marks.textStyle;
          const taskItemType = newState.schema.nodes.taskItem;
          const taskListType = newState.schema.nodes.taskList;

          if (!textStyleMark || !taskItemType) {
            return;
          }

          let tr = null;

          // Walk the document with parent + index info so we can inherit font size
          newState.doc.nodesBetween(
            0,
            newState.doc.content.size,
            (node, pos, parent, index) => {
              if (node.type !== taskItemType) {
                return;
              }

              let fontSizeFromText: string | null = null;

              node.descendants((child) => {
                if (!child.isText) {
                  return;
                }

                const text = child.text || "";
                if (text.trim().length === 0) {
                  return;
                }

                const textStyle = child.marks.find(
                  (mark) => mark.type === textStyleMark
                );

                if (textStyle && typeof textStyle.attrs.fontSize === "string") {
                  fontSizeFromText = textStyle.attrs.fontSize;
                }
              });

              // If no explicit font size from text, try inheriting from previous task item sibling
              let inheritedFontSize: string | null = null;

              if (
                !fontSizeFromText &&
                parent &&
                taskListType &&
                parent.type === taskListType &&
                typeof index === "number" &&
                index > 0
              ) {
                const prevSibling = parent.child(index - 1);
                if (
                  prevSibling.type === taskItemType &&
                  typeof prevSibling.attrs.fontSize === "string"
                ) {
                  inheritedFontSize = prevSibling.attrs.fontSize;
                }
              }

              const targetFontSize = fontSizeFromText || inheritedFontSize;

              const currentFontSize =
                typeof node.attrs.fontSize === "string"
                  ? node.attrs.fontSize
                  : null;

              // Only update when value actually changed
              if (targetFontSize !== currentFontSize) {
                if (!tr) {
                  tr = newState.tr;
                }

                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  fontSize: targetFontSize,
                });
              }
            }
          );

          if (tr && tr.docChanged) {
            return tr;
          }

          return;
        },
      }),
    ];
  },
});

function syncTaskItemFontSize(editor: TiptapEditor | null, fontSize: string) {
  if (!editor) {
    return;
  }

  const { state } = editor;
  const { doc, selection, schema } = state;
  const taskItemType = schema.nodes.taskItem;

  if (!taskItemType) {
    return;
  }

  const tr = state.tr;

  if (selection.empty) {
    const $from = selection.$from;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth);
      if (node.type === taskItemType) {
        const pos = $from.before(depth);
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          fontSize,
        });
        break;
      }
    }
  } else {
    const { from, to } = selection;

    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === taskItemType) {
        // Update task item node attribute so checkbox follows text size
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          fontSize,
        });
      }
    });
  }

  if (tr.docChanged) {
    editor.view.dispatch(tr);
  }
}

// Phase 3.7: Line Height controls for paragraphs and headings
const LineHeight = Extension.create({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => {
              const dataValue = element.getAttribute("data-line-height");
              if (dataValue) {
                return dataValue;
              }

              const styleValue = element.style.lineHeight;
              return styleValue || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }

              return {
                "data-line-height": attributes.lineHeight,
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
});

// Phase 3.8: Text Direction (RTL/LTR) support with attribute preservation
const TextDirection = Extension.create({
  name: "textDirection",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute("dir") || null,
            renderHTML: (attributes) => {
              if (!attributes.dir) {
                return {};
              }
              return {
                dir: attributes.dir,
                style: `direction: ${attributes.dir}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: "ltr" | "rtl" | null) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let updated = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) {
              return;
            }

            const currentValue = node.attrs.dir ?? null;
            if (currentValue === direction) {
              return;
            }

            // ✅ Preserve ALL existing attributes
            const nextAttrs = { ...node.attrs };
            if (direction === null) {
              delete nextAttrs.dir;
            } else {
              nextAttrs.dir = direction;
            }

            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, nextAttrs);
            }
            updated = true;
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },
    };
  },
});

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showIndentGuides?: boolean; // Phase 3.3: Optional indent guide styling (default: true)
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Type here...",
  minHeight = "200px",
  showIndentGuides: showIndentGuidesProp,
}: RichTextEditorProps) {
  // Phase 3.3: Indent guides toggle with localStorage persistence
  const [showIndentGuides, setShowIndentGuides] = useState(() => {
    if (showIndentGuidesProp !== undefined) return showIndentGuidesProp;
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("tiptap-indent-guides");
    return saved !== "false"; // Default: true
  });
  const [showMathLive, setShowMathLive] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [editingImageData, setEditingImageData] = useState<any>(null);
  const wasMathLiveOpen = useRef(false);

  // Phase 3.4: Link Dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(true);

  // Phase 5.1: Audio Recorder Dialog state
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // Insert HTML Dialog state
  const [showInsertHTML, setShowInsertHTML] = useState(false);

  // Phase 5.2: Fullscreen Mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Phase 5.3: Word Count state
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Active Tools Breadcrumb state
  const [activeTools, setActiveTools] = useState<string[]>([]);

  // Resize functionality state
  const [editorHeight, setEditorHeight] = useState<number>(
    parseInt(minHeight) || 200
  );
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Fix: Force re-render when editor selection/active state changes
  // This ensures toolbar buttons show active state immediately on click
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // Phase 3.2: Horizontal Rule state
  const [hrStyle, setHrStyle] = useState("solid");
  const [hrThickness, setHrThickness] = useState("medium");
  const [hrColor, setHrColor] = useState("#e5e7eb");

  // Text color popover state (used for palette + custom color before apply)
  const [pendingTextColor, setPendingTextColor] = useState("#000000");

  // Highlight popover state (used for palette + custom color before apply)
  // Note: we can't reference `highlightColors` here because it's declared later
  // in the component body (would cause a runtime "Temporal Dead Zone" error).
  // So we use the default literal and only reference `highlightColors` inside
  // event handlers defined after the presets.
  const [pendingHighlightColor, setPendingHighlightColor] = useState("#FEF3C7");

  // Phase 3.3: Save indent guides preference to localStorage
  useEffect(() => {
    if (showIndentGuidesProp === undefined && typeof window !== "undefined") {
      localStorage.setItem("tiptap-indent-guides", String(showIndentGuides));
    }
  }, [showIndentGuides, showIndentGuidesProp]);

  // Phase 5.2: Fullscreen keyboard shortcuts (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key exits fullscreen
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
      // F11 toggles fullscreen (optional)
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when fullscreen
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const editor = useEditor({
    immediatelyRender: false, // ✅ Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (we use lowlight)
        underline: false, // Avoid duplicate underline extension
        blockquote: false, // Disable default blockquote (we use custom)
        horizontalRule: false, // Disable default horizontal rule (we use custom)
        bulletList: false, // Disable default bullet list (we use custom)
        orderedList: false, // Disable default ordered list (we use custom)
        listItem: false, // Disable default list item (we use custom)
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      CustomBlockquote, // Phase 3.1: Custom blockquote with styles
      CustomHorizontalRule, // Phase 3.2: Custom horizontal rule with styles
      CustomIndent, // Phase 3.3: Custom indent/outdent for paragraphs and headings
      CustomListItem, // Custom list item so bullets/numbers follow text size & color
      CustomBulletList, // Phase 1: Custom bullet list styles
      CustomOrderedList, // Phase 1: Custom ordered list styles
      TaskList, // Phase 2: Task list with interactive checkboxes
      CustomTaskItem.configure({
        nested: true,
      }),
      ListItemMarkerBoldSync, // Keep ordered list marker boldness in sync with full-line bold
      TaskItemFontSizeSync, // Keep task list checkbox size in sync with font size
      LineHeight, // Phase 3.7: Line height controls
      TextDirection, // Phase 3.8: RTL/LTR text direction controls
      HeadingShortcuts, // Phase 3.6: Keyboard shortcuts for headings (Ctrl+Alt+1-6)
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
      // Phase 3.8: Extended TextAlign to preserve dir attribute
      TextAlign.extend({
        addCommands() {
          return {
            setTextAlign:
              (alignment: string) =>
              ({ commands, tr, state, dispatch }) => {
                const { from, to } = state.selection;
                let updated = false;

                state.doc.nodesBetween(from, to, (node, pos) => {
                  if (
                    !["heading", "paragraph", "image"].includes(node.type.name)
                  ) {
                    return;
                  }

                  // ✅ Preserve ALL existing attributes including dir
                  const nextAttrs = { ...node.attrs };
                  nextAttrs.textAlign = alignment;

                  if (dispatch) {
                    tr.setNodeMarkup(pos, undefined, nextAttrs);
                  }
                  updated = true;
                });

                if (updated && dispatch) {
                  dispatch(tr);
                }

                return updated;
              },
            unsetTextAlign:
              () =>
              ({ commands, tr, state, dispatch }) => {
                const { from, to } = state.selection;
                let updated = false;

                state.doc.nodesBetween(from, to, (node, pos) => {
                  if (
                    !["heading", "paragraph", "image"].includes(node.type.name)
                  ) {
                    return;
                  }

                  // ✅ Preserve ALL existing attributes including dir
                  const nextAttrs = { ...node.attrs };
                  delete nextAttrs.textAlign;

                  if (dispatch) {
                    tr.setNodeMarkup(pos, undefined, nextAttrs);
                  }
                  updated = true;
                });

                if (updated && dispatch) {
                  dispatch(tr);
                }

                return updated;
              },
          };
        },
      }).configure({
        types: ["heading", "paragraph", "image"],
        alignments: ["left", "center", "right", "justify", "start", "end"], // Phase 3.8: Add start/end for RTL support
      }),
      Placeholder.configure({
        placeholder,
      }),
      // Phase 1: Text Color & Highlight
      // Phase 3.5: Extended TextStyle with fontWeight and fontSize support
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontWeight: {
              default: null,
              parseHTML: (element) =>
                element.style.fontWeight ||
                element.getAttribute("data-font-weight"),
              renderHTML: (attributes) => {
                if (!attributes.fontWeight) {
                  return {};
                }
                // Return style as CSS property, not string
                // TipTap will merge this with other TextStyle attributes
                return {
                  style: `font-weight: ${attributes.fontWeight}`,
                };
              },
            },
            fontSize: {
              default: null,
              parseHTML: (element) =>
                element.style.fontSize ||
                element.getAttribute("data-font-size"),
              renderHTML: (attributes) => {
                if (!attributes.fontSize) {
                  return {};
                }
                // Return style as CSS property
                // TipTap will merge this with other TextStyle attributes (fontWeight, color, etc.)
                return {
                  style: `font-size: ${attributes.fontSize}`,
                };
              },
            },
          };
        },
      }),
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
      // Phase 4: Tables - Modern & Beautiful with custom borders
      // Phase 6.1: Added width/height attributes for whole-table resize
      Table.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            borderWidth: {
              default: "1px",
              parseHTML: (element) =>
                element.style.getPropertyValue("--table-border-width") || "1px",
            },
            borderStyle: {
              default: "solid",
              parseHTML: (element) =>
                element.style.getPropertyValue("--table-border-style") ||
                "solid",
            },
            borderColor: {
              default: "#000000",
              parseHTML: (element) =>
                element.style.getPropertyValue("--table-border-color") ||
                "#000000",
            },
            borderRadius: {
              default: "0px",
              parseHTML: (element) =>
                element.style.getPropertyValue("--table-border-radius") ||
                "0px",
            },
            // Height can be persisted on the table node; width is driven entirely
            // by ProseMirror's column widths (colwidth) so that the built-in
            // columnResizing plugin remains the single source of truth for
            // horizontal sizing.
            tableHeight: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("data-table-height") ||
                element.style.height ||
                null,
            },
          };
        },
      }).configure({
        resizable: true,
      }),
      TableRow,
      // Ensure header cells support background colors like body cells
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("data-background-color") ||
                element.style.backgroundColor ||
                null,
              renderHTML: (attributes) => {
                if (!attributes.backgroundColor) {
                  return {};
                }
                const color = attributes.backgroundColor;
                return {
                  "data-background-color": color,
                  style: `background: ${color}; background-color: ${color}`,
                };
              },
            },
            textAlign: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("data-text-align") ||
                element.style.textAlign ||
                null,
              renderHTML: (attributes) => {
                if (!attributes.textAlign) {
                  return {};
                }
                return {
                  "data-text-align": attributes.textAlign,
                  style: `text-align: ${attributes.textAlign}`,
                };
              },
            },
          };
        },
      }),
      // Phase 4.2: TableCell with background color support
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("data-background-color") ||
                element.style.backgroundColor ||
                null,
              renderHTML: (attributes) => {
                if (!attributes.backgroundColor) {
                  return {};
                }
                return {
                  "data-background-color": attributes.backgroundColor,
                  style: `background-color: ${attributes.backgroundColor}`,
                };
              },
            },
            textAlign: {
              default: null,
              parseHTML: (element) =>
                element.getAttribute("data-text-align") ||
                element.style.textAlign ||
                null,
              renderHTML: (attributes) => {
                if (!attributes.textAlign) {
                  return {};
                }
                return {
                  "data-text-align": attributes.textAlign,
                  style: `text-align: ${attributes.textAlign}`,
                };
              },
            },
          };
        },
      }),
      // Phase 3.4: Link - Modern & Secure
      Link.configure({
        openOnClick: false,
        autolink: true, // Auto-detect URLs
        linkOnPaste: true, // Auto-link on paste
        HTMLAttributes: {
          // Security: rel="noopener noreferrer" prevents window.opener access
          rel: "noopener noreferrer",
          // Styling handled by CSS (editor-styles.css)
        },
      }),
      // Phase 3: Font Family
      FontFamily.configure({
        types: ["textStyle"],
      }),
      // Phase 5.1: Audio Recording
      Audio,
      // Custom HTML Block - Preserves inline styles
      HTMLBlock,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      // Force React re-render when selection changes
      forceUpdate();
    },
    onTransaction: () => {
      // Force React re-render on every transaction (including storedMarks changes
      // when the document itself doesn't change). This makes B/I/U immediately
      // reflect their active state even in an empty editor.
      forceUpdate();
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Phase 5.3: Word Count - Update live as user types
  useEffect(() => {
    if (!editor) return;

    const updateWordCount = () => {
      const text = editor.getText();
      // Count words (split by whitespace, filter empty strings)
      const words = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      setWordCount(words.length);
      // Count characters (including whitespace)
      setCharCount(text.length);
    };

    // Initial count
    updateWordCount();

    // Update on every transaction (typing, paste, etc.)
    editor.on("update", updateWordCount);

    return () => {
      editor.off("update", updateWordCount);
    };
  }, [editor]);

  // Active Tools Breadcrumb - Show DOM hierarchy path (like DevTools)
  useEffect(() => {
    if (!editor) return;

    const updateActiveTools = () => {
      const path: string[] = [];

      // Get current cursor position
      const { $from } = editor.state.selection;

      // Traverse from root to current position (DOM hierarchy)
      for (let depth = 0; depth <= $from.depth; depth++) {
        const node = $from.node(depth);

        // Skip document root
        if (node.type.name === "doc") continue;

        // Map node types to readable names
        let nodeName = "";

        switch (node.type.name) {
          case "heading":
            nodeName = `h${node.attrs.level}`;
            break;
          case "paragraph":
            nodeName = "p";
            break;
          case "bulletList":
            nodeName = "ul";
            break;
          case "orderedList":
            nodeName = "ol";
            break;
          case "listItem":
            nodeName = "li";
            break;
          case "table":
            nodeName = "table";
            break;
          case "tableRow":
            nodeName = "tr";
            break;
          case "tableCell":
            nodeName = "td";
            break;
          case "tableHeader":
            nodeName = "th";
            break;
          case "blockquote":
            nodeName = "blockquote";
            break;
          case "codeBlock":
            nodeName = "code";
            break;
          case "horizontalRule":
            nodeName = "hr";
            break;
          case "hardBreak":
            nodeName = "br";
            break;
          default:
            // Use original name for custom nodes (math, image, etc.)
            nodeName = node.type.name;
        }

        if (nodeName) {
          path.push(nodeName);
        }
      }

      // Add active marks (bold, italic, etc.) at the end
      const marks = $from.marks();
      marks.forEach((mark) => {
        let markName = "";

        switch (mark.type.name) {
          case "bold":
            markName = "strong";
            break;
          case "italic":
            markName = "em";
            break;
          case "underline":
            markName = "u";
            break;
          case "strike":
            markName = "s";
            break;
          case "code":
            markName = "code";
            break;
          case "link":
            markName = "a";
            break;
          case "superscript":
            markName = "sup";
            break;
          case "subscript":
            markName = "sub";
            break;
          case "highlight":
            markName = "mark";
            break;
          default:
            markName = mark.type.name;
        }

        if (markName) {
          path.push(markName);
        }
      });

      setActiveTools(path);
    };

    // Initial update
    updateActiveTools();

    // Update on selection change and content update
    editor.on("selectionUpdate", updateActiveTools);
    editor.on("update", updateActiveTools);

    return () => {
      editor.off("selectionUpdate", updateActiveTools);
      editor.off("update", updateActiveTools);
    };
  }, [editor]);

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

  useEffect(() => {
    if (!editor) return;

    const applyTableBorderStyles = () => {
      const { state, view } = editor;
      state.doc.descendants((node, pos) => {
        if (node.type.name !== "table") return;
        const domNode = view.nodeDOM(pos) as HTMLElement | null;
        if (!domNode) return;
        const borderWidth = (node.attrs.borderWidth as string) || "2px";
        const borderStyle = (node.attrs.borderStyle as string) || "solid";
        const borderColor = (node.attrs.borderColor as string) || "#000000";
        const borderRadius = (node.attrs.borderRadius as string) || "0px";
        const tableHeight = (node.attrs.tableHeight as string | null) || null;

        // Find the actual <table> element inside the node view wrapper
        const tableElement =
          domNode instanceof HTMLTableElement
            ? domNode
            : (domNode.querySelector("table") as HTMLTableElement | null);

        if (!tableElement) return;

        // Set CSS variables on the <table> so all cells inherit the border style.
        // We do NOT set per-cell inline border styles anymore so that operations
        // like column resizing, which may re-render cells, don't "lose" the
        // border styling.
        tableElement.style.setProperty("--table-border-width", borderWidth);
        tableElement.style.setProperty("--table-border-style", borderStyle);
        tableElement.style.setProperty("--table-border-color", borderColor);
        tableElement.style.setProperty("--table-border-radius", borderRadius);

        // Apply persisted table height from node attrs. Width is controlled by
        // ProseMirror's column widths (colwidth) and the built-in
        // columnResizing plugin so that there is a single source of truth for
        // horizontal sizing.
        if (tableHeight) {
          tableElement.style.height = tableHeight;
          tableElement.setAttribute("data-table-height", tableHeight);
        } else {
          tableElement.style.removeProperty("height");
          tableElement.removeAttribute("data-table-height");
        }
      });
    };

    applyTableBorderStyles();
    editor.on("transaction", applyTableBorderStyles);

    return () => {
      editor.off("transaction", applyTableBorderStyles);
    };
  }, [editor]);

  // Phase 4: Column resize indicator (existing)
  useEffect(() => {
    if (!editor) return;
    let indicator: HTMLDivElement | null = null;
    let activeHandle: HTMLElement | null = null;
    let previousHandleShadow = "";

    const cleanup = () => {
      if (indicator) {
        indicator.remove();
        indicator = null;
      }
      if (activeHandle) {
        activeHandle.style.boxShadow = previousHandleShadow;
        previousHandleShadow = "";
        activeHandle = null;
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const updateIndicator = () => {
      if (!indicator || !activeHandle) return;
      const column = activeHandle.parentElement as HTMLElement | null;
      if (!column) return;
      const rect = column.getBoundingClientRect();
      indicator.textContent = `${Math.round(rect.width)}px`;
      indicator.style.top = `${rect.top + window.scrollY - 32}px`;
      indicator.style.left = `${
        rect.left + rect.width / 2 + window.scrollX - 30
      }px`;
    };

    const handleMouseMove = () => {
      updateIndicator();
    };

    const handleMouseUp = () => {
      cleanup();
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target || !target.classList.contains("column-resize-handle")) {
        return;
      }
      activeHandle = target;
      previousHandleShadow = activeHandle.style.boxShadow;
      activeHandle.style.boxShadow = "0 0 0 4px rgba(139, 92, 246, 0.35)";
      indicator = document.createElement("div");
      indicator.className = "table-resize-indicator";
      document.body.appendChild(indicator);
      updateIndicator();
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      cleanup();
    };
  }, [editor]);

  // Phase 6.1: Whole-table resize handles (TinyMCE-style corner drag)
  useEffect(() => {
    if (!editor) return;

    let resizeHandles: HTMLDivElement[] = [];
    let sizeBadge: HTMLDivElement | null = null;
    let currentTable: HTMLTableElement | null = null;
    let currentTablePos: number | null = null;
    let isResizing = false;

    const cleanup = () => {
      resizeHandles.forEach((handle) => handle.remove());
      resizeHandles = [];
      if (sizeBadge) {
        sizeBadge.remove();
        sizeBadge = null;
      }
      currentTable = null;
      currentTablePos = null;
    };

    const createResizeHandles = (table: HTMLTableElement, pos: number) => {
      cleanup();
      currentTable = table;
      currentTablePos = pos;

      // Create 4 corner handles (NW, NE, SW, SE)
      const positions = [
        { name: "nw", cursor: "nwse-resize", top: "-6px", left: "-6px" },
        { name: "ne", cursor: "nesw-resize", top: "-6px", right: "-6px" },
        { name: "sw", cursor: "nesw-resize", bottom: "-6px", left: "-6px" },
        { name: "se", cursor: "nwse-resize", bottom: "-6px", right: "-6px" },
      ];

      positions.forEach((pos) => {
        const handle = document.createElement("div");
        handle.className = `table-resize-handle table-resize-handle-${pos.name}`;
        handle.style.position = "absolute";
        handle.style.width = "12px";
        handle.style.height = "12px";
        handle.style.borderRadius = "50%";
        handle.style.background = "#3b82f6";
        handle.style.border = "2px solid white";
        handle.style.cursor = pos.cursor;
        handle.style.zIndex = "100";
        handle.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.35)";
        handle.style.pointerEvents = "auto";

        if (pos.top) handle.style.top = pos.top;
        if (pos.bottom) handle.style.bottom = pos.bottom;
        if (pos.left) handle.style.left = pos.left;
        if (pos.right) handle.style.right = pos.right;

        handle.addEventListener("mousedown", (e) =>
          handleResizeStart(e, pos.name as "nw" | "ne" | "sw" | "se")
        );

        resizeHandles.push(handle);
      });

      // Create size badge
      sizeBadge = document.createElement("div");
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
      sizeBadge.style.zIndex = "101";

      // Append handles directly to the <table> element so they track its size
      const wrapper = table as HTMLElement;
      wrapper.style.position = wrapper.style.position || "relative";
      resizeHandles.forEach((handle) => wrapper.appendChild(handle));
      wrapper.appendChild(sizeBadge);
    };

    const handleResizeStart = (
      e: MouseEvent,
      corner: "nw" | "ne" | "sw" | "se"
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentTable || currentTablePos === null) return;

      isResizing = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = currentTable.offsetWidth;
      const startHeight = currentTable.offsetHeight;

      if (sizeBadge) {
        sizeBadge.style.display = "inline-flex";
        sizeBadge.textContent = `${startWidth}px × ${startHeight}px`;
      }

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!currentTable || !sizeBadge) return;

        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on corner
        if (corner === "se") {
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
        } else if (corner === "sw") {
          newWidth = startWidth - deltaX;
          newHeight = startHeight + deltaY;
        } else if (corner === "ne") {
          newWidth = startWidth + deltaX;
          newHeight = startHeight - deltaY;
        } else if (corner === "nw") {
          newWidth = startWidth - deltaX;
          newHeight = startHeight - deltaY;
        }

        // Apply constraints
        newWidth = Math.max(200, Math.min(newWidth, 2000));
        newHeight = Math.max(100, Math.min(newHeight, 2000));

        // Apply to table
        currentTable.style.width = `${newWidth}px`;
        currentTable.style.height = `${newHeight}px`;

        // Update badge
        sizeBadge.textContent = `${Math.round(newWidth)}px × ${Math.round(
          newHeight
        )}px`;
      };

      const onMouseUp = () => {
        isResizing = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (sizeBadge) {
          sizeBadge.style.display = "none";
        }

        // Save to TipTap node attributes + synchronize column widths with the
        // DOM so that subsequent column resizing uses the "new" table width as
        // its baseline instead of snapping back to the previous width.
        if (currentTable) {
          const newHeight = `${currentTable.offsetHeight}px`;

          // Find the current table position dynamically (it may have changed)
          let foundPos: number | null = null;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === "table") {
              const domNode = editor.view.nodeDOM(pos) as HTMLElement | null;
              const tableElement =
                domNode instanceof HTMLTableElement
                  ? domNode
                  : (domNode?.querySelector(
                      "table"
                    ) as HTMLTableElement | null);

              if (tableElement === currentTable) {
                foundPos = pos;
                return false; // Stop searching
              }
            }
            return true;
          });

          if (foundPos !== null) {
            editor.commands.command(({ tr, state, dispatch }) => {
              const tableNode: any = state.doc.nodeAt(foundPos!);

              if (tableNode && tableNode.type.name === "table" && dispatch) {
                // 1) Recompute column widths based on the DOM after the
                // whole-table resize. We look at the first table row's DOM
                // cells, measure their rendered widths, and write those values
                // into the colwidth attributes. This keeps ProseMirror's
                // columnResizing plugin perfectly in sync with what the user
                // sees after dragging the corner handle.
                const firstRowInfo: { node: any; offset: number } | null =
                  (() => {
                    let info: { node: any; offset: number } | null = null;
                    tableNode.forEach((row: any, offset: number) => {
                      if (!info && row.type && row.type.name === "tableRow") {
                        info = { node: row, offset };
                      }
                    });
                    return info;
                  })();

                if (firstRowInfo && currentTable) {
                  const { node: firstRow, offset: firstRowOffset } =
                    firstRowInfo;

                  const domFirstRow = currentTable.querySelector("tr");
                  if (domFirstRow) {
                    const domCells = Array.from(
                      domFirstRow.children
                    ) as HTMLTableCellElement[];

                    const rowStartPos = foundPos! + 1 + firstRowOffset;
                    let domCellIndex = 0;

                    firstRow.forEach((cell: any, cellOffset: number) => {
                      const colspan =
                        (cell.attrs?.colspan as number | undefined) || 1;
                      const domCell = domCells[domCellIndex] as
                        | HTMLTableCellElement
                        | undefined;
                      domCellIndex += 1;

                      let totalCellWidth: number | null = null;

                      if (domCell) {
                        const rect = domCell.getBoundingClientRect();
                        if (rect.width && isFinite(rect.width)) {
                          totalCellWidth = rect.width;
                        }
                      }

                      // Fallbacks if, for some reason, the DOM measurement
                      // isn't available.
                      if (totalCellWidth == null) {
                        const existing = cell.attrs?.colwidth as
                          | number[]
                          | undefined;
                        if (
                          Array.isArray(existing) &&
                          existing.length === colspan
                        ) {
                          totalCellWidth = existing.reduce(
                            (sum: number, w: number) => sum + w,
                            0
                          );
                        } else {
                          totalCellWidth = colspan * 50; // safe minimum
                        }
                      }

                      const perColWidth = Math.max(
                        25,
                        Math.round(totalCellWidth / colspan)
                      );
                      const cellWidths = Array(colspan).fill(perColWidth);

                      const cellPos = rowStartPos + 1 + cellOffset;
                      tr.setNodeMarkup(cellPos, undefined, {
                        ...cell.attrs,
                        colwidth: cellWidths,
                      });
                    });
                  }
                }

                // 2) Persist the updated table height on the node so vertical
                // resizing survives re-renders. Horizontal sizing comes from
                // colwidth/columnResizing only.
                tr.setNodeMarkup(foundPos!, undefined, {
                  ...tableNode.attrs,
                  tableHeight: newHeight,
                });

                dispatch(tr);
              }
              return true;
            });
          }
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const updateHandles = () => {
      const { state, view } = editor;
      const { selection } = state;

      // Check if cursor is inside a table
      let tableNode = null;
      let tablePos = null;

      state.doc.descendants((node, pos) => {
        if (node.type.name === "table") {
          const nodeStart = pos;
          const nodeEnd = pos + node.nodeSize;
          if (selection.from >= nodeStart && selection.to <= nodeEnd) {
            tableNode = node;
            tablePos = pos;
            return false; // Stop searching
          }
        }
      });

      if (tableNode && tablePos !== null) {
        const domNode = view.nodeDOM(tablePos) as HTMLElement | null;
        const tableElement =
          domNode instanceof HTMLTableElement
            ? domNode
            : (domNode?.querySelector("table") as HTMLTableElement | null);

        if (tableElement && tableElement !== currentTable) {
          createResizeHandles(tableElement, tablePos);
        }
      } else {
        cleanup();
      }
    };

    // Update handles on selection change
    editor.on("selectionUpdate", updateHandles);
    editor.on("transaction", updateHandles);

    // Initial update
    updateHandles();

    return () => {
      editor.off("selectionUpdate", updateHandles);
      editor.off("transaction", updateHandles);
      cleanup();
    };
  }, [editor]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = editorHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY.current;
      const newHeight = Math.max(100, resizeStartHeight.current + deltaY);
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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

  // Phase 3.4: Link handlers
  const handleLinkInsert = (url: string, openInNewTab: boolean) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .setLink({
        href: url,
        target: openInNewTab ? "_blank" : undefined,
        rel: openInNewTab ? "noopener noreferrer" : undefined, // 🔒 Security: Prevent window.opener access
      })
      .run();
  };

  const handleLinkEdit = () => {
    if (!editor) return;

    const { href, target } = editor.getAttributes("link");
    setLinkUrl(href || "");
    setLinkOpenInNewTab(target === "_blank");
    setShowLinkDialog(true);
  };

  const handleLinkRemove = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
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

  const handleHTMLInsert = (html: string) => {
    if (!editor) return;

    // Insert sanitized HTML as HTMLBlock node (preserves inline styles)
    editor
      .chain()
      .focus()
      .insertContent({
        type: "htmlBlock",
        attrs: {
          html: html,
        },
      })
      .run();

    setShowInsertHTML(false);
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

  const lineHeightOptions = [
    { label: "1.0x", value: "1" },
    { label: "1.15x", value: "1.15" },
    { label: "1.5x", value: "1.5" },
    { label: "2.0x", value: "2" },
  ];

  const bulletListStyleOptions = [
    { label: "Solid bullet", value: "disc", preview: "•" },
    { label: "Hollow bullet", value: "circle", preview: "○" },
    { label: "Square bullet", value: "square", preview: "■" },
    { label: "Checklist", value: "check", preview: "✓" },
    { label: "Accent dot", value: "accent", preview: "•" },
    { label: "Cross (don't)", value: "cross", preview: "✕" },
    { label: "Checkbox", value: "task", preview: "☑" },
  ];

  const isTaskListActive = editor.isActive("taskList");

  const currentBulletListStyle = isTaskListActive
    ? "task"
    : editor.getAttributes("bulletList")?.bulletStyle || "disc";

  const applyBulletListStyle = (style: string) => {
    if (!editor) return;

    const chain = editor.chain().focus();

    if (style === "task") {
      chain.toggleTaskList().run();
      return;
    }

    if (editor.isActive("taskList")) {
      chain.toggleTaskList();
    }

    const isBulletActive = editor.isActive("bulletList");

    if (!isBulletActive) {
      chain.toggleBulletList();
    }

    chain.updateAttributes("bulletList", { bulletStyle: style }).run();
  };

  const orderedListStyleOptions = [
    { label: "1. 2. 3.", value: "decimal", preview: "1." },
    { label: "a. b. c.", value: "lower-alpha", preview: "a." },
    { label: "A. B. C.", value: "upper-alpha", preview: "A." },
    { label: "i. ii. iii.", value: "lower-roman", preview: "i." },
    { label: "I. II. III.", value: "upper-roman", preview: "I." },
  ];

  const currentOrderedListStyle =
    editor.getAttributes("orderedList")?.numStyle || "decimal";

  const applyOrderedListStyle = (style: string) => {
    if (!editor) return;

    const isActive = editor.isActive("orderedList");
    const chain = editor.chain().focus();

    if (!isActive) {
      chain.toggleOrderedList();
    }

    chain.updateAttributes("orderedList", { numStyle: style }).run();
  };

  const currentLineHeight =
    editor.getAttributes("heading")?.lineHeight ||
    editor.getAttributes("paragraph")?.lineHeight ||
    null;

  const lineHeightTargetTypes = ["paragraph", "heading"];

  // Phase 3.8: Text direction helpers
  const currentTextDirection =
    editor.getAttributes("heading")?.dir ||
    editor.getAttributes("paragraph")?.dir ||
    null;

  const applyTextDirection = (direction: "ltr" | "rtl" | null) => {
    if (!editor) return;

    // Get current alignment BEFORE changing direction
    const currentAlign =
      editor.getAttributes("paragraph").textAlign ||
      editor.getAttributes("heading").textAlign ||
      null;

    // Step 1: Set text direction using custom command (preserves textAlign)
    editor.chain().focus().setTextDirection(direction).run();

    // Step 2: Auto-align based on direction (smart default)
    // Only auto-align if current alignment is left, right, start, end, or not set
    // Don't override center or justify
    const shouldAutoAlign =
      !currentAlign ||
      currentAlign === "left" ||
      currentAlign === "right" ||
      currentAlign === "start" ||
      currentAlign === "end";

    if (shouldAutoAlign) {
      editor.chain().focus().setTextAlign("start").run();
    }
  };

  const applyLineHeightValue = (lineHeightValue: string | null) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        let updated = false;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!lineHeightTargetTypes.includes(node.type.name)) {
            return;
          }

          const currentValue = node.attrs.lineHeight ?? null;
          if (currentValue === lineHeightValue) {
            return;
          }

          const nextAttrs = { ...node.attrs };
          if (lineHeightValue === null) {
            delete nextAttrs.lineHeight;
          } else {
            nextAttrs.lineHeight = lineHeightValue;
          }

          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, nextAttrs);
          }
          updated = true;
        });

        if (updated && dispatch) {
          dispatch(tr);
        }

        return updated;
      })
      .run();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`border rounded-lg dark:border-slate-700 overflow-hidden flex flex-col ${
          !showIndentGuides ? "no-indent-guides" : ""
        } ${
          isFullscreen
            ? "fixed inset-0 z-50 bg-white dark:bg-slate-950 rounded-none border-none"
            : ""
        }`}
      >
        {/* Main Toolbar - Fixed at top */}
        <div className="flex-shrink-0 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={
                  editor.isActive("bold") ||
                  editor.state.storedMarks?.some(
                    (mark) => mark.type.name === "bold"
                  )
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={
                  editor.isActive("italic") ||
                  editor.state.storedMarks?.some(
                    (mark) => mark.type.name === "italic"
                  )
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={
                  editor.isActive("underline") ||
                  editor.state.storedMarks?.some(
                    (mark) => mark.type.name === "underline"
                  )
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Text Color */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
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
              </TooltipTrigger>
              <TooltipContent>Text Color</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Text Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setPendingTextColor(color);
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 space-y-3">
                  <Label className="text-xs font-medium">Custom Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={pendingTextColor}
                      onChange={(e) => setPendingTextColor(e.target.value)}
                      className="w-10 h-8 md:w-12 md:h-10 rounded-md border cursor-pointer border-slate-300 dark:border-slate-600"
                    />
                    <input
                      type="text"
                      value={pendingTextColor}
                      onChange={(e) => setPendingTextColor(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm border rounded-md font-mono dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click color box or enter hex code
                  </p>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Preview
                    </Label>
                    <div className="mt-1 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/40">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Aa
                      </span>
                      <span
                        className="ml-2 flex-1 text-right font-medium"
                        style={{ color: pendingTextColor }}
                      >
                        Preview text
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!editor) return;

                      const color = pendingTextColor || "#000000";

                      const chain = editor.chain().focus().setColor(color);

                      // Sync text color to list bullets, numbers, and task checkboxes
                      chain.updateAttributes("listItem", {
                        textColor: color,
                      });
                      chain.updateAttributes("taskItem", {
                        textColor: color,
                      });

                      chain.run();
                    }}
                  >
                    Apply Color
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!editor) return;

                      const chain = editor.chain().focus().unsetColor();

                      // Reset list + task item text color attributes
                      chain.updateAttributes("listItem", {
                        textColor: null,
                      });
                      chain.updateAttributes("taskItem", {
                        textColor: null,
                      });

                      chain.run();

                      setPendingTextColor("#000000");
                    }}
                  >
                    Remove Color
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Highlight</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Highlight</Label>
                <div className="grid grid-cols-6 gap-2">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setPendingHighlightColor(color);
                      }}
                    />
                  ))}
                </div>

                <div className="mt-2 space-y-3">
                  <Label className="text-xs font-medium">
                    Custom Highlight
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={pendingHighlightColor}
                      onChange={(e) => setPendingHighlightColor(e.target.value)}
                      className="w-10 h-8 md:w-12 md:h-10 rounded-md border cursor-pointer border-slate-300 dark:border-slate-600"
                    />
                    <input
                      type="text"
                      value={pendingHighlightColor}
                      onChange={(e) => setPendingHighlightColor(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm border rounded-md font-mono dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      placeholder="#FEF3C7"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click color box or enter hex code
                  </p>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Preview
                    </Label>
                    <div
                      className="mt-1 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900/40"
                      style={{ backgroundColor: pendingHighlightColor }}
                    >
                      <span className="text-[11px] text-slate-700 dark:text-slate-100">
                        Aa
                      </span>
                      <span className="ml-2 flex-1 text-right font-medium text-slate-800 dark:text-slate-50">
                        Highlight preview
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!editor) return;

                      const color =
                        pendingHighlightColor ||
                        highlightColors[0] ||
                        "#FEF3C7";

                      editor.chain().focus().setHighlight({ color }).run();
                    }}
                  >
                    Apply Highlight
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (!editor) return;

                      editor.chain().focus().unsetHighlight().run();
                      setPendingHighlightColor(highlightColors[0] || "#FEF3C7");
                    }}
                  >
                    Remove Highlight
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Font Size */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <Type className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Font Size</TooltipContent>
            </Tooltip>
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
                    onClick={() => {
                      if (!editor) return;

                      const chain = editor
                        .chain()
                        .focus()
                        .setMark("textStyle", { fontSize: size.value })
                        // Sync font size to list bullets and numbers
                        .updateAttributes("listItem", {
                          fontSize: size.value,
                        })
                        // Ensure checklist items use the same font size for their checkbox as text
                        .updateAttributes("taskItem", {
                          fontSize: size.value,
                        });

                      chain.run();
                    }}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Line Height */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={
                      currentLineHeight
                        ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900"
                        : ""
                    }
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    {currentLineHeight ? `${currentLineHeight}x` : "Line"}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Line Height</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line Height</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-between ${
                    !currentLineHeight
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                      : ""
                  }`}
                  onClick={() => applyLineHeightValue(null)}
                >
                  Default
                  {!currentLineHeight && <span className="text-xs">Theme</span>}
                </Button>
                <div className="grid gap-1">
                  {lineHeightOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-between ${
                        currentLineHeight === option.value
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                          : ""
                      }`}
                      onClick={() => applyLineHeightValue(option.value)}
                    >
                      {option.label}
                      {currentLineHeight === option.value && (
                        <span className="text-xs uppercase tracking-wide">
                          Active
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Phase 3.5: Font Family - Bangla + English with Weight Control */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={
                      editor.getAttributes("textStyle").fontFamily
                        ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900"
                        : ""
                    }
                  >
                    <Type className="h-4 w-4 mr-1" />
                    Font
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-semibold">Font Family</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose font and weight
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-0" align="start">
              <FontFamilySelector editor={editor} />
            </PopoverContent>
          </Popover>

          {/* Phase 3.6: Heading Levels */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <Heading className="h-4 w-4" />
                    <span className="text-xs">
                      {editor.isActive("heading", { level: 1 })
                        ? "H1"
                        : editor.isActive("heading", { level: 2 })
                        ? "H2"
                        : editor.isActive("heading", { level: 3 })
                        ? "H3"
                        : editor.isActive("heading", { level: 4 })
                        ? "H4"
                        : editor.isActive("heading", { level: 5 })
                        ? "H5"
                        : editor.isActive("heading", { level: 6 })
                        ? "H6"
                        : "P"}
                    </span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Heading Level</div>
                  <div className="text-muted-foreground mt-1">
                    Shortcuts: Ctrl+Alt+0-6
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Heading Level</Label>
                {[
                  { label: "Paragraph", level: 0, shortcut: "Ctrl+Alt+0" },
                  { label: "Heading 1", level: 1, shortcut: "Ctrl+Alt+1" },
                  { label: "Heading 2", level: 2, shortcut: "Ctrl+Alt+2" },
                  { label: "Heading 3", level: 3, shortcut: "Ctrl+Alt+3" },
                  { label: "Heading 4", level: 4, shortcut: "Ctrl+Alt+4" },
                  { label: "Heading 5", level: 5, shortcut: "Ctrl+Alt+5" },
                  { label: "Heading 6", level: 6, shortcut: "Ctrl+Alt+6" },
                ].map((heading) => {
                  const isActive =
                    heading.level === 0
                      ? !editor.isActive("heading")
                      : editor.isActive("heading", { level: heading.level });

                  return (
                    <Button
                      key={heading.level}
                      type="button"
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-between"
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
                      <span>{heading.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {heading.shortcut}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Subscript & Superscript */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={
                  editor.isActive("subscript")
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <SubscriptIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subscript</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>Superscript</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-2">
            {/* Bullet list group */}
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40 overflow-hidden">
              {/* Bullet list toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={
                      editor.isActive("bulletList")
                        ? "bg-slate-200 dark:bg-slate-700"
                        : ""
                    }
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet list</TooltipContent>
              </Tooltip>

              {/* Bullet list style picker */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`px-2 ${
                          editor.isActive("bulletList")
                            ? "bg-slate-100 dark:bg-slate-800"
                            : ""
                        }`}
                      >
                        <span className="mr-1 text-xs">
                          {bulletListStyleOptions.find(
                            (option) => option.value === currentBulletListStyle
                          )?.preview || " b7"}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Bullet style</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                    {bulletListStyleOptions.map((option) => {
                      const isActiveStyle =
                        currentBulletListStyle === option.value;

                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-between ${
                            isActiveStyle
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              : ""
                          }`}
                          onClick={() => applyBulletListStyle(option.value)}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base leading-none">
                              {option.preview}
                            </span>
                            <span className="text-xs">{option.label}</span>
                          </span>
                          {isActiveStyle && (
                            <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Active
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Ordered list group */}
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40 overflow-hidden">
              {/* Ordered list toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className={
                      editor.isActive("orderedList")
                        ? "bg-slate-200 dark:bg-slate-700"
                        : ""
                    }
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Numbered list</TooltipContent>
              </Tooltip>

              {/* Ordered list style picker */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`px-2 ${
                          editor.isActive("orderedList")
                            ? "bg-slate-100 dark:bg-slate-800"
                            : ""
                        }`}
                      >
                        <span className="mr-1 text-xs">
                          {orderedListStyleOptions.find(
                            (option) => option.value === currentOrderedListStyle
                          )?.preview || "1."}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Numbering style</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                    {orderedListStyleOptions.map((option) => {
                      const isActiveStyle =
                        currentOrderedListStyle === option.value;

                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-between ${
                            isActiveStyle
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              : ""
                          }`}
                          onClick={() => applyOrderedListStyle(option.value)}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-base leading-none">
                              {option.preview}
                            </span>
                            <span className="text-xs">{option.label}</span>
                          </span>
                          {isActiveStyle && (
                            <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Active
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Phase 3.1: Blockquote with Styles and Preset Themes */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Blockquote</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Blockquote Style
                  </Label>
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
                          editor.getAttributes("blockquote").style ===
                          style.value
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
                          editor.getAttributes("blockquote").color ===
                          theme.color
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

          {/* Phase 3.3: Indent/Outdent - Beautiful Enhanced Version */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().indent().run()}
                className="relative group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950 dark:hover:to-indigo-950 transition-all duration-200"
              >
                <IndentIncrease className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Sparkles className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">Increase Indent</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Press{" "}
                  <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                    Tab
                  </kbd>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().outdent().run()}
                className="relative group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950 dark:hover:to-pink-950 transition-all duration-200"
              >
                <IndentDecrease className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Sparkles className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">Decrease Indent</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Press{" "}
                  <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                    Shift
                  </kbd>{" "}
                  +{" "}
                  <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">
                    Tab
                  </kbd>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Phase 3.3: Toggle Indent Guides - User Preference */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowIndentGuides(!showIndentGuides)}
                className={`relative transition-all duration-200 ${
                  showIndentGuides
                    ? "bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900 dark:to-fuchsia-900 hover:from-violet-200 hover:to-fuchsia-200 dark:hover:from-violet-800 dark:hover:to-fuchsia-800"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles
                  className={`h-4 w-4 transition-all duration-200 ${
                    showIndentGuides
                      ? "text-violet-600 dark:text-violet-400 scale-110"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                />
                {showIndentGuides && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">
                  {showIndentGuides ? "Hide" : "Show"} Indent Guides
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {showIndentGuides
                    ? "Click to use simple indent style"
                    : "Click to show colorful guide lines"}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Alignment - Phase 3.8: Dynamic icons based on text direction */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor.chain().focus().setTextAlign("start").run()
                }
                className={
                  editor.isActive({ textAlign: "start" }) ||
                  editor.isActive({ textAlign: "left" })
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                {currentTextDirection === "rtl" ? (
                  <AlignRight className="h-4 w-4" />
                ) : (
                  <AlignLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {currentTextDirection === "rtl"
                ? "Align Start (Right)"
                : "Align Start (Left)"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                className={
                  editor.isActive({ textAlign: "center" })
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign("end").run()}
                className={
                  editor.isActive({ textAlign: "end" }) ||
                  editor.isActive({ textAlign: "right" })
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                {currentTextDirection === "rtl" ? (
                  <AlignLeft className="h-4 w-4" />
                ) : (
                  <AlignRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {currentTextDirection === "rtl"
                ? "Align End (Left)"
                : "Align End (Right)"}
            </TooltipContent>
          </Tooltip>

          {/* Text Direction - Phase 3.8: RTL/LTR controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`px-3 ${
                  currentTextDirection === "ltr"
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                    : ""
                }`}
                onClick={() =>
                  applyTextDirection(
                    currentTextDirection === "ltr" ? null : "ltr"
                  )
                }
              >
                LTR
              </Button>
            </TooltipTrigger>
            <TooltipContent>Left-to-Right Direction</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`px-3 ${
                  currentTextDirection === "rtl"
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                    : ""
                }`}
                onClick={() =>
                  applyTextDirection(
                    currentTextDirection === "rtl" ? null : "rtl"
                  )
                }
              >
                RTL
              </Button>
            </TooltipTrigger>
            <TooltipContent>Right-to-Left Direction</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Code Block */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={
                  editor.isActive("codeBlock")
                    ? "bg-slate-200 dark:bg-slate-700"
                    : ""
                }
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>

          {/* Table - Phase 4.1: Modern grid selector */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TableGridSelector
                  onSelect={(rows, cols) =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows, cols, withHeaderRow: true })
                      .run()
                  }
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Insert Table</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Phase 3.2: Horizontal Rule with Styles */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
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
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Horizontal Rule</TooltipContent>
            </Tooltip>
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
                        variant={
                          hrStyle === style.value ? "default" : "outline"
                        }
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
                          hrThickness === thickness.value
                            ? "default"
                            : "outline"
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
                        variant={
                          hrColor === theme.color ? "default" : "outline"
                        }
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
                  className="w-full"
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

          {/* Phase 3.4: Link - Modern Dialog with Security */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editor.isActive("link")) {
                    // Edit existing link
                    handleLinkEdit();
                  } else {
                    // Insert new link
                    setLinkUrl("");
                    setLinkOpenInNewTab(true);
                    setShowLinkDialog(true);
                  }
                }}
                className={`relative transition-all duration-200 ${
                  editor.isActive("link")
                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <LinkIcon
                  className={`h-4 w-4 transition-all duration-200 ${
                    editor.isActive("link")
                      ? "text-blue-600 dark:text-blue-400 scale-110"
                      : ""
                  }`}
                />
                {editor.isActive("link") && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-semibold">
                  {editor.isActive("link") ? "Edit Link" : "Insert Link"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {editor.isActive("link")
                    ? "Click to edit or remove link"
                    : "Add a hyperlink to selected text"}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Remove Link Button (only show when link is active) */}
          {editor.isActive("link") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLinkRemove}
                  className="relative hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-semibold">Remove Link</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Unlink selected text
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Math (LaTeX Prompt) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addMath}
              >
                <Sigma className="h-4 w-4 mr-1" />
                LaTeX
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert LaTeX (Prompt)</TooltipContent>
          </Tooltip>

          {/* Math (MathLive Visual Editor) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowMathLive(true)}
              >
                <Sigma className="h-4 w-4 mr-1" />
                Math
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Math (Visual Editor)</TooltipContent>
          </Tooltip>

          {/* Image - Enhanced with File Upload */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowImageDialog(true)}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Image
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Image</TooltipContent>
          </Tooltip>

          {/* Insert HTML - Sanitized */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setShowInsertHTML(true)}
              >
                <Code className="h-4 w-4 mr-1" />
                HTML
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert HTML Code (Sanitized)</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Phase 5.1: Audio Recording */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAudioRecorder(true)}
                title="Record Audio"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Record Audio</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          {/* Phase 5.2: Fullscreen Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className={
                  isFullscreen
                    ? "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
                    : ""
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F11)"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Table Toolbar - Shows when table is selected */}
        {editor && editor.isActive("table") && (
          <div className="flex-shrink-0 border-b dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-2 flex flex-wrap gap-1 items-center">
            <TableBubbleMenu editor={editor} />
          </div>
        )}

        {/* Editor Content - Scrollable Body */}
        <div
          onClick={() => editor?.chain().focus().run()}
          className={`cursor-text relative overflow-y-auto ${
            isFullscreen ? "flex-1" : ""
          }`}
          style={
            isFullscreen
              ? {}
              : {
                  height: `${editorHeight}px`,
                  minHeight: "150px",
                }
          }
        >
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none p-4"
          />
        </div>

        {/* Footer Section - Fixed at bottom */}
        <div className="flex-shrink-0 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 flex items-center justify-between gap-4">
          {/* Left: Active Tools Breadcrumb - DOM Hierarchy Path */}
          <div className="text-xs text-slate-600 dark:text-slate-400 flex-shrink-0 min-w-0">
            {activeTools.length > 0 ? (
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {activeTools.join(" › ")}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-500">body</span>
            )}
          </div>

          {/* Center/Right: Word Count Display */}
          <div className="text-xs text-slate-600 dark:text-slate-400 flex gap-4 flex-shrink-0">
            <span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {wordCount}
              </span>{" "}
              {wordCount === 1 ? "word" : "words"}
            </span>
            <span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {charCount}
              </span>{" "}
              {charCount === 1 ? "character" : "characters"}
            </span>
          </div>

          {/* Far Right: Resize Handle */}
          {!isFullscreen && (
            <div
              onMouseDown={handleResizeStart}
              className="w-5 h-5 cursor-nwse-resize group flex items-center justify-center select-none flex-shrink-0"
              style={{ touchAction: "none", userSelect: "none" }}
            >
              {/* Classic diagonal dots pattern - like textarea resize grip */}
              <svg
                className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors pointer-events-none"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                {/* Diagonal dots pattern */}
                <circle cx="13" cy="13" r="1.5" />
                <circle cx="9" cy="13" r="1.5" />
                <circle cx="13" cy="9" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="9" cy="9" r="1.5" />
                <circle cx="13" cy="5" r="1.5" />
              </svg>
            </div>
          )}
        </div>

        {/* MathLive Modal */}
        <MathLiveModal
          open={showMathLive}
          onClose={() => setShowMathLive(false)}
          onInsert={handleMathLiveInsert}
        />

        {/* Insert HTML Modal - Sanitized */}
        <InsertHTMLModal
          open={showInsertHTML}
          onClose={() => setShowInsertHTML(false)}
          onInsert={handleHTMLInsert}
        />

        {/* Phase 3.4: Link Dialog - Modern & Secure */}
        <LinkDialog
          open={showLinkDialog}
          onClose={() => setShowLinkDialog(false)}
          onInsert={handleLinkInsert}
          onRemove={handleLinkRemove}
          initialUrl={linkUrl}
          initialOpenInNewTab={linkOpenInNewTab}
          isEditMode={editor?.isActive("link") || false}
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

        {/* Phase 5.1: Audio Recorder Dialog */}
        <AudioRecorderDialog
          open={showAudioRecorder}
          onClose={() => setShowAudioRecorder(false)}
          onInsert={(audioUrl, fileName, duration, fileSize, allowDownload) => {
            if (editor) {
              editor
                .chain()
                .focus()
                .setAudio({
                  src: audioUrl,
                  fileName,
                  duration,
                  fileSize,
                  allowDownload,
                })
                .run();
            }
          }}
          questionId="temp"
        />
      </div>
    </TooltipProvider>
  );
}
