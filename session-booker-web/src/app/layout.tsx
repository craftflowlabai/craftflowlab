import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northform | Personal training, with a plan",
  description: "Thoughtful personal training and small-group sessions at Studio North.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
