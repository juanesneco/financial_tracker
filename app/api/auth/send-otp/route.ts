import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { OTP_CONFIG } from "@/lib/auth/config";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const normalizedEmail = email.toLowerCase();

    // Delete any existing codes for this email
    await supabaseAdmin
      .from("otp_codes")
      .delete()
      .eq("email", normalizedEmail);

    // Store the code
    const { error: dbError } = await supabaseAdmin.from("otp_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }

    // Send branded email via Resend
    const { error: emailError } = await resend.emails.send({
      from: `${OTP_CONFIG.fromName} <${OTP_CONFIG.fromEmail}>`,
      to: normalizedEmail,
      subject: OTP_CONFIG.subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${OTP_CONFIG.primaryColor}; font-size: 24px; margin: 0;">${OTP_CONFIG.appName}</h1>
            ${OTP_CONFIG.tagline ? `<p style="color: ${OTP_CONFIG.mutedColor}; font-size: 14px; margin: 5px 0 0 0;">${OTP_CONFIG.tagline}</p>` : ""}
          </div>

          <p style="color: #2d3748; font-size: 16px; margin-bottom: 20px;">Your login code is:</p>

          <div style="background: ${OTP_CONFIG.bgColor}; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${OTP_CONFIG.primaryColor};">${code}</span>
          </div>

          <p style="color: ${OTP_CONFIG.mutedColor}; font-size: 14px; margin-bottom: 5px;">This code expires in 10 minutes.</p>
          <p style="color: ${OTP_CONFIG.mutedColor}; font-size: 14px;">If you didn't request this code, you can ignore this email.</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: ${OTP_CONFIG.accentColor}; font-style: italic; font-size: 14px; margin: 0;">${OTP_CONFIG.footerTagline}</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
