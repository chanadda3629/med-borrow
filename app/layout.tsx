import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, Geist_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบยืมอุปกรณ์ประคองกาย",
  description: "ระบบจัดการการยืมอุปกรณ์สำหรับศูนย์ประคองกาย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${ibmPlexSansThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
