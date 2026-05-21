"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, ImageIcon } from "lucide-react";

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  url?: string;
  publicId?: string;
  error?: string;
}

interface UploadZoneProps {
  projectName: string;
  onUploadComplete: () => void; // 업로드 완료 시 갤러리 새로고침
}

export default function UploadZone({ projectName, onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    const uploads: UploadFile[] = imageFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploads]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (uf: UploadFile, idx: number): Promise<void> => {
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, status: "uploading", progress: 10 } : f))
    );

    try {
      const fd = new FormData();
      fd.append("file", uf.file);
      fd.append("upload_preset", PRESET);
      // 원본 사이즈 유지 — transformation 없음
      fd.append("folder", `profileai/${projectName}/originals`);
      // 파일명 유지 (확장자 제거)
      const baseName = uf.file.name.replace(/\.[^.]+$/, "");
      fd.append("public_id", baseName);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: "POST", body: fd }
      );

      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();

      setFiles((prev) =>
        prev.map((f, i) =>
          i === idx
            ? { ...f, status: "done", progress: 100, url: data.secure_url, publicId: data.public_id }
            : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, status: "error", error: (err as Error).message } : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;
    setIsUploading(true);

    // 3장씩 병렬 업로드
    const batchSize = 3;
    const allIndexes = files
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.status === "pending")
      .map(({ i }) => i);

    for (let b = 0; b < allIndexes.length; b += batchSize) {
      const batch = allIndexes.slice(b, b + batchSize);
      await Promise.all(batch.map((idx) => uploadFile(files[idx], idx)));
    }

    setIsUploading(false);
    onUploadComplete();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-violet-600" />
          사진 업로드
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {/* 드래그앤드롭 영역 */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging ? "border-violet-400 bg-violet-50" : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          id="upload-drop-zone"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">
            {isDragging ? "여기에 놓으세요!" : "클릭하거나 사진을 드래그하세요"}
          </p>
          <p className="text-xs text-gray-400 mt-1">여러 장 동시 선택 가능 · 원본 사이즈 그대로 저장</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((uf, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 flex-1 truncate">{uf.file.name}</span>
                <span className="text-xs text-gray-400">
                  {(uf.file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                {uf.status === "uploading" && (
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin flex-shrink-0" />
                )}
                {uf.status === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
                {uf.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                {uf.status === "pending" && (
                  <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 업로드 버튼 */}
        {pendingCount > 0 && (
          <button
            id="upload-all-btn"
            onClick={handleUploadAll}
            disabled={isUploading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                업로드 중...
              </span>
            ) : (
              `${pendingCount}장 업로드하기`
            )}
          </button>
        )}

        {doneCount > 0 && pendingCount === 0 && (
          <p className="text-center text-sm text-emerald-600 font-medium">
            ✓ {doneCount}장 업로드 완료
          </p>
        )}
      </div>
    </div>
  );
}
