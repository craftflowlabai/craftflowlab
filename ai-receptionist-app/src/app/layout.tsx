import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reception AI — виртуален рецепционист",
  description: "AI рецепционист, който отговаря на клиенти, проверява свободни часове и приема записвания 24/7.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body>{children}</body></html>;
}
