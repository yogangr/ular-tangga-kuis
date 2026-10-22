import "./globals.css";
import { Plus_Jakarta_Sans, Fredoka } from "next/font/google";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const display = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata = {
  title: "Ular Tangga Kuis",
  description:
    "Ular tangga multiplayer: jawab soal dulu, baru boleh mengocok dadu.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4338ca",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${font.className} ${display.variable}`}>
        {children}
      </body>
    </html>
  );
}
