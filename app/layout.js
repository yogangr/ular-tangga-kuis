import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

export const metadata = {
  title: 'Ular Tangga Kuis',
  description: 'Ular tangga multiplayer: jawab soal dulu, baru boleh mengocok dadu.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={font.className}>{children}</body>
    </html>
  );
}
