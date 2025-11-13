"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Table as TableIcon } from "lucide-react";

interface TableGridSelectorProps {
  onSelect: (rows: number, cols: number) => void;
}

export function TableGridSelector({ onSelect }: TableGridSelectorProps) {
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
      </PopoverContent>
    </Popover>
  );
}

