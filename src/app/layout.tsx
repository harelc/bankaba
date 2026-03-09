import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider } from '@/contexts/locale-context';

export const metadata: Metadata = {
  title: 'הבנק של אבא',
  description: 'בנק משפחתי לניהול חסכונות',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
