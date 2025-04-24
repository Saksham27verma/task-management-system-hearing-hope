import Providers from './providers';
import './globals.css';

export const metadata = {
  title: 'Hearing Hope - Task Management System',
  description: 'A comprehensive task management system for Hearing Hope organization',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: '#EE6417',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 