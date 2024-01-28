import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "Anon Paper";

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#fff",
            backgroundSize: "150px 150px",
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "6rem",
          }}
        >
          <span tw="text-4xl text-slate-900 font-bold text-slate-900 leading-tight mb-auto, mt-auto">
            {title}
          </span>
          <span tw="text-slate-600 text-2xl font-bold">
            Anonymously comment on this paper.
          </span>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
