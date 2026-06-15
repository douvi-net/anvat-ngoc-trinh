import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POST_BUCKET = "post-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Thiếu Supabase env");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function generateImageBase64(prompt: string) {
  if (!openAiKey) {
    throw new Error("Thiếu OPENAI_API_KEY");
  }

  const safePrompt = `
${prompt}

Style:
realistic Vietnamese food photography, natural lighting, appetizing,
high detail, no text, no watermark, no fake logo.
`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: safePrompt,
      size: "1536x1024",
      quality: "medium",
      n: 1,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI không trả ảnh base64");
  }

  return b64;
}

async function uploadImage(params: {
  slug: string;
  name: string;
  base64: string;
}) {
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(params.base64, "base64");
  const filePath = `posts/${params.slug}-${params.name}.png`;

  const { error } = await supabase.storage
    .from(POST_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(POST_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const { slug, name, prompt, alt, caption } = await req.json();

    if (!slug || !name || !prompt) {
      return NextResponse.json(
        { error: "Thiếu slug, name hoặc prompt" },
        { status: 400 }
      );
    }

    const base64 = await generateImageBase64(prompt);
    const url = await uploadImage({ slug, name, base64 });

    return NextResponse.json({
      image: {
        url,
        alt: alt || "",
        caption: caption || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Tạo ảnh thất bại", detail: String(error) },
      { status: 500 }
    );
  }
}