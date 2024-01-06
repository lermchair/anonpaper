import React from "react";

export type PostStatus = "loading" | "success" | "error" | undefined;

function renderPostStatus(status: PostStatus): React.ReactNode {
  switch (status) {
    case "loading":
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          ></div>
          <span className="mt-2">Posting Tweet...</span>
        </div>
      );
    case "success":
      return <span className="text-emerald-600">Successfully posted!</span>;
    case "error":
      return <span className="text-red-400">Error. Please try again.</span>;
    default:
      return undefined;
  }
}

export const Progress: React.FC<{
  progress: PostStatus;
}> = ({ progress }) => {
  return (
    <div className="flex flex-col mt-4 w-full">
      {progress && (
        <div className="mt-4 text-center flex items-center justify-center p-2 text-slate-500">
          {renderPostStatus(progress)}
        </div>
      )}
      {progress === "success" && (
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
    </div>
  );
};
