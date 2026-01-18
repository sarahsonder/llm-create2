import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import { Poems } from "../../../consts/poems";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceAIQuestionSurvey } from "../../../consts/surveyQuestions";
import type { SurveyDefinition, Section } from "../../../types";

const AudienceAI = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const passageId = (userData as any)?.data?.passage || "1";

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const words = passage.text.split(" ");

  const poems = Poems;

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

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/ai-disclosure");
  };
  const buildAudienceAISurvey = (): SurveyDefinition => {
    return {
      ...AudienceAIQuestionSurvey,
      sections: AudienceAIQuestionSurvey.sections.map((section: Section) => {
        if (section.id !== "section1") return section;

        const questions = poems.flatMap((poem, i) => {
          const poemId = `poem-${i}`;

          return [
            {
              id: `ai-${poemId}-yn`,
              type: "multipleChoice",
              children: (
                <div className="w-[50vh] h-max flex-col space-y-6 py-4 self-center">
                  <div className="leading-none text-justify select-none h-max">
                    {words.map((word, i) => {
                      const isVisible = poem.text.includes(i);
                      return (
                        <span
                          key={i}
                          className={`text-sm transition duration-300 ${
                            isVisible
                              ? "text-black bg-white"
                              : "text-transparent bg-dark-grey"
                          }`}
                        >
                          {word + " "}
                        </span>
                      );
                    })}
                    <p className="text-xs text-grey text-left pt-2">
                      <span className="italic">
                        {'"' + passage.title + '"'}
                      </span>
                      <span>
                        {", " + passage.author + " from The New York Times"}
                      </span>
                    </p>
                  </div>
                </div>
              ),

              question: `Was Poem ${i + 1} created with AI?`,
              options: ["Yes", "No", "Not sure"],
              required: true,
              poemId,
            },
            {
              id: `ai-${poemId}-why`,
              type: "openEnded",
              question: "What factors influenced your selection?",
              required: true,
              poemId,
            },
            {
              id: `ai-${poemId}-confidence`,
              type: "likertScale",
              question: `How confident are you in this judgment for Poem ${
                i + 1
              }?`,
              options: [
                { label: "Not at all confident	", value: 1 },
                { label: "Slightly confident", value: 2 },
                { label: "Moderately confident", value: 3 },
                { label: "Very confident", value: 4 },
                { label: "Extremely confident", value: 5 },
              ],
              required: true,
              poemId,
            },
          ];
        });

        return {
          ...section,
          questions,
        };
      }),
    } as SurveyDefinition;
  };

  return (
    <PageTemplate
      title={`Step 2: Which poems were created with AI?`}
      description="During the creation of the blackout poems, some artists had the option to create with the assistance of an AI tool. Please review each poem and indicate which poem(s) you believe were created with AI assistance."
    >
      <div className="w-[300px] md:w-[600px] h-max flex-col space-y-6 py-4 md:py-8 self-center">
        <div className="leading-none text-justify select-none h-max">
          {words.map((word, i) => {
            return (
              <span
                key={i}
                className={`text-sm md:text-base transition duration-300 text-black bg-white`}
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
        key={`survey-ai`}
        survey={buildAudienceAISurvey()}
        onSubmit={handleSubmit}
        buttonText={"Next"}
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

export default AudienceAI;
