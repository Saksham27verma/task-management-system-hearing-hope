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
  maximumScale: 1,
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
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 