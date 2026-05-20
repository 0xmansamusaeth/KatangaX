import { Poppins } from "next/font/google";
import "./globals.css";
import { AnimatedRoute } from "@/components/layout/AnimatedRoute";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/toast";
import { Web3Providers } from "@/components/web3/Web3Providers";
import { WrongNetworkBanner } from "@/components/web3/WrongNetworkBanner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "KatangaX",
  description: "Community savings, reimagined.",
  manifest: "/manifest.json",
  applicationName: "KatangaX",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KatangaX",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#1B5E20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-[#F5F7F5] font-sans antialiased">
        <Web3Providers>
          <WrongNetworkBanner />
          <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#F5F7F5] shadow-[0_0_40px_rgba(0,0,0,0.06)]">
            <AnimatedRoute>{children}</AnimatedRoute>
            <BottomNav />
          </div>
          <Toaster />
        </Web3Providers>
      </body>
    </html>
  );
}
