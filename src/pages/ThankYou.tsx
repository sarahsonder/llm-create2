import PageTemplate from "../components/shared/pages/page";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../App";

const ThankYou = () => {
  const [passageText, setPassageText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>(
    Array.from({ length: words.length }, (_, i) => i)
  );

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }
  const { userData } = context;
  useEffect(() => {
    if (userData?.role === "artist") {
      setPassageText(userData?.data.poem.passage?.text);
    }
  }, [userData]);

  useEffect(() => {
    setWords(passageText.split(" "));
    if (userData?.role === "artist") {
      setVisibleIndexes(userData?.data.poem?.text || []);
    }
  }, [passageText]);

  return (
    <PageTemplate background="bg4" title="">
      <div className="w-full h-full flex-col content-center justify-items-center grid">
        <div className="max-w-3xl h-full flex flex-col">
          <p className="text-h1-dark text-center mb-2">Thank you!</p>
          <p className="text-main-dark text-sm text-center mb-4">
            We are grateful for your time and we hope you found this enjoyable!
            Here is your final poem:
          </p>
          <div className="max-w-3xl text-center leading-relaxed flex flex-wrap p-4 bg-white rounded-xl">
            {words.map((word, i) => {
              const isVisible = visibleIndexes.includes(i);
              return (
                <span
                  key={i}
                  className={`px-1 transition duration-300 ${
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
      </div>
    </PageTemplate>
  );
};

export default ThankYou;
