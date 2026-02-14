import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudiencePoemQuestions } from "../../../consts/surveyQuestions";
import { Button, Spinner } from "@chakra-ui/react";
import { LuEyeClosed } from "react-icons/lu";
import { HiOutlineDocumentText } from "react-icons/hi2";
import type { SurveyAnswers } from "../../../types";

interface FetchedPoem {
  poemId: string;
  text: number[];
}

const AudiencePoems = () => {
  const [currPoem, setCurrPoem] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [poems, setPoems] = useState<FetchedPoem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPoemEvaluation, addRoleSpecificData } = context;

  const passageId = (userData as any)?.data?.passageId || "1";

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const words = passage.text.split(" ");

  // Fetch poems from API
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchPoems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/firebase/audience/poems?passageId=${encodeURIComponent(
            passageId
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch poems");
        }
        const data = await response.json();
        setPoems(data.poems);

        // Save the poem IDs to user data
        const poemIds = data.poems.map((p: FetchedPoem) => p.poemId);
        addRoleSpecificData({ poemsViewed: poemIds });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load poems");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoems();
  }, []);

  useEffect(() => {
    const container = document.querySelector(
      ".overflow-y-auto"
    ) as HTMLElement | null;
    const onScroll = () => {
      if (container) {
        setShowScrollTop(container.scrollTop > 100);
      } else {
        setShowScrollTop(window.scrollY > 100);
      }
    };

    if (container) {
      container.addEventListener("scroll", onScroll, { passive: true });
      // initialize
      onScroll();
      return () => container.removeEventListener("scroll", onScroll);
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  const handleSubmit = (answers: SurveyAnswers) => {
    addPoemEvaluation(poems[currPoem].poemId, answers, {
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });

    if (currPoem < poems.length - 1) {
      setCurrPoem(currPoem + 1);
      const container = document.querySelector(
        ".overflow-y-auto"
      ) as HTMLElement | null;
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/ranking");
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Step 2: Read the blackout poems"
        description="Loading poems..."
      >
        <div className="flex justify-center items-center py-20">
          <Spinner size="xl" />
        </div>
      </PageTemplate>
    );
  }

  if (error || poems.length === 0) {
    return (
      <PageTemplate
        title="Step 2: Read the blackout poems"
        description="Something went wrong :("
      >
        <div className="flex justify-center items-center py-20 text-red-500">
          {error || "No poems available for this passage"}
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`Step 2: Read the blackout poems (Poem ${currPoem + 1} of ${
        poems.length
      })`}
      description="This is your time to read several blackout poems created from the text you just read and answer a couple of questions about each poem."
    >
      {/* Top Controls */}
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <Button
            className="btn-small-inverted"
            onClick={() => setShowPassage(!showPassage)}
          >
            {showPassage ? <LuEyeClosed /> : <HiOutlineDocumentText />}
            <p className="hidden md:block">
              {showPassage ? "View as Poem" : "View as Passage"}
            </p>
          </Button>
        </div>
      </div>
      <div className="w-[50vh] md:w-[60vh] h-max flex-col space-y-6 py-4 md:py-8 self-center">
        <div className="leading-none text-justify select-none h-max">
          {words.map((word, i) => {
            const isVisible = poems[currPoem].text.includes(i);
            return (
              <span
                key={i}
                className={`text-sm md:text-base transition duration-300  ${
                  isVisible || showPassage
                    ? "text-black bg-white"
                    : "text-transparent bg-dark-grey"
                }`}
              >
                {word + " "}
              </span>
            );
          })}
          <p className="text-xs text-grey text-left pt-2">
            <span className="italic">{'"' + passage.title + '"'}</span>
            <span>{", " + passage.author + " from The New York Times"}</span>
          </p>
        </div>
      </div>
      <SurveyScroll
        key={`survey-${currPoem}`}
        survey={AudiencePoemQuestions}
        onSubmit={handleSubmit}
        buttonText={currPoem < poems.length - 1 ? "Next Poem" : "Finish"}
        noProgressBar
      />
      {showScrollTop && (
        <button
          onClick={() => {
            const container = document.querySelector(
              ".overflow-y-auto"
            ) as HTMLElement | null;
            if (container) {
              container.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="fixed bottom-6 right-6 z-50 bg-dark-grey text-sm md:text-base text-white rounded-md p-3 hover:bg-opacity-80"
          aria-label="Scroll to top"
        >
          ↑ Return to Top
        </button>
      )}
    </PageTemplate>
  );
};

export default AudiencePoems;
