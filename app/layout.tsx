import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
  variable: '--font-hindi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SocietyPulse — AI Complaint Triage for Housing Societies',
  description:
    'Turn WhatsApp complaint chaos into structured resolution in minutes. Multilingual reporting (English, Hindi, Hinglish), voice recording, 3D society digital twin, and AI triage for housing society committees.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansDevanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-[#0B1020] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <ThemeProvider>
          <LanguageProvider>
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
