"use client";

import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import { CellSelection } from "@tiptap/pm/tables";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Plus,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Square,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

type BorderStyle = "solid" | "dashed" | "dotted" | "double";
type BackgroundScope = "cell" | "evenRows" | "oddRows";

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
  const [borderStyleOpen, setBorderStyleOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#ffffff");
  const [selectedCellsCount, setSelectedCellsCount] = useState(1);
  const [backgroundScope, setBackgroundScope] =
    useState<BackgroundScope>("cell");
  const [tableBorderWidth, setTableBorderWidth] = useState(2);
  const [tableBorderStyle, setTableBorderStyle] =
    useState<BorderStyle>("solid");
  const [tableBorderColor, setTableBorderColor] = useState("#cbd5e1");
  const [tableBorderRadius, setTableBorderRadius] = useState(0);
  const [pendingBorderWidth, setPendingBorderWidth] = useState(2);
  const [pendingBorderStyle, setPendingBorderStyle] =
    useState<BorderStyle>("solid");
  const [pendingBorderColor, setPendingBorderColor] = useState("#cbd5e1");
  const [pendingBorderRadius, setPendingBorderRadius] = useState(0);
  const [cellAlignment, setCellAlignmentState] = useState<
    "left" | "center" | "right"
  >("left");

  const getResolvedPosition = (): ResolvedPos | null => {
    if (!editor) return null;
    const selection: any = editor.state.selection;
    if (selection?.$anchorCell) {
      return selection.$anchorCell;
    }
    if (selection?.$from) {
      return selection.$from;
    }
    if (selection?.$anchor) {
      return selection.$anchor;
    }
    return null;
  };

  const findTableNode = () => {
    const resolved = getResolvedPosition();
    if (!resolved) return null;
    for (let depth = resolved.depth; depth > 0; depth--) {
      const node = resolved.node(depth);
      if (node.type.name === "table") {
        return {
          node,
          pos: resolved.before(depth),
        };
      }
    }
    return null;
  };

  const findFirstCellNode = () => {
    if (!editor) return null;
    const selection = editor.state.selection;
    if (selection instanceof CellSelection) {
      return {
        node: selection.$anchorCell.nodeAfter,
        pos: selection.$anchorCell.pos,
      };
    }
    const resolved = getResolvedPosition();
    if (!resolved) return null;
    for (let depth = resolved.depth; depth > 0; depth--) {
      const node = resolved.node(depth);
      if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
        return {
          node,
          pos: resolved.before(depth),
        };
      }
    }
    return null;
  };

  const updateTableAttributes = (
    attrs: Partial<{
      borderWidth: string;
      borderStyle: string;
      borderColor: string;
      borderRadius: string;
    }>
  ) => {
    if (!editor) return;
    const tableInfo = findTableNode();
    if (!tableInfo) return;

    const updatedAttrs = {
      ...tableInfo.node.attrs,
      ...attrs,
    };

    console.log("Updating table border attributes:", updatedAttrs);

    // Update table node attributes
    // Plugin will automatically sync DOM styles
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeMarkup(tableInfo.pos, undefined, updatedAttrs);
        return true;
      })
      .run();

    console.log("Table border attributes updated");
  };

  const applyCellAlignment = (alignment: "left" | "center" | "right") => {
    setCellAlignmentState(alignment);
    editor?.chain().focus().setCellAttribute("textAlign", alignment).run();
  };

  // Sync pending values when popover opens
  useEffect(() => {
    if (borderStyleOpen) {
      setPendingBorderWidth(tableBorderWidth);
      setPendingBorderStyle(tableBorderStyle);
      setPendingBorderColor(tableBorderColor);
      setPendingBorderRadius(tableBorderRadius);
    }
  }, [
    borderStyleOpen,
    tableBorderWidth,
    tableBorderStyle,
    tableBorderColor,
    tableBorderRadius,
  ]);

  useEffect(() => {
    if (!editor) return;

    const updateTableState = () => {
      const { state } = editor;
      const { selection } = state;

      if (selection instanceof CellSelection) {
        setSelectedCellsCount(selection.ranges.length);
      } else {
        setSelectedCellsCount(1);
      }

      const tableInfo = findTableNode();
      if (tableInfo) {
        const width =
          parseInt((tableInfo.node.attrs.borderWidth as string) || "2", 10) ||
          2;
        const style = ((tableInfo.node.attrs.borderStyle as BorderStyle) ||
          "solid") as BorderStyle;
        const color = (tableInfo.node.attrs.borderColor as string) || "#cbd5e1";
        const radius =
          parseInt((tableInfo.node.attrs.borderRadius as string) || "0", 10) ||
          0;

        setTableBorderWidth(width);
        setTableBorderStyle(style);
        setTableBorderColor(color);
        setTableBorderRadius(radius);

        // Also update pending values
        setPendingBorderWidth(width);
        setPendingBorderStyle(style);
        setPendingBorderColor(color);
        setPendingBorderRadius(radius);
      }

      const cellInfo = findFirstCellNode();
      if (cellInfo) {
        setCellAlignmentState(
          ((cellInfo.node.attrs.textAlign as "left" | "center" | "right") ||
            "left") ??
            "left"
        );
      }
    };

    editor.on("selectionUpdate", updateTableState);
    editor.on("transaction", updateTableState);

    return () => {
      editor.off("selectionUpdate", updateTableState);
      editor.off("transaction", updateTableState);
    };
  }, [editor]);

  if (!editor) return null;

  const applyRowBackground = (color: string, mode: "even" | "odd") => {
    const tableInfo = findTableNode();
    if (!tableInfo) return;

    const { node: tableNode, pos: tablePos } = tableInfo;

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        let bodyRowIndex = 0;

        tableNode.forEach((rowNode, rowOffset) => {
          let isHeaderRow = false;

          rowNode.forEach((cellNode) => {
            if (cellNode.type.name === "tableHeader") {
              isHeaderRow = true;
            }
          });

          if (isHeaderRow) {
            return;
          }

          const isTargetRow =
            (mode === "even" && bodyRowIndex % 2 === 1) ||
            (mode === "odd" && bodyRowIndex % 2 === 0);

          const rowPos = tablePos + 1 + rowOffset;

          if (isTargetRow) {
            rowNode.forEach((cellNode, cellOffset) => {
              const cellPos = rowPos + 1 + cellOffset;
              tr.setNodeMarkup(cellPos, undefined, {
                ...cellNode.attrs,
                backgroundColor: color,
              });
            });
          }

          bodyRowIndex += 1;
        });

        return true;
      })
      .run();
  };

  const setCellBackground = (color: string) => {
    if (!editor) return;

    // Row scopes: apply to all matching body rows at once
    if (backgroundScope === "evenRows" || backgroundScope === "oddRows") {
      applyRowBackground(
        color,
        backgroundScope === "evenRows" ? "even" : "odd"
      );
      setColorPickerOpen(false);
      return;
    }

    const { state } = editor;
    const { selection } = state;

    console.log("setCellBackground called:", {
      color,
      selectionType: selection.constructor.name,
      isCellSelection: selection instanceof CellSelection,
    });

    // Prefer the built-in TipTap command – it already supports CellSelection
    const applied = editor
      .chain()
      .focus()
      .setCellAttribute("backgroundColor", color)
      .run();

    if (!applied) {
      console.log("setCellAttribute did not apply, using manual fallback");

      if (selection instanceof CellSelection) {
        // Fallback for multi-cell selections
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            (selection as CellSelection).forEachCell(
              (node: ProseMirrorNode, pos: number) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  backgroundColor: color,
                });
              }
            );
            return true;
          })
          .run();
      } else {
        // Fallback for single cell selections
        const { $from } = selection;

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);

          if (
            node.type.name === "tableCell" ||
            node.type.name === "tableHeader"
          ) {
            const cellPos = $from.before(depth);
            editor
              .chain()
              .focus()
              .command(({ tr }) => {
                tr.setNodeMarkup(cellPos, undefined, {
                  ...node.attrs,
                  backgroundColor: color,
                });
                return true;
              })
              .run();
            break;
          }
        }
      }
    }

    setColorPickerOpen(false);
  };

  const handleBorderWidthChange = (value: number) => {
    setPendingBorderWidth(value);
  };

  const handleBorderColorChange = (color: string) => {
    setPendingBorderColor(color);
  };

  const handleBorderStyleChange = (style: BorderStyle) => {
    setPendingBorderStyle(style);
  };

  const applyBorderChanges = () => {
    console.log("Applying border changes:", {
      width: `${pendingBorderWidth}px`,
      style: pendingBorderStyle,
      color: pendingBorderColor,
      radius: `${pendingBorderRadius}px`,
    });

    setTableBorderWidth(pendingBorderWidth);
    setTableBorderStyle(pendingBorderStyle);
    setTableBorderColor(pendingBorderColor);
    setTableBorderRadius(pendingBorderRadius);

    updateTableAttributes({
      borderWidth: `${pendingBorderWidth}px`,
      borderStyle: pendingBorderStyle,
      borderColor: pendingBorderColor,
      borderRadius: `${pendingBorderRadius}px`,
    });

    // Close the popover after applying
    setBorderStyleOpen(false);
  };

  return (
    <>
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Cell Background
              </p>
              {selectedCellsCount > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 font-semibold">
                  {selectedCellsCount} cells
                </span>
              )}
            </div>

            {/* Apply scope: cell / even / odd */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Apply to
              </span>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/60">
                {(
                  [
                    {
                      value: "cell",
                      label: "Cell",
                      tooltip: "Only selected cell(s)",
                    },
                    {
                      value: "evenRows",
                      label: "Even",
                      tooltip: "Even body rows (start after header)",
                    },
                    {
                      value: "oddRows",
                      label: "Odd",
                      tooltip: "Odd body rows (start after header)",
                    },
                  ] as const
                ).map((option) => (
                  <Tooltip key={option.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setBackgroundScope(option.value)}
                        className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          backgroundScope === option.value
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        {option.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span className="text-xs">{option.tooltip}</span>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

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
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

      <div className="flex items-center gap-1" title="Cell alignment">
        {[
          {
            value: "left",
            icon: <AlignLeft className="h-4 w-4" />,
            label: "Align left",
          },
          {
            value: "center",
            icon: <AlignCenter className="h-4 w-4" />,
            label: "Align center",
          },
          {
            value: "right",
            icon: <AlignRight className="h-4 w-4" />,
            label: "Align right",
          },
        ].map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 px-2 transition ${
              cellAlignment === option.value
                ? "bg-slate-200 dark:bg-slate-700"
                : ""
            }`}
            onClick={() =>
              applyCellAlignment(option.value as "left" | "center" | "right")
            }
            aria-label={option.label}
          >
            {option.icon}
          </Button>
        ))}
      </div>

      <Popover open={borderStyleOpen} onOpenChange={setBorderStyleOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            title="Table border styles"
          >
            <Square className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 space-y-4" align="end">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Border Width
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={8}
                value={pendingBorderWidth}
                onChange={(e) =>
                  handleBorderWidthChange(Number(e.target.value))
                }
                className="flex-1 accent-violet-600"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-10">
                {pendingBorderWidth}px
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Border Color
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={pendingBorderColor}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="w-12 h-12 rounded border border-slate-300 dark:border-slate-700"
              />
              <input
                type="text"
                value={pendingBorderColor}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="flex-1 text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Border Style
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(["solid", "dashed", "dotted", "double"] as BorderStyle[]).map(
                (style) => (
                  <Button
                    key={style}
                    type="button"
                    variant={
                      pendingBorderStyle === style ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleBorderStyleChange(style)}
                  >
                    <span
                      className="w-full h-4 rounded"
                      style={{
                        borderStyle: style as any,
                        borderColor: pendingBorderColor,
                        borderWidth: 2,
                        borderTopWidth: 2,
                        borderBottomWidth: 2,
                      }}
                    />
                  </Button>
                )
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Corners
            </p>
            <div className="inline-flex items-center gap-2">
              {[0, 8].map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={
                    pendingBorderRadius === value ? "default" : "outline"
                  }
                  onClick={() => setPendingBorderRadius(value)}
                >
                  {value === 0 ? "Square" : "Rounded"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" size="sm" onClick={applyBorderChanges}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
