"use client";

import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CellSelection } from "@tiptap/pm/tables";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Plus,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useRef } from "react";

interface TableBubbleMenuProps {
  editor: Editor;
}

const PRESET_COLORS = [
  { name: "None", value: "transparent" },
  { name: "Light Blue", value: "#dbeafe" },
  { name: "Light Green", value: "#dcfce7" },
  { name: "Light Yellow", value: "#fef9c3" },
  { name: "Light Red", value: "#fee2e2" },
  { name: "Light Purple", value: "#f3e8ff" },
  { name: "Light Orange", value: "#fed7aa" },
  { name: "Light Pink", value: "#fce7f3" },
  { name: "Light Gray", value: "#f3f4f6" },
];

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [customColor, setCustomColor] = useState("#ffffff");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateVisibility = () => {
      const isTableActive = editor.isActive("table");
      setIsVisible(isTableActive);

      if (isTableActive) {
        // Get table element position
        const { view } = editor;
        const { from } = view.state.selection;
        const tableNode = view.domAtPos(from);
        const tableElement = (tableNode.node as HTMLElement).closest("table");

        if (tableElement) {
          const rect = tableElement.getBoundingClientRect();
          setPosition({
            top: rect.bottom + window.scrollY + 8, // 8px below table
            left: rect.left + rect.width / 2 + window.scrollX,
          });
        }
      }
    };

    editor.on("selectionUpdate", updateVisibility);
    editor.on("transaction", updateVisibility);

    return () => {
      editor.off("selectionUpdate", updateVisibility);
      editor.off("transaction", updateVisibility);
    };
  }, [editor]);

  if (!editor || !isVisible) return null;

  const setCellBackground = (color: string) => {
    if (!editor) return;

    const applied = editor.chain().focus().setCellAttribute("backgroundColor", color).run();

    if (!applied) {
      const { state, view } = editor;
      const { selection } = state;

      if (selection instanceof CellSelection) {
        const tr = state.tr;
        selection.forEachCell((node: ProseMirrorNode, pos: number) => {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            backgroundColor: color,
          });
        });
        view.dispatch(tr);
      } else {
        const { $from } = selection;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);

          if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
            const cellPos = $from.before(depth);
            const tr = state.tr.setNodeMarkup(cellPos, undefined, {
              ...node.attrs,
              backgroundColor: color,
            });
            view.dispatch(tr);
            break;
          }
        }
      }
    }

    setColorPickerOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center gap-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Add Row Above */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="h-8 px-2"
        title="Add row above"
      >
        <Plus className="h-4 w-4 rotate-0" />
        <span className="ml-1 text-xs">Row ↑</span>
      </Button>

      {/* Add Row Below */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="h-8 px-2"
        title="Add row below"
      >
        <Plus className="h-4 w-4" />
        <span className="ml-1 text-xs">Row ↓</span>
      </Button>

      {/* Add Column Before */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="h-8 px-2"
        title="Add column before"
      >
        <Plus className="h-4 w-4" />
        <span className="ml-1 text-xs">Col ←</span>
      </Button>

      {/* Add Column After */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="h-8 px-2"
        title="Add column after"
      >
        <Plus className="h-4 w-4" />
        <span className="ml-1 text-xs">Col →</span>
      </Button>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Delete Row */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        title="Delete row"
      >
        <Trash2 className="h-4 w-4" />
        <span className="ml-1 text-xs">Row</span>
      </Button>

      {/* Delete Column */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        title="Delete column"
      >
        <Trash2 className="h-4 w-4" />
        <span className="ml-1 text-xs">Col</span>
      </Button>

      {/* Delete Table */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        title="Delete table"
      >
        <Table className="h-4 w-4" />
        <Trash2 className="h-3 w-3 -ml-1" />
      </Button>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Merge Cells */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().mergeCells().run()}
        disabled={!editor.can().mergeCells()}
        className="h-8 px-2 disabled:opacity-30"
        title="Merge cells"
      >
        <TableCellsMerge className="h-4 w-4" />
      </Button>

      {/* Split Cell */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().splitCell().run()}
        disabled={!editor.can().splitCell()}
        className="h-8 px-2 disabled:opacity-30"
        title="Split cell"
      >
        <TableCellsSplit className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Cell Background Color */}
      <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            title="Cell background color"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cell Background
            </p>

            {/* Preset Colors */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setCellBackground(color.value)}
                  className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Custom Color
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-12 h-12 rounded border-2 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#ffffff"
                    className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCellBackground(customColor)}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
