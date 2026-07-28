import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Priora — AI Executive Email Assistant",
  description: "Transform email overload into calm, actionable executive clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
