export const OTP_CONFIG = {
  appName: "Financial Tracker",
  tagline: "",

  fromEmail: "noreply@juanesngtz.com",
  fromName: "Financial Tracker",
  subject: "Your Financial Tracker Login Code",

  footerTagline: "Clarity in every transaction.",

  primaryColor: "#4A7C6F",
  accentColor: "#D4915E",
  mutedColor: "#6B6B6B",
  bgColor: "#FAFAF8",
} as const;

export type OTPConfig = typeof OTP_CONFIG;
