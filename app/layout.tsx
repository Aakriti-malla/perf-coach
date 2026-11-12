import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerfCoach",
  description: "Audit a page's Core Web Vitals and get AI-ranked fixes.",
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/icon-light.png',
        href: '/icon-light.png',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/icon-dark.png',
        href: '/icon-dark.png',
      },
    ]
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="mx-auto w-full max-w-3xl px-6 pt-6">
          <Link href="/" className="inline-block font-serif text-[38px] leading-none tracking-[-0.5px]">
            <span className="font-normal text-bark">perf</span>
            <span className="font-semibold text-saddle">coach</span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
