"use client";

import {
  Leaf,
  Briefcase,
  Sun,
  Camera,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { styles } from "@/lib/data";
import type { StyleId } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Leaf,
  Briefcase,
  Sun,
  Camera,
  Sparkles,
};

const colorMap: Record<string, { bg: string; icon: string; text: string; border: string }> = {
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600 bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-400",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600 bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-400",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600 bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-400",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600 bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-400",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-600 bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-400",
  },
};

interface StyleSelectorProps {
  selected: StyleId | null;
  onSelect: (id: StyleId) => void;
}

export default function StyleSelector({
  selected,
  onSelect,
}: StyleSelectorProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {styles.map((style) => {
          const Icon = iconMap[style.icon] || Sparkles;
          const colors = colorMap[style.color] || colorMap.purple;
          const isSelected = selected === style.id;

          return (
            <button
              key={style.id}
              id={`style-${style.id}`}
              onClick={() => onSelect(style.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center text-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2",
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-md`
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
              )}
            >
              {/* Selected */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  isSelected ? colors.icon : "bg-gray-100 text-gray-500"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <div>
                <p
                  className={cn(
                    "font-bold text-sm mb-1",
                    isSelected ? colors.text : "text-gray-800"
                  )}
                >
                  {style.title}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
