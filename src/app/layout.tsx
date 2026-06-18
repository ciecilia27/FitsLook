import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Fit Look — Find Your Perfect Fit",
  description: "MirrorMe: Fashion Without Limits. Virtual try-on powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
