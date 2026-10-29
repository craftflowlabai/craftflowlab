import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://session-booker-pro-craftflowlabai.vercel.app"),
  title: "Northform | Personal coaching in Sofia",
  description: "Thoughtful personal coaching, small-group strength, and mobility sessions at Studio North in Sofia.",
  openGraph: {
    title: "Northform | Personal coaching in Sofia",
    description: "Find a training session that fits your life at Studio North in Sofia.",
    images: ["/images/northform-coach-hero.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
