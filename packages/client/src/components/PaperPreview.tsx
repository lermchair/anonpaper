import { LinkMetadata, fetchMetadata, isValidUrl } from "@/lib/metadata";
import React, { useEffect, useState } from "react";

const PaperPreview: React.FC<{ link: string }> = ({ link }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | undefined>(
    undefined
  );

  async function getData(link: string) {
    return await fetchMetadata(link);
  }

  useEffect(() => {
    if (link && isValidUrl(link)) {
      getData(link).then((md) => setLinkMetadata(md));
    } else {
      setLinkMetadata(undefined);
    }
  }, [link]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="shadow-lg p-4 rounded-xl relative">
      {!linkMetadata ? (
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
      ) : (
        <>
          {" "}
          <div className="flex justify-between items-center">
            <h2 className="font-sans font-semibold text-lg text-slate-800">
              {linkMetadata.title}
            </h2>
            <div className="rounded bg-slate-100 p-2 pointer hover:bg-slate-200 ease transition-colors">
              <a
                href={link}
                target="_blank"
                className="text-gray-600 hover:text-gray-800"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
          <div
            className={`font-serif  text-slate-700 ${
              !isExpanded ? "overflow-hidden max-h-[150px]" : ""
            } relative`}
          >
            <p>{linkMetadata.description}</p>
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"></div>
            )}
          </div>
          <button
            className="mt-2 text-blue-500 hover:text-blue-600"
            onClick={toggleExpanded}
          >
            {isExpanded ? "Read Less" : "Read more"}
          </button>
        </>
      )}
    </div>
  );
};

export default PaperPreview;
