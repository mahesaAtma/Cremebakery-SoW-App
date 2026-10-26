import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Header } from "@/components/header";
import { isOwner } from "@/lib/auth";

// Every page reads live data from the database
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Creme Bakery · Progres Kerja", template: "%s · Creme Bakery" },
  description: "Lingkup kerja dan progres pengembangan website Creme Bakery.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const owner = await isOwner();
  return (
    <html lang="id">
      <body className="min-h-screen">
        <Header owner={owner} />
        <main className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">{children}</main>
        <footer className="mx-auto max-w-[1120px] px-4 pb-10 text-[13px] text-muted sm:px-6">
          Creme Bakery · Progres pengembangan website
        </footer>
      </body>
    </html>
  );
}
