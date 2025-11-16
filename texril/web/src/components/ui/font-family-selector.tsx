"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronRight } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface FontOption {
  label: string;
  value: string;
  cssVariable?: string;
  weights?: string[];
  preview?: string;
}

interface FontFamilySelectorProps {
  editor: Editor;
}

// 🎨 Font Family Options with Weights
const fontFamilies: FontOption[] = [
  {
    label: "Default (Geist Sans)",
    value: "",
    preview: "The quick brown fox",
  },
  {
    label: "Arial",
    value: "Arial, sans-serif",
    preview: "The quick brown fox",
  },
  {
    label: "Times New Roman",
    value: "'Times New Roman', serif",
    preview: "The quick brown fox",
  },
  {
    label: "Georgia",
    value: "Georgia, serif",
    preview: "The quick brown fox",
  },
  {
    label: "Courier New",
    value: "'Courier New', monospace",
    preview: "The quick brown fox",
  },
  {
    label: "Verdana",
    value: "Verdana, sans-serif",
    preview: "The quick brown fox",
  },
  {
    label: "🇧🇩 হিন্দ সিলিগুড়ি (Hind Siliguri)",
    value: "var(--font-hind-siliguri), sans-serif",
    cssVariable: "--font-hind-siliguri",
    weights: ["300", "400", "500", "600", "700"],
    preview: "আমার সোনার বাংলা",
  },
  {
    label: "🇧🇩 নোটো সেরিফ বাংলা (Noto Serif Bengali)",
    value: "var(--font-noto-serif-bengali), serif",
    cssVariable: "--font-noto-serif-bengali",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    preview: "আমি তোমায় ভালোবাসি",
  },
];

// Font weight labels
const weightLabels: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
};

export function FontFamilySelector({ editor }: FontFamilySelectorProps) {
  const [selectedFont, setSelectedFont] = useState<FontOption | null>(null);
  const [showWeights, setShowWeights] = useState(false);

  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "";

  const handleFontSelect = (font: FontOption) => {
    if (font.weights && font.weights.length > 0) {
      // Font has weights - show weight selector
      setSelectedFont(font);
      setShowWeights(true);
    } else {
      // Font has no weights - apply directly
      applyFont(font.value, null);
    }
  };

  const applyFont = (fontFamily: string, weight: string | null) => {
    if (!fontFamily) {
      // Unset font family
      editor.chain().focus().unsetFontFamily().run();
      if (weight) {
        editor.chain().focus().unsetMark("textStyle").run();
      }
    } else {
      // Get current textStyle attributes to preserve other properties (color, etc.)
      const currentAttrs = editor.getAttributes("textStyle");

      // Build new attributes object
      const newAttrs: Record<string, any> = {
        ...currentAttrs,
        fontFamily: fontFamily,
      };

      // Add or remove fontWeight
      if (weight) {
        newAttrs.fontWeight = weight;
      } else {
        // Remove fontWeight if it exists
        delete newAttrs.fontWeight;
      }

      // Apply all attributes together using setMark
      // This ensures fontFamily and fontWeight are in the same <span> tag
      editor
        .chain()
        .focus()
        .setMark("textStyle", newAttrs)
        .run();
    }

    setShowWeights(false);
    setSelectedFont(null);
  };

  const handleWeightSelect = (weight: string) => {
    if (selectedFont) {
      console.log("Applying font:", selectedFont.value, "with weight:", weight);
      applyFont(selectedFont.value, weight);

      // Debug: Check if weight was applied
      setTimeout(() => {
        const attrs = editor.getAttributes("textStyle");
        console.log("Current textStyle attributes:", attrs);
      }, 100);
    }
  };

  const handleBack = () => {
    setShowWeights(false);
    setSelectedFont(null);
  };

  // Main font list view
  if (!showWeights) {
    return (
      <div className="w-72 max-h-96 overflow-y-auto">
        <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-950 z-10">
          <Label className="text-sm font-semibold">Font Family</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select a font for your text
          </p>
        </div>

        <div className="p-2 space-y-1">
          {fontFamilies.map((font) => {
            const isActive = currentFontFamily === font.value;

            return (
              <Button
                key={font.value}
                type="button"
                variant="ghost"
                size="sm"
                className={`w-full justify-between h-auto py-3 px-3 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onClick={() => handleFontSelect(font)}
              >
                <div className="flex flex-col items-start gap-1 flex-1">
                  <span className="text-sm font-medium">{font.label}</span>
                  {font.preview && (
                    <span
                      className="text-xs text-slate-500 dark:text-slate-400"
                      style={{ fontFamily: font.value || "inherit" }}
                    >
                      {font.preview}
                    </span>
                  )}
                  {font.weights && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {font.weights.length} weights available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  {font.weights && font.weights.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // Weight selector view
  return (
    <div className="w-72 max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-950 z-10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-2 -ml-2"
        >
          ← Back
        </Button>
        <Label className="text-sm font-semibold">{selectedFont?.label}</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select font weight
        </p>
      </div>

      <div className="p-2 space-y-1">
        {selectedFont?.weights?.map((weight) => (
          <Button
            key={weight}
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between h-auto py-3 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => handleWeightSelect(weight)}
          >
            <div className="flex flex-col items-start gap-1 flex-1">
              <span className="text-sm font-medium">
                {weightLabels[weight] || `Weight ${weight}`}
              </span>
              <span
                className="text-base"
                style={{
                  fontFamily: selectedFont.value,
                  fontWeight: weight,
                }}
              >
                {selectedFont.preview || "The quick brown fox"}
              </span>
            </div>
            <span className="text-xs text-slate-400">{weight}</span>
          </Button>
        ))}

        {/* Default weight option */}
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start h-auto py-3 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => applyFont(selectedFont?.value || "", null)}
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium">Default Weight</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Use font's default weight (400)
              </span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

