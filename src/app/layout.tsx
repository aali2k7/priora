import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Priora — AI Executive Email Assistant",
  description: "Transform email overload into calm, actionable executive clarity.",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('priora-theme');
    var isDark = stored === 'dark' || (!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
