import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getVisibleCategoriesWithSubs } from "@/lib/supabase/queries";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Parse JSON body
    const body = await request.json();
    const { transcription, localDate } = body;
    if (!transcription || typeof transcription !== "string" || !transcription.trim()) {
      return NextResponse.json({ error: "No transcription provided" }, { status: 400 });
    }

    // 3. Fetch user's visible categories + subcategories
    const { categories: catsRes, subcategories: subsRes, hiddenCategories: hiddenRes } = await getVisibleCategoriesWithSubs(supabase, user.id);

    const categories = catsRes.data || [];
    const subcategories = subsRes.data || [];
    const hiddenIds = new Set((hiddenRes.data || []).map((r: { category_id: string }) => r.category_id));

    // Build subcategory list scoped to visible categories
    const visibleCategories = categories.filter(
      (c: { id: string; is_displayed?: boolean }) => c.is_displayed !== false && !hiddenIds.has(c.id)
    );

    const subcategoryList = visibleCategories.flatMap((cat: { id: string; name: string; emoji?: string; icon?: string }) => {
      const subs = subcategories.filter((s: { category_id: string }) => s.category_id === cat.id);
      return subs.map((s: { id: string; name: string }) => ({
        id: s.id,
        category: cat.name,
        subcategory: s.name,
      }));
    });

    if (subcategoryList.length === 0) {
      return NextResponse.json({ error: "No subcategories configured" }, { status: 400 });
    }

    // 4. Build prompt — use the client's local date to avoid timezone mismatch
    const today = localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)
      ? localDate
      : new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date(today + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });

    const prompt = `You are an expert assistant that extracts structured financial data from voice transcriptions.

## Objective
Analyze the spoken transcription and return ONLY a single JSON object with these fields:
{
  "date": "YYYY-MM-DD",
  "subcategory_id": "<matching ID from the subcategory list below>",
  "title": "<concise description of what was bought, max 5 words>",
  "amount": "<number with decimals, no currency symbol>",
  "payment_method": "card" | "cash" | null
}

## Today's Context
- Today is ${today} (${dayOfWeek})

## Subcategory List
Pick the closest match from this list. Use the "id" field in your response:
${JSON.stringify(subcategoryList, null, 2)}

## Rules

1. **Date**: Resolve relative dates against today (${today}).
   - "hoy" / "today" → ${today}
   - "ayer" / "yesterday" → the day before today
   - "el viernes" / "on Friday" → the most recent past occurrence of that weekday (or today if it matches)
   - "antier" → two days before today
   - If no date is mentioned at all, default to ${today}.
   - Always output YYYY-MM-DD format.

2. **Amount**: Convert spoken numbers to digits.
   - Spanish: "doscientos" → 200, "mil quinientos" → 1500, "cincuenta y tres" → 53, "tres mil" → 3000
   - English: "fifty" → 50, "two hundred" → 200, "fifteen hundred" → 1500
   - Handle mixed: "200 pesos", "$50", "like 300"
   - Use a dot as decimal separator (e.g., 1234.56). No currency symbols.

3. **Subcategory**: Analyze keywords and context to pick the closest matching subcategory from the list above. Return its "id" value.
   - "uber" / "taxi" / "didi" → transportation-related subcategory
   - "comida" / "restaurante" / "lunch" → food/dining subcategory
   - "super" / "mandado" / "groceries" → groceries subcategory
   - Use your best judgment for ambiguous cases.

4. **Payment Method**: Only set if explicitly mentioned (e.g., "con tarjeta", "in cash", "efectivo", "card", "de debito"). Use "card" or "cash". If not mentioned, use null.

5. **Title**: Generate a concise description (max 5 words) of what was bought. Use brand names or key items when mentioned (e.g., "Uber al trabajo", "Comida en Chipotle", "Cafe Starbucks"). Do not use generic words like "Purchase" or "Gasto".

6. **Language**: The transcription may be in Spanish, English, or a mix of both. Handle all cases naturally.

7. **Output**: Return ONLY the JSON object. No extra text, comments, or code fences.

## Transcription
"${transcription.trim()}"`;

    // 5. Call Claude Sonnet
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 6. Parse response
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
    console.error("Voice parse error:", error);

    // Surface friendly error messages
    let message = "Failed to parse voice input";
    if (error instanceof Error) {
      if (error.message.includes("credit balance")) {
        message = "AI service out of credits. Please try again later.";
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
