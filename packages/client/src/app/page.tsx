"use client";

import { Comment } from "@/components/Comment";
import PaperPreview from "@/components/PaperPreview";
import { PostStatus, Progress } from "@/components/Progress";
import { postComment } from "@/lib/post";
import { useEffect, useState } from "react";

export default function Home() {
  const [link, setLink] = useState<string>("");
  const [postStatus, setPostStatus] = useState<PostStatus>(undefined);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
          {link && (
            <div className="mt-4">
              <PaperPreview link={link} />
              <Comment
                handleSubmit={async (comment, captchaToken) => {
                  await postComment(
                    `/tweet`,
                    {
                      content: comment,
                      link: `${window.location.href}${link}`,
                    },
                    captchaToken,
                    setPostStatus
                  );
                }}
              />
            </div>
          )}
          <Progress progress={postStatus} />
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
