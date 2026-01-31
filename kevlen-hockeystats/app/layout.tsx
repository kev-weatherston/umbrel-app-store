import type { Metadata } from 'next';
import './globals.css';
import '@/lib/server-init'; // Initialize scheduler and cache on server side
import UmbrelIntegration from '@/components/UmbrelIntegration';

export const metadata: Metadata = {
  title: 'HockeyStats - NHL Standings',
  description: 'View current NHL season team standings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <UmbrelIntegration />
        {children}
      </body>
    </html>
  );
}
