import "./globals.css";
import Navbar from "@/components/Navbar";

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
      <body className="bg-[#07101f] text-white min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
