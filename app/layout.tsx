import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGate from "@/components/AuthGate";
import { Inter, Archivo_Black } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo",
});

export const metadata = {
  title: "Super Bowl HQ",
  description: "RBG Household Super Bowl Headquarters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${archivo.variable} bg-[#07101f] text-white min-h-screen`}
      >
        <AuthGate>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
