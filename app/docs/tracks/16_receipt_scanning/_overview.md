# Track 16: Receipt Scanning

| Field | Value |
|-------|-------|
| **Owner** | Juanes |
| **Priority** | P1 — Must Have |
| **Status** | Not Started (0/7) |
| **Phases** | 1 |
| **Dependencies** | 04_expense_management |

## Summary

Upload or photograph a receipt and have Claude (Sonnet) extract the date, subcategory, title, amount, and payment method automatically. The user lands on a confirmation screen (the existing ExpenseForm, pre-filled) where they can correct anything before saving. This replaces the manual entry flow as the primary way to add expenses while keeping manual entry as a fallback.

## User Flow

1. Tap the **+** button in the bottom nav (mobile) or sidebar action (desktop)
2. Popup now shows **three** options: **Scan Receipt**, **Add Expense** (manual), **Add Income**
3. **Scan Receipt** opens `/add/scan` — a page with camera capture and gallery upload (one image at a time)
4. User takes a photo or picks from gallery
5. Page transitions to an **extracting** state (loading animation: "Analyzing receipt...")
6. Image is sent to `POST /api/receipts/scan` which calls Claude Sonnet with the image and the user's visible subcategory list
7. API returns extracted fields: `date`, `subcategory_id`, `title`, `amount`, `payment_method`
8. Page transitions to the **ExpenseForm** pre-filled with extracted data + the receipt image already attached
9. User reviews, edits if needed, and submits — normal expense creation flow

## Decisions

- **Model:** Claude Sonnet (claude-sonnet-4-6) for accuracy
- **Image input:** Camera capture (preferred) or gallery pick, one image at a time, via `<input type="file" accept="image/*" capture="environment">`
- **Subcategory scoping:** The API route fetches the user's visible categories + subcategories and passes them to the prompt, so Claude only picks from subcategories the user actually sees
- **Receipt reuse:** The uploaded image automatically becomes the receipt attachment on the saved expense — no double upload
- **Confirmation:** Reuses the existing `ExpenseForm` component, pre-filled with extracted data. All fields are editable before submit
- **Failure handling:** If extraction fails or a field can't be determined, the form opens with whatever was extracted (blanks for the rest). Toast: "Some fields couldn't be extracted"
- **Payment method:** Only populated if the receipt clearly indicates it (e.g., "VISA", "EFECTIVO"). Left blank otherwise
- **No DB schema changes** — uses existing `ft_expenses` table as-is
- **API key:** `ANTHROPIC_API_KEY` env var, server-side only (API route)

## Stories

| ID | Story | Points | Status |
|----|-------|--------|--------|
| 16-SD-001 | API route: `POST /api/receipts/scan` — accepts image, calls Claude Sonnet, returns extracted fields | 8 | Not Started |
| 16-SD-002 | Scan page (`app/(app)/add/scan/page.tsx`) — camera/gallery capture + extracting loading state | 5 | Not Started |
| 16-SD-003 | Pre-fill ExpenseForm with extracted data and attached receipt image | 5 | Not Started |
| 16-SD-004 | Update add menu: add "Scan Receipt" option to MobileNav popup and Sidebar | 3 | Not Started |
| 16-SD-005 | Fix ExpenseForm horizontal overflow — constrain form width on all devices | 2 | Not Started |
| 16-SD-006 | Prompt engineering: build and test the Claude prompt with real receipts | 3 | Not Started |
| 16-SD-007 | End-to-end testing: scan, review, edit, submit across mobile and desktop | 3 | Not Started |

**Total Points:** 29

## Key Files

| Purpose | Path |
|---------|------|
| API route (scan) | `app/api/receipts/scan/route.ts` |
| Scan page | `app/(app)/add/scan/page.tsx` |
| Expense form (reused) | `components/forms/ExpenseForm.tsx` |
| Mobile nav (add menu) | `components/layout/MobileNav.tsx` |
| Sidebar (desktop) | `components/layout/Sidebar.tsx` |
| Categories hook | `hooks/useCategories.ts` |

## API Route Design

### `POST /api/receipts/scan`

**Request:** `multipart/form-data` with `image` file field

**Server-side logic:**
1. Authenticate the user (verify Supabase session from cookies)
2. Fetch the user's visible categories + subcategories from DB
3. Build the Claude prompt with the subcategory list embedded
4. Send image + prompt to Claude Sonnet via Anthropic SDK (`@anthropic-ai/sdk`)
5. Parse the JSON response
6. Return extracted fields

**Response:**
```json
{
  "date": "2026-03-19",
  "subcategory_id": "uuid-here",
  "title": "Coca-Cola Sin Azucar, Sabritas",
  "amount": "234.50",
  "payment_method": "card" | "cash" | null
}
```

## Prompt Design

Based on the proven Glide prompt, adapted for subcategories:

- Input: receipt image (vision) + JSON array of `{ id, category, subcategory }` for all visible subcategories
- Rules: extract date (YYYY-MM-DD), match to closest subcategory ID, generate concise title (under 7 words, use brand names), extract total amount, infer payment method only if explicit
- Output: single JSON object, no code fences

## ExpenseForm Changes (16-SD-003)

The `ExpenseForm` component needs to accept optional `defaultValues` prop:

```ts
interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
  defaultValues?: {
    date?: string;
    subcategoryId?: string;
    title?: string;
    amount?: string;
    paymentMethod?: string;
    receiptFile?: File;
    receiptPreview?: string;
  };
}
```

When `defaultValues` is provided, initialize state from it instead of empty defaults.

## Width Fix (16-SD-005)

The ExpenseForm currently allows horizontal swipe/overflow on mobile. Fix by adding `overflow-x-hidden` to the form container and ensuring `max-w-lg` is applied consistently on the add page and scan page wrappers.

## Notes

- The Anthropic API key must be added to `.env.local` as `ANTHROPIC_API_KEY` and to the Vercel project environment variables for production
- Claude Sonnet vision can read most receipt formats including thermal paper, digital receipts, and screenshots
- The scan page should pre-check camera permissions and show a helpful message if denied
- Consider adding a small "Powered by Claude" attribution on the scan page
- Cost estimate: ~$0.01–0.03 per receipt scan (Sonnet vision pricing)
