"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

const BUCKETS = [
    "product-images",
    "banner-images",
  ];

async function addWatermark(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = String(reader.result);
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 1200;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Không tạo được canvas"));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const text = "Ăn Vặt Ngọc Trinh";
      const subText = "anvatngoctrinh.vn";

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 3;

      const x = canvas.width - 24;
      const y = canvas.height - 52;

      ctx.font = "bold 24px Arial";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);

      ctx.font = "bold 16px Arial";
      ctx.strokeText(subText, x, y + 26);
      ctx.fillText(subText, x, y + 26);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Không xuất được ảnh"));

          resolve(
            new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" }
            )
          );
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = reject;
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageOptimizePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  function log(message: string) {
    setLogs((prev) => [message, ...prev]);
  }
  function getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  async function updateImageUrlInDatabase(
    bucket: string,
    oldUrl: string,
    newUrl: string
  ) {
    if (bucket === "product-images") {
      await supabase
        .from("products")
        .update({ image_url: newUrl })
        .eq("image_url", oldUrl);
    }
  
    if (bucket === "banner-images") {
      await supabase
        .from("banners")
        .update({ image_url: newUrl })
        .eq("image_url", oldUrl);
    }
  
    if (bucket === "posts") {
      await supabase
        .from("posts")
        .update({ image_url: newUrl })
        .eq("image_url", oldUrl);
    }
  }
 
  async function optimizeBucket(bucket: string) {
    log(`📁 Đang quét bucket ${bucket}`);
    const { data: files, error } = await supabase.storage.from(bucket).list("", {
      limit: 1000,
    });

    if (error) {
      log(`❌ ${bucket}: ${error.message}`);
      return;
    }
   
    for (const file of files || []) {
        log(`📸 Đang xử lý ${file.name}`);
      if (!file.name || file.name.endsWith(".emptyFolderPlaceholder")) continue;
      if (file.name.includes("-watermark")) continue;

      try {
        const { data: downloadData, error: downloadError } =
          await supabase.storage.from(bucket).download(file.name);

        if (downloadError || !downloadData) {
          log(`❌ Không tải được ${bucket}/${file.name}`);
          continue;
        }

        const rawFile = new File([downloadData], file.name, {
          type: downloadData.type || "image/jpeg",
        });

        const compressed = await imageCompression(rawFile, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.5,
          useWebWorker: true,
          fileType: "image/webp",
        });

        const watermarked = await addWatermark(compressed);

        const newPath = file.name.replace(/\.[^/.]+$/, "") + "-watermark.webp";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(newPath, watermarked, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/webp",
          });

        if (uploadError) {
          log(`❌ Upload lỗi ${bucket}/${newPath}: ${uploadError.message}`);
          continue;
        }

        const oldUrl = getPublicUrl(bucket, file.name);
const newUrl = getPublicUrl(bucket, newPath);

await updateImageUrlInDatabase(bucket, oldUrl, newUrl);

log(`✅ Đã xử lý và cập nhật DB ${bucket}/${file.name} → ${newPath}`);
      } catch (err) {
        log(`❌ Lỗi ${bucket}/${file.name}: ${String(err)}`);
      }
    }
  }

  async function runOptimize() {
    setRunning(true);
    setLogs([]);
    log("🚀 Bắt đầu xử lý ảnh cũ...");

    for (const bucket of BUCKETS) {
      await optimizeBucket(bucket);
    }

    log("🎉 Hoàn tất.");
    setRunning(false);
  }

  return (
    <main className="min-h-screen bg-[#F5FFF8] p-6">
      <div className="mx-auto max-w-3xl rounded-[28px] bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-black text-[#06113C]">
          Tối ưu ảnh cũ
        </h1>

        <p className="mt-2 text-sm font-bold text-neutral-500">
          Tool này tạo bản WebP + watermark cho ảnh trong products, banners,
          posts. Ảnh gốc vẫn được giữ lại.
        </p>

        <button
          onClick={runOptimize}
          disabled={running}
          className="mt-5 rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white disabled:opacity-60"
        >
          {running ? "Đang xử lý..." : "Bắt đầu tối ưu ảnh"}
        </button>

        <div className="mt-6 max-h-[480px] overflow-y-auto rounded-2xl bg-[#06113C] p-4 text-sm font-bold text-white">
          {logs.length === 0 ? (
            <p>Chưa chạy.</p>
          ) : (
            logs.map((item, index) => <p key={index}>{item}</p>)
          )}
        </div>
      </div>
    </main>
  );
}