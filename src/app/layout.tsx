import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Portal do Aluno EBD',
  description: 'Plataforma de estudos da Escola Bíblica Dominical.',
  icons: {
    apple: '/thumb.png',
  },
  openGraph: {
    title: 'Portal do Aluno EBD',
    description: 'Plataforma de estudos da Escola Bíblica Dominical.',
    images: ['/thumb.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Portal EBD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans antialiased bg-black text-zinc-200 selection:bg-indigo-500/30 selection:text-white">
          {children}
      </body>
    </html>
  );
}
