import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Temp CSV - Upload, View & Share Table Files (CSV, Excel, ODS) Online",
  description: "Upload, view, and share CSV, TSV, Excel (.xlsx, .xls), and ODS files online without registration. Multi-sheet support, no login required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
