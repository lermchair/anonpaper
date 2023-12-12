"use client";

import { useEffect, useState } from "react";
import * as xml2js from "xml2js";

export interface ArxivData {
  title: string;
  summary: string;
}

interface InvalidComment {
  reason: string | undefined;
}

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36 Edg/102.0.1245.39",
];

export default function Page({ params }: { params: { paper: string[] } }) {
  const [data, setData] = useState<ArxivData | undefined>(undefined);
  const [comment, setComment] = useState<string | undefined>(undefined);
  const [twitterEmbedUrl, setTwitterEmbedUrl] = useState<string | undefined>();
  const [invalidComment, setInvalidComment] = useState<
    InvalidComment | undefined
  >();

  useEffect(() => {
    if (comment) {
      if (comment.length > 280) {
        setInvalidComment({ reason: "Message is too long" });
      } else if (invalidComment) {
        setInvalidComment(undefined);
      }
    } else {
      setInvalidComment({ reason: undefined });
    }
  }, [comment]);

  useEffect(() => {
    async function fetchArxivData(arxivId: string) {
      const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;

      try {
        const response = await fetch(apiUrl, {
          headers: {
            "User-Agent":
              userAgents[Math.floor(Math.random() * userAgents.length)],
          },
        });
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const xmlData = await response.text();
        const result = await xml2js.parseStringPromise(xmlData, {
          explicitArray: false,
        });

        const firstEntry = result.feed.entry;
        return firstEntry;
      } catch (error) {
        console.error("Error:", error);
        return null;
      }
    }

    const fetchData = async () => {
      const link = decodeURIComponent(params.paper.join("/"));
      if (link.includes("arxiv.org")) {
        const linkSplit = link.split("/");
        const id = linkSplit[linkSplit.length - 1];
        const data = await fetchArxivData(id);
        setData(data);
      } else if (link.includes("twitter.com") || link.includes("x.com")) {
        setTwitterEmbedUrl(link);
      }
    };
    fetchData();
  }, [data, params.paper, twitterEmbedUrl]);

  if (!data && !twitterEmbedUrl) {
    return <span>Loading...</span>;
  }

  return (
    <div className="flex flex-col items-center mx-auto lg:w-1/2 sm:w-full p-4">
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
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-3xl mb-4">{data.title}</h1>
          <p>{data.summary}</p>
          <a
            href={decodeURIComponent(params.paper.join("/"))}
            target="_blank"
            className="mt-2 bg-blue-500 px-4 py-2 rounded-3xl text-white font-medium hover:bg-blue-400 transition-all ease-in-out"
          >
            ArXiv link
          </a>
        </div>
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
            className="font-medium px-2 py-4 bg-black text-white rounded-md mt-4"
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
  );
}
