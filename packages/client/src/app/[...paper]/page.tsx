"use client";

import { Comment } from "@/components/Comment";
import PaperPreview from "@/components/PaperPreview";
import { PostStatus, Progress } from "@/components/Progress";
import { postComment } from "@/lib/post";
import { useEffect, useState } from "react";

export interface ArxivData {
  title: string;
  summary: string;
}

function buildUrl(urlParts: string[]): string {
  if (urlParts.includes("http:") || urlParts.includes("https:")) {
    urlParts[0] = `${urlParts[0]}/`;
  }

  let indexDomain = urlParts.indexOf("x.com");
  if (indexDomain !== -1) urlParts[indexDomain] = "twitter.com";
  return urlParts.join("/");
}

export default function Page({ params }: { params: { paper: string[] } }) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [postStatus, setPostStatus] = useState<PostStatus>(undefined);

  useEffect(() => {
    const createEmbedLink = async () => {
      let link = params.paper.map((p) => decodeURIComponent(p));
      setPreviewUrl(buildUrl(link));
    };
    createEmbedLink();
  }, [params.paper]);

  return (
    <main>
      <div className="container mx-auto max-w-xl mt-24 text-base px-6">
        <h1 className="font-serif text-2xl mb-2">
          {`Anonymously ${
            previewUrl && previewUrl.includes("twitter.com")
              ? "Reply to Tweets"
              : "Tweet"
          } about Papers`}
        </h1>
        <p className="text-slate-600">
          Take control of a Twitter bot that posts hot takes about academic
          papers on your behalf.
        </p>
        {previewUrl && (
          <div className="mt-3">
            {previewUrl.includes("twitter.com") ? (
              <>
                <blockquote className="twitter-tweet">
                  <a href={`${previewUrl}`}></a>
                </blockquote>
                <script
                  async
                  src="https://platform.twitter.com/widgets.js"
                  charSet="utf-8"
                ></script>
              </>
            ) : (
              <PaperPreview link={previewUrl} />
            )}
          </div>
        )}
        <Comment
          handleSubmit={async (comment, captchaToken) => {
            if (previewUrl?.includes("twitter.com")) {
              const [
                _protocol,
                _space,
                _domain,
                twitterUserId,
                _path,
                tweetId,
              ] = previewUrl.split("/");
              const path = `/reply/${twitterUserId}/${tweetId}`;
              await postComment(
                path,
                { content: comment },
                captchaToken,
                (progress) => {
                  setPostStatus(progress);
                }
              );
            } else {
              await postComment(
                `/tweet`,
                {
                  content: comment,
                  link: window.location.href,
                },
                captchaToken,
                (progress) => {
                  setPostStatus(progress);
                }
              );
            }
          }}
        />
        <Progress progress={postStatus} />
      </div>
    </main>
  );
}
