import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Bowl HQ",
  description: "RBG Household Super Bowl Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07101f] text-white">{children}</body>
    </html>
  );
}
