import "./globals.css";

export const metadata = {
  title: "Incrust — Ton écran. Toi dedans.",
  description:
    "Capture ton écran et ta webcam, détoure le fond en temps réel, incruste-toi en bulle flottante sur l'écran et enregistre en MP4. App native macOS & Windows.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
