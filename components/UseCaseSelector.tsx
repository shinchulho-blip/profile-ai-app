"use client";

import {
  CreditCard,
  FileText,
  Linkedin,
  MessageCircle,
  Instagram,
  BookOpen,
  Building2,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases } from "@/lib/data";
import type { UseCaseId } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  CreditCard,
  FileText,
  Linkedin,
  MessageCircle,
  Instagram,
  BookOpen,
  Building2,
  FolderOpen,
};

interface UseCaseSelectorProps {
  selected: UseCaseId | null;
  onSelect: (id: UseCaseId) => void;
}

export default function UseCaseSelector({
  selected,
  onSelect,
}: UseCaseSelectorProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {useCases.map((uc) => {
          const Icon = iconMap[uc.icon] || CreditCard;
          const isSelected = selected === uc.id;

          return (
            <button
              key={uc.id}
              id={`usecase-${uc.id}`}
              onClick={() => onSelect(uc.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2",
                isSelected
                  ? "border-violet-400 bg-violet-50"
                  : "border-gray-100 bg-white hover:border-violet-200 hover:bg-gray-50"
              )}
              style={
                isSelected
                  ? { boxShadow: "0 4px 12px rgba(124,58,237,0.15)" }
                  : {}
              }
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
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

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-violet-800" : "text-gray-700"
                )}
              >
                {uc.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
