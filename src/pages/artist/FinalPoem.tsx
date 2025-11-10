import PageTemplate from "../../components/shared/pages/page";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../App";

const FinalPoem = () => {
  const navigate = useNavigate();
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

  const handleSubmit = () => {
    navigate("/artist/post-survey");
  };

  return (
    <PageTemplate
      background="bg4"
      nextButton={{ text: "Let's wrap up", action: handleSubmit }}
      title=""
    >
      <div className="w-full h-full flex-col content-center justify-items-center space-y-4">
        <p className="text-h1-dark w-3xl text-left">Your Final Poem</p>
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
    </PageTemplate>
  );
};

export default FinalPoem;
