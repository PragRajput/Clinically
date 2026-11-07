import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinically";

export const metadata: Metadata = {
  title: `${clinicName} — Clinic Management`,
  description:
    "Manage patients, visits, prescriptions, appointments, billing and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
