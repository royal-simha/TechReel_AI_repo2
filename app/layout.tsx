import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { AppProvider } from '@/lib/context';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RouteGuard } from '@/components/route-guard';
import { AppShell } from '@/components/app-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TechReel AI — Intelligent Technology Reel Recommendation Agent',
  description: 'Turn your scrolling behavior into intelligent technology discovery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AppProvider>
              <TooltipProvider>
                <RouteGuard>
                  <AppShell>{children}</AppShell>
                </RouteGuard>
                <Toaster position="bottom-right" richColors />
              </TooltipProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
