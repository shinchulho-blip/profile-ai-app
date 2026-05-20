"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, ImageIcon, X, AlertCircle } from "lucide-react";
import { validateImageFile, fileToDataUrl } from "@/lib/utils";

interface PhotoUploaderProps {
  onImageUploaded: (dataUrl: string) => void;
  uploadedImage: string | null;
  onClear: () => void;
}

export default function PhotoUploader({
  onImageUploaded,
  uploadedImage,
  onClear,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "유효하지 않은 파일입니다.");
        return;
      }
      setIsLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        onImageUploaded(dataUrl);
      } catch {
        setError("파일을 읽는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [onImageUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div className="w-full">
      {uploadedImage ? (
        /* ── Preview State ────────────────────────────── */
        <div className="relative group rounded-2xl overflow-hidden border-2 border-violet-200 bg-gray-50 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={uploadedImage}
            alt="업로드된 원본 사진"
            className="w-full max-h-80 object-contain"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
            <button
              onClick={onClear}
              id="photo-clear-btn"
              aria-label="사진 제거"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-semibold text-gray-800 shadow-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              다른 사진 선택
            </button>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
            >
              <ImageIcon className="w-3 h-3" />
              사진 업로드 완료
            </span>
          </div>
        </div>
      ) : (
        /* ── Upload Zone ──────────────────────────────── */
        <div>
          <div
            id="photo-upload-zone"
            className={`upload-zone min-h-52 p-8 ${isDragging ? "drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="사진 업로드 영역. 클릭하거나 파일을 드래그하세요"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <p className="text-sm font-medium text-gray-500">
                  사진을 불러오는 중...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isDragging
                      ? "rgba(124, 58, 237, 0.15)"
                      : "rgba(124, 58, 237, 0.08)",
                    border: "2px dashed rgba(124, 58, 237, 0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <Upload
                    className="w-7 h-7"
                    style={{ color: "#7c3aed" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {isDragging
                      ? "여기에 놓으세요!"
                      : "클릭하거나 사진을 드래그하세요"}
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, WebP, HEIC · 최대 20MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}
