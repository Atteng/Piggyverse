import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/shared/ui/sidebar";
import { Header } from "@/shared/ui/header";
import { Toaster } from "@/components/ui/toaster";
import { UserActivityProvider } from "@/components/providers/user-activity-provider";
import { MobileBlocker } from "@/components/ui/mobile-blocker";

const jetBrainsMono = localFont({
  src: [
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-jetbrains-mono'
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PiggyVerse | PiggyDAO",
  description: "The decentralized gaming hub for PiggyDAO",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${jetBrainsMono.variable} antialiased bg-background text-foreground font-mono overflow-x-hidden w-full`}>
        <Providers>
          <UserActivityProvider>
            {/* Global Background Image Layer */}
            <div className="fixed inset-0 z-[-1]">
              <div className="absolute inset-0 bg-[url('/images/bg-2.jpg')] bg-cover bg-center bg-no-repeat" />
            </div>

            <div className="flex w-full overflow-x-hidden">
              <Sidebar />
              <div className="flex-1 transition-all duration-300 ml-0 md:ml-[120px]">
                <Header />
                <main
                  className="min-h-[calc(100vh-80px)] p-4 md:p-8 lg:p-10 relative"
                >
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </UserActivityProvider>
        </Providers>
      </body>
    </html>
  );
}
