import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Hack-Flow | Mission Control",
  description: "Next-gen orchestration platform for high-stakes hackathons and technical events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-black"
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
