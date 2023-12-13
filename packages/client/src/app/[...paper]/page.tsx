"use client";

import PaperPreview from "@/components/PaperPreview";
import { LinkMetadata, fetchData } from "@/lib/metadata";
import { useEffect, useState } from "react";

export interface ArxivData {
  title: string;
  summary: string;
}

interface InvalidComment {
  reason: string | undefined;
}

export default function Page({ params }: { params: { paper: string[] } }) {
  const [data, setData] = useState<LinkMetadata | undefined>(undefined);
  const [comment, setComment] = useState<string>("");
  const [twitterEmbedUrl, setTwitterEmbedUrl] = useState<string | undefined>();
  const [invalidComment, setInvalidComment] = useState<
    InvalidComment | undefined
  >();

  useEffect(() => {
    if (comment.length > 280) {
      setInvalidComment({ reason: "Message is too long" });
    } else if (comment.length === 0) {
      setInvalidComment({ reason: undefined });
    } else if (invalidComment) {
      setInvalidComment(undefined);
    }
  }, [comment]);

  useEffect(() => {
    const getData = async () => {
      const link = decodeURIComponent(params.paper.join("/"));
      if (link.includes("twitter.com")) {
        setTwitterEmbedUrl(link);
      } else if (link.includes("x.com")) {
        const linkSplit = link.split("/");
        linkSplit[1] = "twitter.com";
        const newLink = linkSplit.join("/");
        setTwitterEmbedUrl(newLink);
      } else {
        const linkSplit = link.split("/");
        console.log(linkSplit);
        linkSplit.shift();
        const newLink = linkSplit.join("/");
        const data = await fetchData(newLink);
        setData(data);
      }
    };
    getData();
  }, [params.paper]);

  if (!data && !twitterEmbedUrl) {
    return <span>Loading...</span>;
  }

  return (
    <main>
      <div className="container mx-auto max-w-xl mt-24 text-base px-6">
        {twitterEmbedUrl && (
          <>
            <blockquote className="twitter-tweet">
              <a href={`${twitterEmbedUrl}`}></a>
            </blockquote>
            <script
              async
              src="https://platform.twitter.com/widgets.js"
              charSet="utf-8"
            ></script>
          </>
        )}
        {data && (
          <PaperPreview
            title={data.title}
            content={data.description}
            link={decodeURIComponent(params.paper.join("/"))}
          />
        )}
        <div className="flex flex-col mt-4 w-full">
          <input
            type="text"
            placeholder="Type your comment here"
            className="text-black rounded-md p-4 bg-gray-100"
            onChange={(e) => {
              setComment(e.target.value);
            }}
          />
          {/* TODO: refactor all this */}
          {!invalidComment ? (
            <button
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_TWITTER_SERVER_URL;
                if (!apiUrl) {
                  throw new Error("TWITTER_SERVER_URL .env var not set");
                }
                if (twitterEmbedUrl) {
                  const replyUrl = `${apiUrl}/reply/${
                    twitterEmbedUrl.split("/")[2]
                  }/${twitterEmbedUrl.split("/")[4]}`;
                  fetch(replyUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      content: comment,
                    }),
                  });
                } else {
                  fetch(`${apiUrl}/tweet/`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      content: comment,
                      link: window.location.href,
                    }),
                  });
                }
              }}
              className="font-medium p-2 py-4 bg-indigo-500 text-white rounded-md mt-4 hover:bg-indigo-400 transition-all ease"
              disabled={!comment}
            >
              Post anonymously
            </button>
          ) : (
            <>
              {invalidComment.reason && (
                <div className="text-center mt-4">
                  <span className="text-red-500">{invalidComment.reason}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
