"use client";

import PaperPreview from "@/components/PaperPreview";
import { LinkMetadata, fetchData, isValidUrl } from "@/lib/metadata";
import { useEffect, useState } from "react";

interface InvalidComment {
  reason: string | undefined;
}

type PostStatus = "ready" | "loading" | "success" | "error";

export default function Home() {
  const [link, setLink] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | undefined>(
    undefined
  );
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(false);
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [invalidComment, setInvalidComment] = useState<
    InvalidComment | undefined
  >();
  const [postStatus, setPostStatus] = useState<PostStatus>("ready");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []); //

  useEffect(() => {
    if (comment.length > 280) {
      setInvalidComment({ reason: "Message is too long" });
    } else if (comment.length === 0) {
      setInvalidComment({ reason: undefined });
    } else if (invalidComment) {
      setInvalidComment(undefined);
    }
  }, [comment]);

  async function getData(link: string) {
    const data = await fetchData(link);
    setLinkMetadata(data);
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (link && isValidUrl(link)) {
        setShowCommentInput(true);
        setLoadingMetadata(true);
        getData(link).then(() => setLoadingMetadata(false));
      } else {
        setShowCommentInput(false);
        setLinkMetadata(undefined);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [link]);

  function renderPostStatus(status: PostStatus) {
    switch (status) {
      case "ready":
        return "Post anonymously";
      case "loading":
        return "Posting...";
      case "success":
        return "Successfully posted!";
      case "error":
        return "Error. Try again.";
      default:
        return "Post anonymously";
    }
  }

  return (
    <main>
      <div className="container mx-auto max-w-xl mt-24 text-base px-6">
        <h1 className="font-serif text-2xl mb-2">
          Anonymously Tweet about Papers
        </h1>
        <p className="text-slate-600">
          Take control of a Twitter bot that posts hot takes about academic
          papers on your behalf.
        </p>
        <div className="mt-4 rounded border border-slate-200 p-4 flex flex-col ">
          <label className="text-slate-500">Enter the link to a paper</label>
          <input
            className="bg-slate-100 rounded w-full p-4 mt-1"
            type="text"
            placeholder="https://arxiv.org/abs/1706.03762"
            onChange={(e) => {
              setLink(e.target.value);
            }}
          />
          {loadingMetadata && (
            <div className="flex items-center justify-center p-4">
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            </div>
          )}
          {linkMetadata && (
            <div className="mt-4">
              <PaperPreview
                title={linkMetadata.title}
                content={linkMetadata.description}
                link={link}
              />
            </div>
          )}
          {showCommentInput && (
            <div className="flex flex-col mt-2">
              <label className="text-slate-500 mt-4">Enter your comment</label>
              <input
                className="bg-slate-100 rounded w-full p-4 mt-1"
                placeholder="This paper is great because..."
                onChange={(e) => {
                  setComment(e.target.value);
                }}
              ></input>
            </div>
          )}
          {!invalidComment ? (
            <button
              onClick={async () => {
                const apiUrl = process.env.NEXT_PUBLIC_TWITTER_SERVER_URL;
                if (!apiUrl) {
                  throw new Error("TWITTER_SERVER_URL .env var not set");
                }
                setPostStatus("loading");
                const req = await fetch(`${apiUrl}/tweet`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    content: comment,
                    link: `${window.location.href}${link}`,
                  }),
                });
                if (req.status !== 200) {
                  setPostStatus("error");
                } else {
                  setPostStatus("success");
                }
              }}
              className="font-medium p-2 py-4 bg-indigo-500 text-white rounded-md mt-4 hover:bg-indigo-400 transition-all ease"
            >
              {renderPostStatus(postStatus)}
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
          {postStatus === "success" && (
            <a
              href={`https://twitter.com/${process.env.NEXT_PUBLIC_TWITTER_USERNAME}/with_replies`}
            >
              <div className="mt-4 text-center flex items-center justify-center p-2 border border-blue-500 rounded-md cursor-pointer">
                <span className="font-semibold text-blue-500">
                  See your post here
                </span>
              </div>
            </a>
          )}
          <div className="mt-3 text-center text-slate-600">
            <p>Or add anonpaper.com before your link.</p>
            <p className="break-words">
              i.e. <span className="text-blue-500">anonpaper.com</span>
              /https://arxiv.org/abs/1706.03762
            </p>
          </div>
        </div>
        <div className="mt-4">
          <a
            data-dnt="true"
            className="twitter-timeline"
            href={`https://twitter.com/${process.env.NEXT_PUBLIC_TWITTER_USERNAME}?ref_src=twsrc%5Etfw`}
          >
            View Twitter Bot
          </a>
        </div>
      </div>
    </main>
  );
}
