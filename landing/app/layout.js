import "./globals.css";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "Incrust — Ton écran. Toi dedans.",
  description:
    "Capture ton écran et ta webcam, détoure le fond en temps réel, incruste-toi en bulle flottante sur l'écran et enregistre en MP4. App native macOS.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistSans.className}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
