import "./globals.css";

export const metadata = {
  title: "Al Shaimaa Academy System",
  description: "Al Shaimaa Quran Academy management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}