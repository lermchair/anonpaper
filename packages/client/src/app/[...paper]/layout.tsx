import { fetchMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

function buildUrl(urlParts: string[]): string {
  if (urlParts.includes("http:") || urlParts.includes("https:")) {
    urlParts[0] = `${urlParts[0]}/`;
  }
  return urlParts.join("/");
}

export async function generateMetadata({
  params,
}: {
  params: { paper: string[] };
}): Promise<Metadata> {
  let link = params.paper.map((p) => decodeURIComponent(p));
  const url = buildUrl(link);
  const metadata = await fetchMetadata(url);
  return {
    title: `${metadata.title} — Anon Paper`,
    description: "Anonymously comment on this paper.",
    openGraph: {
      images: [
        {
          url: `${
            process.env.NODE_ENV == "production"
              ? `https://anonpaper.com`
              : `http://localhost:3000`
          }/api/og?title=${encodeURIComponent(metadata.title)}`,
          type: "image/png",
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
