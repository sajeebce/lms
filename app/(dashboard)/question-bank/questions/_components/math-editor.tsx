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
        renderHTML: (attributes) => {
          if (!attributes.border || attributes.border === "none") return {};
          return { "data-border": attributes.border };
        },
      },
      borderColor: {
        default: "#d1d5db",
        renderHTML: (attributes) => {
          if (!attributes.borderColor) return {};
          return { "data-border-color": attributes.borderColor };
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
      const container = document.createElement("div");
      container.className = "image-wrapper";
      container.style.position = "relative";
      container.style.display = "block";
      container.style.maxWidth = "100%";
      container.style.margin = "10px 0";
      container.style.textAlign = node.attrs.textAlign || "center";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.title = node.attrs.title || "";
      if (node.attrs.width) {
        img.width = node.attrs.width;
        img.style.width = node.attrs.width + "px";
      }
      if (node.attrs.height) {
        img.height = node.attrs.height;
        img.style.height = node.attrs.height + "px";
      }
      img.style.maxWidth = "100%";
      // Remove height: auto to allow manual height control
      img.style.cursor = "pointer";
      img.style.display = "inline-block";
      img.style.transition = "all 0.2s ease";

      // Apply border style with custom color
      const borderStyle = node.attrs.border || "none";
      const borderColor = node.attrs.borderColor || "#d1d5db";
      if (borderStyle === "thin") {
        img.style.border = `1px solid ${borderColor}`;
      } else if (borderStyle === "medium") {
        img.style.border = `2px solid ${borderColor}`;
      } else if (borderStyle === "thick") {
        img.style.border = `4px solid ${borderColor}`;
      } else {
        img.style.border = "none";
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
        const fileId = node.attrs["data-file-id"];
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
            to: getPos() + node.nodeSize,
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
        const imageData = {
          src: node.attrs.src,
          alt: node.attrs.alt,
          description: node.attrs.description,
          width: node.attrs.width,
          height: node.attrs.height,
          textAlign: node.attrs.textAlign,
          border: node.attrs.border,
          borderColor: node.attrs.borderColor,
          fileId: node.attrs["data-file-id"],
          pos: typeof getPos === "function" ? getPos() : null,
        };

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

      toolbar.appendChild(deleteBtn);
      toolbar.appendChild(divider1);
      toolbar.appendChild(editBtn);
      toolbar.appendChild(divider2);
      toolbar.appendChild(alignLeftBtn);
      toolbar.appendChild(alignCenterBtn);
      toolbar.appendChild(alignRightBtn);

      // Phase 1.1: Resize handles (8 handles: 4 corners + 4 edges)
      const createHandle = (
        position: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"
      ) => {
        const handle = document.createElement("div");
        handle.className = `resize-handle-${position}`;
        handle.style.position = "absolute";
        handle.style.background = "#4F46E5";
        handle.style.border = "2px solid white";
        handle.style.display = "none";
        handle.style.zIndex = "10";

        // Corner handles (circles)
        if (["nw", "ne", "sw", "se"].includes(position)) {
          handle.style.width = "10px";
          handle.style.height = "10px";
          handle.style.borderRadius = "50%";
          handle.style.cursor =
            position === "nw" || position === "se"
              ? "nwse-resize"
              : "nesw-resize";
        }
        // Edge handles (rectangles)
        else {
          if (position === "n" || position === "s") {
            handle.style.width = "40px";
            handle.style.height = "6px";
            handle.style.cursor = "ns-resize";
          } else {
            handle.style.width = "6px";
            handle.style.height = "40px";
            handle.style.cursor = "ew-resize";
          }
          handle.style.borderRadius = "3px";
        }

        // Position handles
        if (position === "nw") {
          handle.style.top = "-5px";
          handle.style.left = "-5px";
        } else if (position === "ne") {
          handle.style.top = "-5px";
          handle.style.right = "-5px";
        } else if (position === "sw") {
          handle.style.bottom = "-5px";
          handle.style.left = "-5px";
        } else if (position === "se") {
          handle.style.bottom = "-5px";
          handle.style.right = "-5px";
        } else if (position === "n") {
          handle.style.top = "-3px";
          handle.style.left = "50%";
          handle.style.transform = "translateX(-50%)";
        } else if (position === "s") {
          handle.style.bottom = "-3px";
          handle.style.left = "50%";
          handle.style.transform = "translateX(-50%)";
        } else if (position === "e") {
          handle.style.right = "-3px";
          handle.style.top = "50%";
          handle.style.transform = "translateY(-50%)";
        } else if (position === "w") {
          handle.style.left = "-3px";
          handle.style.top = "50%";
          handle.style.transform = "translateY(-50%)";
        }

        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        let aspectRatio = 1;

        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          startX = e.clientX;
          startY = e.clientY;
          startWidth = img.width || img.offsetWidth;
          startHeight = img.height || img.offsetHeight;
          aspectRatio = startWidth / startHeight;

          const onMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            // Diagonal handles (corners): maintain aspect ratio
            if (["nw", "ne", "sw", "se"].includes(position)) {
              if (position === "ne" || position === "se") {
                newWidth = startWidth + deltaX;
              } else {
                newWidth = startWidth - deltaX;
              }
              newHeight = newWidth / aspectRatio; // Maintain ratio
            }
            // Left/Right edge handles: FREE resize (width only, height stays same)
            else if (position === "e" || position === "w") {
              if (position === "e") {
                newWidth = startWidth + deltaX;
              } else {
                newWidth = startWidth - deltaX;
              }
              // Height stays same - NO ratio maintenance
              newHeight = startHeight;
            }
            // Top/Bottom edge handles: FREE resize (height only, width stays same)
            else if (position === "n" || position === "s") {
              if (position === "s") {
                newHeight = startHeight + deltaY;
              } else {
                newHeight = startHeight - deltaY;
              }
              // Width stays same - NO ratio maintenance
              newWidth = startWidth;
            }

            if (newWidth > 50 && newWidth <= 1200 && newHeight > 50) {
              // Use style.width and style.height for full control (no auto ratio)
              img.style.width = newWidth + "px";
              img.style.height = newHeight + "px";
              img.width = newWidth;
              img.height = newHeight;
              if (typeof getPos === "function") {
                editor.commands.updateAttributes("image", {
                  width: newWidth,
                  height: newHeight,
                });
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

      // Create all 8 handles
      const handleNW = createHandle("nw");
      const handleNE = createHandle("ne");
      const handleSW = createHandle("sw");
      const handleSE = createHandle("se");
      const handleN = createHandle("n");
      const handleS = createHandle("s");
      const handleE = createHandle("e");
      const handleW = createHandle("w");

      // Click to select
      let isSelected = false;
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof getPos === "function") {
          editor.commands.setNodeSelection(getPos());
          isSelected = true;
          selectionBorder.style.display = "block";
          toolbar.style.display = "flex";
          // Show all 8 handles
          handleNW.style.display = "block";
          handleNE.style.display = "block";
          handleSW.style.display = "block";
          handleSE.style.display = "block";
          handleN.style.display = "block";
          handleS.style.display = "block";
          handleE.style.display = "block";
          handleW.style.display = "block";
        }
      });

      // Deselect on outside click
      const handleOutsideClick = (e: MouseEvent) => {
        if (!container.contains(e.target as Node)) {
          isSelected = false;
          selectionBorder.style.display = "none";
          toolbar.style.display = "none";
          // Hide all 8 handles
          handleNW.style.display = "none";
          handleNE.style.display = "none";
          handleSW.style.display = "none";
          handleSE.style.display = "none";
          handleN.style.display = "none";
          handleS.style.display = "none";
          handleE.style.display = "none";
          handleW.style.display = "none";
        }
      };
      document.addEventListener("click", handleOutsideClick);

      // Description caption (if exists)
      let descriptionCaption: HTMLDivElement | null = null;
      if (node.attrs.description) {
        descriptionCaption = document.createElement("div");
        descriptionCaption.className = "image-description";
        descriptionCaption.textContent = node.attrs.description;
        descriptionCaption.style.fontSize = "14px";
        descriptionCaption.style.color = "#6b7280";
        descriptionCaption.style.marginTop = "8px";
        descriptionCaption.style.fontStyle = "italic";
        descriptionCaption.style.textAlign = node.attrs.textAlign || "center";
        descriptionCaption.style.padding = "0 4px";
      }

      container.appendChild(selectionBorder);
      container.appendChild(img);
      if (descriptionCaption) {
        container.appendChild(descriptionCaption);
      }
      container.appendChild(toolbar);
      // Append all 8 handles
      container.appendChild(handleNW);
      container.appendChild(handleNE);
      container.appendChild(handleSW);
      container.appendChild(handleSE);
      container.appendChild(handleN);
      container.appendChild(handleS);
      container.appendChild(handleE);
      container.appendChild(handleW);

      return {
        dom: container,
        update(updatedNode) {
          // Only update if it's the same image node type
          if (updatedNode.type.name !== "image") return false;

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

          return true;
        },
        destroy() {
          document.removeEventListener("click", handleOutsideClick);
        },
      };
    };
  },
});

type MathEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export default function MathEditor({
  value,
  onChange,
  placeholder = "Type here...",
  minHeight = "200px",
}: MathEditorProps) {
  const [showMathLive, setShowMathLive] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [editingImageData, setEditingImageData] = useState<any>(null);
  const wasMathLiveOpen = useRef(false);

  const editor = useEditor({
    immediatelyRender: false, // ✅ Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (we use lowlight)
        underline: false, // Avoid duplicate underline extension
      }),
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

        {/* Phase 3.2: Horizontal Rule */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Line"
        >
          <Minus className="h-4 w-4" />
        </Button>

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
