import React, { useState } from "react";

interface InvalidComment {
  reason: "Message is too long" | "Message empty" | undefined;
  render?: boolean;
}

export const Comment: React.FC<{
  handleSubmit: (comment: string) => void;
}> = ({ handleSubmit }) => {
  const [comment, setComment] = useState("");
  const [invalidComment, setInvalidComment] = useState<
    InvalidComment | undefined
  >({ reason: "Message empty", render: false });

  let debounceTimeout: NodeJS.Timeout;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (event.target.value.length > 280) {
        setInvalidComment({ reason: "Message is too long" });
      } else if (event.target.value.length === 0) {
        setInvalidComment({ reason: "Message empty", render: false });
      } else if (invalidComment) {
        setInvalidComment(undefined);
      }
    }, 300);
  };

  return (
    <div className="flex flex-col mt-4 w-full">
      <input
        type="text"
        placeholder="Type your comment here"
        className="text-black rounded-md p-4 bg-gray-100"
        onChange={handleInputChange}
      />
      {!invalidComment ? (
        <button
          onClick={() => handleSubmit(comment)}
          className="font-medium p-2 py-4 bg-indigo-500 text-white rounded-md mt-4 hover:bg-indigo-400 transition-all ease"
          disabled={!comment}
        >
          Post anonymously
        </button>
      ) : (
        <>
          {invalidComment.reason && invalidComment.render && (
            <div className="text-center mt-4">
              <span className="text-red-500">{invalidComment.reason}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
