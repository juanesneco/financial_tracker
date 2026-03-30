import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getVisibleCategoriesWithSubs } from "@/lib/supabase/queries";
import type { Category, Subcategory } from "@/lib/types";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const localDate = formData.get("localDate") as string | null;
    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 3. Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Normalize media type — Anthropic only accepts jpeg, png, gif, webp
    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mediaType = (supportedTypes.includes(imageFile.type) ? imageFile.type : "image/jpeg") as
      "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    // 4. Fetch user's visible categories + subcategories
    const { categories: catsRes, subcategories: subsRes, hiddenCategories: hiddenRes } = await getVisibleCategoriesWithSubs(supabase, user.id);

    const categories = catsRes.data || [];
    const subcategories = subsRes.data || [];
    const hiddenIds = new Set((hiddenRes.data || []).map((r) => r.category_id));

    // Build subcategory list scoped to visible categories
    const visibleCategories = categories.filter(
      (c: Category) => c.is_displayed !== false && !hiddenIds.has(c.id)
    );

    const subcategoryList = visibleCategories.flatMap((cat: Category) => {
      const subs = subcategories.filter((s: Subcategory) => s.category_id === cat.id);
      return subs.map((s: Subcategory) => ({
        id: s.id,
        category: cat.name,
        subcategory: s.name,
      }));
    });

    if (subcategoryList.length === 0) {
      return NextResponse.json({ error: "No subcategories configured" }, { status: 400 });
    }

    // 5. Build prompt — use client's local date for context
    const today = localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)
      ? localDate
      : new Date().toISOString().split("T")[0];

    const prompt = `You are an expert assistant that extracts structured financial data from receipt images.

## Objective
Analyze the receipt image and return ONLY a single JSON object with these fields:
{
  "date": "YYYY-MM-DD",
  "subcategory_id": "<matching ID from the subcategory list below>",
  "title": "<concise description of what was bought, max 5 words>",
  "amount": "<number with decimals, no currency symbol>",
  "payment_method": "card" | "cash" | null
}

## Subcategory List
Pick the closest match from this list. Use the "id" field in your response:
${JSON.stringify(subcategoryList, null, 2)}

## Rules

1. **Date**: Extract the transaction/purchase date and normalize to YYYY-MM-DD. If multiple dates appear, choose the purchase date. Today's date is ${today}. If no date is visible on the receipt, use ${today}.

2. **Amount**: Return the grand total actually paid (after discounts; include tax if shown as a single total). Use a dot as decimal separator (e.g., 1234.56). No currency symbols.

3. **Subcategory**: Analyze the merchant type, line items, and context to pick the closest matching subcategory from the list above. Return its "id" value.

4. **Payment Method**: Only set if the receipt clearly indicates it (e.g., "VISA", "MasterCard", "EFECTIVO", "CASH", "debit"). Use "card" or "cash". If ambiguous or not shown, use null.

5. **Title**: Generate a concise description (max 5 words) of what was actually bought. Use brand names or key items when visible (e.g., "Coca-Cola y Sabritas", "Uber al aeropuerto", "Corte de cabello"). Do not use generic words like "Purchase" or "Items".

6. **Output**: Return ONLY the JSON object. No extra text, comments, or code fences.`;

    // 6. Call Claude Sonnet
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // 7. Parse response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Strip code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const extracted = JSON.parse(jsonText);

    // Validate subcategory_id exists in our list
    const validSubId = subcategoryList.find(
      (s: { id: string }) => s.id === extracted.subcategory_id
    );
    if (!validSubId) {
      extracted.subcategory_id = null;
    }

    // Normalize payment_method
    if (extracted.payment_method && !["card", "cash"].includes(extracted.payment_method)) {
      extracted.payment_method = null;
    }

    return NextResponse.json(extracted);
  } catch (error) {
    console.error("Receipt scan error:", error);

    // Surface friendly error messages
    let message = "Failed to analyze receipt";
    if (error instanceof Error) {
      if (error.message.includes("credit balance")) {
        message = "AI service out of credits. Please try again later.";
      } else if (error.message.includes("Could not process image")) {
        message = "Could not read the image. Try a clearer photo.";
      } else if (error.message.includes("rate limit")) {
        message = "Too many requests. Please wait a moment.";
      } else {
        message = error.message;
      }
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
