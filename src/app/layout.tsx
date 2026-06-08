import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Support Voice Agent Console",
  description: "Real-time intent classification, KB-grounded answers, frustration detection, and smart escalation for AI customer support voice agents."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}