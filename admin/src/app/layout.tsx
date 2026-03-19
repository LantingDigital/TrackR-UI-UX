import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrackR — The Premium Home for Your Coaster Life',
  description:
    'Track rides, rate coasters, collect trading cards, and connect with the coaster community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-page min-h-screen">{children}</body>
    </html>
  );
}
