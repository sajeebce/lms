"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Table as TableIcon } from "lucide-react";

interface TableTemplate {
  id: string;
  name: string;
  description: string;
  accentFrom: string;
  accentTo: string;
}

interface TableGridSelectorProps {
  onSelect: (rows: number, cols: number) => void;
  onTemplateSelect?: (templateId: string) => void;
  templates?: TableTemplate[];
}

export function TableGridSelector({
  onSelect,
  onTemplateSelect,
  templates = [],
}: TableGridSelectorProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [open, setOpen] = useState(false);

  const maxRows = 8;
  const maxCols = 10;

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
  };

  const handleCellClick = (row: number, col: number) => {
    onSelect(row + 1, col + 1);
    setOpen(false);
    setHoveredCell(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <TableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          {/* Grid */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
            {Array.from({ length: maxRows }).map((_, rowIndex) =>
              Array.from({ length: maxCols }).map((_, colIndex) => {
                const isHovered =
                  hoveredCell && rowIndex <= hoveredCell.row && colIndex <= hoveredCell.col;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-5 h-5 border-2 rounded-sm cursor-pointer transition-all duration-150
                      ${
                        isHovered
                          ? "bg-gradient-to-br from-violet-500 to-purple-600 border-violet-600 scale-110 shadow-md"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-violet-400"
                      }
                    `}
                    onMouseEnter={() => handleCellHover(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  />
                );
              })
            )}
          </div>

          {/* Label */}
          <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {hoveredCell
              ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1} Table`
              : "Select table size"}
          </div>
        </div>
        {templates.length > 0 && (
          <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Quick Templates
            </p>
            <div className="grid gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onTemplateSelect?.(template.id);
                    setOpen(false);
                    setHoveredCell(null);
                  }}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-r px-3 py-2 text-left transition hover:shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(120deg, ${template.accentFrom}, ${template.accentTo})`,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{template.name}</p>
                    <p className="text-xs text-white/80">{template.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-white/90 px-2 py-0.5 rounded-full bg-black/20">
                    Tap
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

