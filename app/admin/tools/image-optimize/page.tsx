"use client";

import Link from "next/link";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";

const BUCKETS = ["product-images", "banner-images"];

type OptimizeStats = {
  scanned: number;
  processed: number;
  skipped: number;
  failed: number;
};

const defaultStats: OptimizeStats = {
  scanned: 0,
  processed: 0,
  skipped: 0,
  failed: 0,
};

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
      if (!ctx) {
        reject(new Error("Không tạo được canvas"));
        return;
      }

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
          if (!blob) {
            reject(new Error("Không xuất được ảnh"));
            return;
          }

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
  const [stats, setStats] = useState<OptimizeStats>(defaultStats);

  function log(message: string) {
    setLogs((prev) => [message, ...prev]);
  }

  function updateStats(key: keyof OptimizeStats, amount = 1) {
    setStats((prev) => ({
      ...prev,
      [key]: prev[key] + amount,
    }));
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
      const { error } = await supabase
        .from("products")
        .update({ image_url: newUrl })
        .eq("image_url", oldUrl);

      if (error) throw new Error(error.message);
    }

    if (bucket === "banner-images") {
      const { error } = await supabase
        .from("banners")
        .update({ image_url: newUrl })
        .eq("image_url", oldUrl);

      if (error) throw new Error(error.message);
    }
  }

  function getFolderByBucket(bucket: string) {
    if (bucket === "product-images") return "products";
    if (bucket === "banner-images") return "banners";
    return "";
  }

  async function optimizeBucket(bucket: string) {
    const folder = getFolderByBucket(bucket);

    if (!folder) {
      log(`⚠️ Không xác định được folder cho bucket ${bucket}`);
      return;
    }

    log(`📁 Đang quét bucket ${bucket}/${folder}`);

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 1000,
      });

    if (error) {
      log(`❌ ${bucket}: ${error.message}`);
      updateStats("failed");
      return;
    }

    if (!files || files.length === 0) {
      log(`ℹ️ ${bucket}/${folder}: Không có ảnh để xử lý`);
      return;
    }

    for (const file of files) {
      updateStats("scanned");

      if (!file.name || file.name.endsWith(".emptyFolderPlaceholder")) {
        updateStats("skipped");
        continue;
      }

      if (file.name.includes("-watermark")) {
        updateStats("skipped");
        log(`⏭️ Bỏ qua ảnh đã xử lý: ${bucket}/${folder}/${file.name}`);
        continue;
      }

      log(`📸 Đang xử lý ${bucket}/${folder}/${file.name}`);

      try {
        const filePath = `${folder}/${file.name}`;

        const { data: downloadData, error: downloadError } =
          await supabase.storage.from(bucket).download(filePath);

        if (downloadError || !downloadData) {
          updateStats("failed");
          log(`❌ Không tải được ${bucket}/${folder}/${file.name}`);
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

        const newFileName =
          file.name.replace(/\.[^/.]+$/, "") + "-watermark.webp";

        const newFilePath = `${folder}/${newFileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(newFilePath, watermarked, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/webp",
          });

        if (uploadError) {
          updateStats("failed");
          log(`❌ Upload lỗi ${bucket}/${newFilePath}: ${uploadError.message}`);
          continue;
        }

        const oldUrl = getPublicUrl(bucket, filePath);
        const newUrl = getPublicUrl(bucket, newFilePath);

        await updateImageUrlInDatabase(bucket, oldUrl, newUrl);

        updateStats("processed");
        log(`✅ Đã xử lý và cập nhật DB: ${file.name} → ${newFileName}`);
      } catch (err) {
        updateStats("failed");
        log(`❌ Lỗi ${bucket}/${folder}/${file.name}: ${String(err)}`);
      }
    }
  }

  async function runOptimize() {
    if (running) return;

    setRunning(true);
    setLogs([]);
    setStats(defaultStats);

    log("🚀 Bắt đầu tối ưu ảnh cũ...");

    for (const bucket of BUCKETS) {
      await optimizeBucket(bucket);
    }

    log("🎉 Hoàn tất tối ưu ảnh.");
    setRunning(false);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Tối ưu ảnh
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Chuyển ảnh cũ sang WebP, giảm dung lượng và thêm watermark thương
            hiệu cho sản phẩm, banner.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tools"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white shadow-lg"
          >
            Công cụ
          </Link>

          <button
            type="button"
            onClick={runOptimize}
            disabled={running}
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25 disabled:opacity-60"
          >
            {running ? "Đang xử lý..." : "Bắt đầu tối ưu"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Đã quét",
            value: stats.scanned,
            note: "Tổng file tìm thấy",
          },
          {
            label: "Đã xử lý",
            value: stats.processed,
            note: "Ảnh đã tạo WebP + watermark",
          },
          {
            label: "Bỏ qua",
            value: stats.skipped,
            note: "Ảnh đã xử lý hoặc file rỗng",
          },
          {
            label: "Lỗi",
            value: stats.failed,
            note: "File xử lý thất bại",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-neutral-400">{item.label}</p>

            <p
              className={`mt-2 text-3xl font-black ${
                item.label === "Lỗi" ? "text-red-600" : "text-[#06113C]"
              }`}
            >
              {item.value}
            </p>

            <p className="mt-2 text-xs font-bold text-neutral-400">
              {item.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <section className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <h2 className="text-2xl font-black text-[#06113C]">
            Cấu hình xử lý
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
            Công cụ sẽ quét ảnh trong Supabase Storage, tạo ảnh mới dạng WebP,
            thêm watermark và cập nhật đường dẫn ảnh trong database.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                title: "Bucket sản phẩm",
                desc: "product-images/products",
              },
              {
                title: "Bucket banner",
                desc: "banner-images/banners",
              },
              {
                title: "Định dạng xuất",
                desc: "WebP, tối đa 1200px, khoảng 0.5MB",
              },
              {
                title: "Watermark",
                desc: "Ăn Vặt Ngọc Trinh + anvatngoctrinh.vn",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-[#F5FFF8] p-4">
                <p className="font-black text-[#06113C]">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] bg-[#FFF7E8] p-4">
            <p className="font-black text-[#06113C]">Lưu ý quan trọng</p>

            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
              Ảnh gốc vẫn được giữ lại. Tool chỉ tạo thêm file mới có đuôi
              <span className="font-black"> -watermark.webp</span> và cập nhật
              database sang ảnh mới.
            </p>
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Nhật ký xử lý
              </h2>

              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Theo dõi tiến trình tối ưu ảnh theo thời gian thực.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLogs([])}
              disabled={running}
              className="rounded-2xl bg-neutral-100 px-4 py-3 text-xs font-black text-[#06113C] disabled:opacity-50"
            >
              Xóa log
            </button>
          </div>

          <div className="mt-5 max-h-[560px] overflow-y-auto rounded-[24px] bg-[#06113C] p-4 text-sm font-bold leading-7 text-white">
            {logs.length === 0 ? (
              <p className="text-white/60">Chưa chạy.</p>
            ) : (
              logs.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}