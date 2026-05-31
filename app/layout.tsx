import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppShell from "@/components/AppShell";
import "./globals.scss";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Orchestrator Dashboard",
  description: "Modern orchestration and workflow management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-carbon-theme="g100">
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              const carbonTheme = theme === 'dark' ? 'g100' : 'white';
              document.documentElement.setAttribute('data-carbon-theme', carbonTheme);
              document.documentElement.classList.add(theme);
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning data-carbon-theme="g100">
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Made with Bob
