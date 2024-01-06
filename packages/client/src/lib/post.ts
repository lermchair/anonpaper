import { PostStatus } from "@/components/Progress";

export const postComment = async (
  url: string,
  data: { content: string; link?: string },
  onProgress: (progress: PostStatus) => void
) => {
  const apiUrl = process.env.NEXT_PUBLIC_TWITTER_SERVER_URL;

  if (!apiUrl) {
    throw new Error("TWITTER_SERVER_URL .env var not set");
  }

  onProgress("loading");
  try {
    const response = await fetch(`${apiUrl}/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status !== 200) {
      onProgress("error");
      return;
    }

    onProgress("success");
  } catch (error) {
    onProgress("error");
  }
};
