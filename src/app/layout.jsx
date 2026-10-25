import "./globals.css";
import ToastContainer from "../components/Toast";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "RevAtlas — The Revenue Atlas of SaaS",
  description: "72,000+ SaaS companies with revenue, funding, valuation multiples & executive contacts. Free to search and export.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={inter.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
