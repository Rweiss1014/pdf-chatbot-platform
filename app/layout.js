import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "SmartDoc",
  description: "Upload any PDF and get an AI-powered chatbot — powered by your own OpenAI key",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
