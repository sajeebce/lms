"use client";

import { Node, mergeAttributes, type Editor as TiptapEditor } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { Pencil } from "lucide-react";

// Custom HTML Block Node - Preserves inline styles
export const HTMLBlock = Node.create({
  name: "htmlBlock",

  group: "block",

  atom: true, // Treat as single unit (non-editable)

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-html-content") || "",
        renderHTML: (attributes) => {
          return {
            "data-html-content": attributes.html,
          };
        },
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          // Generate unique ID if not present
          if (!attributes.id) {
            attributes.id = `html-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
          return {
            "data-id": attributes.id,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-html-block]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-html-block": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HTMLBlockComponent);
  },
});

// React component to render HTML block
type HtmlBlockEditPayload = {
  html: string;
  id: string | null;
};

type EditorWithHtmlEdit = TiptapEditor & {
  __onHtmlBlockEdit?: (data: HtmlBlockEditPayload) => void;
};

function HTMLBlockComponent({ node, selected, editor }: NodeViewProps) {
  const handleEdit = () => {
    // Use per-editor callback stored on the TipTap editor instance
    // This avoids using global window state and works safely with multiple
    // RichTextEditor instances on the same page.
    const callback = (editor as EditorWithHtmlEdit).__onHtmlBlockEdit;

    if (callback) {
      callback({
        html: node.attrs.html,
        id: node.attrs.id,
      });
    } else {
      console.warn("HTMLBlock edit callback not found on editor instance");
    }
  };

  return (
    <NodeViewWrapper className="html-block-wrapper">
      <div className="relative group">
        {/* Edit button - shows on hover or when selected */}
        {(selected ?? false) && (
          <button
            onClick={handleEdit}
            className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md p-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Edit HTML"
          >
            <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </button>
        )}

        {/* HTML content */}
        <div
          className="html-block-content"
          dangerouslySetInnerHTML={{ __html: node.attrs.html }}
        />
      </div>
    </NodeViewWrapper>
  );
}
