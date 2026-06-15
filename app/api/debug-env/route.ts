import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
    keyStart: process.env.OPENAI_API_KEY?.slice(0, 7) || null,
  });
}