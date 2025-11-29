import type { Metadata } from "next";
import { Outfit, Fira_Code } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoDo - The Interrogation Game",
  description:
    "You've been accused of a crime you didn't commit. Outsmart the AI detective in 60 seconds or go to jail!",
  keywords: ["game", "AI", "interrogation", "detective", "puzzle", "argument"],
  authors: [{ name: "DoDo Team" }],
  openGraph: {
    title: "DoDo - The Interrogation Game",
    description:
      "You've been accused of a crime you didn't commit. Outsmart the AI detective in 60 seconds or go to jail!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
