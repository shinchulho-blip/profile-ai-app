"use client";

import {
  User,
  UserSquare2,
  PersonStanding,
  Wand2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { photoTypes } from "@/lib/data";
import type { PhotoTypeId } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  User: User,
  UserSquare: UserSquare2,
  PersonStanding: PersonStanding,
  Wand2: Wand2,
};

interface PhotoTypeSelectorProps {
  selected: PhotoTypeId | null;
  onSelect: (id: PhotoTypeId) => void;
}

export default function PhotoTypeSelector({
  selected,
  onSelect,
}: PhotoTypeSelectorProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photoTypes.map((type) => {
          const Icon = iconMap[type.icon] || User;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              id={`photo-type-${type.id}`}
              onClick={() => onSelect(type.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2",
                isSelected
                  ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-100"
                  : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-sm"
              )}
              style={
                isSelected
                  ? { boxShadow: "0 4px 16px rgba(124,58,237,0.15), 0 0 0 3px rgba(124,58,237,0.1)" }
                  : {}
              }
            >
              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-violet-600" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                  isSelected ? "bg-violet-600" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isSelected ? "text-white" : "text-gray-600"
                  )}
                />
              </div>

              {/* Title & Description */}
              <h3
                className={cn(
                  "font-bold text-sm mb-1 leading-tight",
                  isSelected ? "text-violet-900" : "text-gray-900"
                )}
              >
                {type.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                {type.description}
              </p>

              {/* Use case tags */}
              <div className="flex flex-wrap gap-1.5">
                {type.useCases.slice(0, 3).map((uc) => (
                  <span
                    key={uc}
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      isSelected
                        ? "bg-violet-100 text-violet-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {uc}
                  </span>
                ))}
                {type.useCases.length > 3 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{type.useCases.length - 3}
                  </span>
                )}
              </div>

              {/* Processing steps - shown when selected */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-violet-100">
                  <p className="text-xs font-semibold text-violet-700 mb-2 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    적용될 보정
                  </p>
                  <ul className="space-y-1">
                    {type.processingSteps.map((step) => (
                      <li
                        key={step}
                        className="text-xs text-violet-600 flex items-center gap-1.5"
                      >
                        <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ratio preview */}
      {selected && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-xs text-gray-500 font-medium">추천 비율</span>
          <div className="flex gap-2">
            {photoTypes
              .find((t) => t.id === selected)
              ?.ratios.map((ratio) => (
                <span
                  key={ratio}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-violet-200 text-violet-700 shadow-sm"
                >
                  {ratio}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
