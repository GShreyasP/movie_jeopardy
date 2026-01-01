import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movie Jeopardy",
  description: "Create and play Movie Jeopardy games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
