import type { ReactNode } from "react";
import type { Poem } from "../../../types";

interface PageTemplateProps {
  children?: ReactNode;

  title?: string;
  description?: string;
  background?: "bg1" | "bg2" | "bg3" | "bg4" | "bg5" | "none"; // limited options
  left?: boolean;
  poem?: Poem;
}

function PoemPageTemplate({
  children,
  background = "none",
  description,
  poem,
}: PageTemplateProps) {
  const words = poem ? poem.passage.text.split(" ") : [];
  const visibleIndexes = poem ? poem.text : [];
  return (
    <div
      className={`w-full h-full min-w-96 bg-white overflow-hidden p-16 md:p-20`}
    >
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 md:gap-x-16 overflow-scroll md:overflow-hidden">
        {poem ? (
          <div className="content-center pb-4 h-max md:h-[70vh] text-center leading-relaxed flex flex-wrap bg-white rounded-xl">
            <div className="max-w-3xl h-max text-center leading-relaxed flex flex-wrap p-8 bg-white border rounded-xl">
              <div className="w-full text-h2 mb-4 flex flex-row items-center justify-items-center">
                <div className="w-6 h-6 mr-2">
                  <svg viewBox="0 0 92 106" className="w-full h-full">
                    <path
                      fill="#2F2F2F"
                      d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
                    />
                  </svg>
                </div>
                <p className="text-h2"> Your Final Poem</p>
              </div>
              {words.map((word, i) => {
                const isVisible = visibleIndexes.includes(i);
                return (
                  <span
                    key={i}
                    className={`px-1 text-xs transition duration-300 ${
                      isVisible
                        ? "text-black bg-white"
                        : "text-transparent bg-dark-grey"
                    }`}
                  >
                    {word + " "}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div></div>
        )}

        <div className={`h-full w-full space-y-4 flex flex-col`}>
          <div className={`w-full h-max space-y-4`}>
            {description && (
              <div
                className={
                  `w-full h-max flex text-left font-sans font text-grey ` +
                  (background == "bg4" ? `text-main-dark` : `text-main`)
                }
              >
                <p>{description}</p>
              </div>
            )}
            <div className={`w-full py-4 md:h-[70vh]`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoemPageTemplate;
