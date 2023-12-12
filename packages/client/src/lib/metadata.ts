export interface LinkMetadata {
  title: string;
  description: string;
}

export function isValidUrl(str: string) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export const fetchData = async (link: string) => {
  if (!link.startsWith("https://") && !link.startsWith("http://")) {
    link = "https://" + link;
  }
  console.log(link);
  if (isValidUrl(link)) {
    const apiUrl = process.env.NEXT_PUBLIC_TWITTER_SERVER_URL;
    if (!apiUrl) {
      throw new Error("TWITTER_SERVER_URL .env var not set");
    }
    const metaData = await fetch(`${apiUrl}/fetch-opengraph?url=${link}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await metaData.json();
    return data;
  }
};
