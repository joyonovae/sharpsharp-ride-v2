import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "SharpSharp Ride",
  description: "Ride sharing, car rental and delivery booking platform.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="no-site-overflow min-h-screen bg-[#08141b] text-white antialiased">
        <div className="no-site-overflow relative flex min-h-screen flex-col">
          <Navbar />

          <main className="no-site-overflow flex-1">
            {children}
          </main>

          <Footer />
        </div>
      </body>
    </html>
  );
}