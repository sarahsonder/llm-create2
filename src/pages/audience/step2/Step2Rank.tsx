import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DataContext } from "../../../App";
import { Passages } from "../../../consts/passages";
import { Poems } from "../../../consts/poems";
import SurveyScroll from "../../../components/survey/surveyScroll";
import { AudienceRankingQuestions } from "../../../consts/surveyQuestions";
import type { SurveyDefinition, Section, SurveyAnswers, RankingData, StatementMatch, PoemRankings } from "../../../types";

// TODO: Remove - Hard-coded fallback data for standalone rendering/testing
// const defaultContextValue = {
//   userData: {
//     role: "audience" as const,
//     data: {
//       passage: "1",
//       timeStamps: [] as Date[],
//       poemsViewed: ["nvDp4FklkwSvxAMsyNqn", "5XWe4xHm6G1e9d43hKW7", "La33yHt4rC5vKg23fs7b", "FbCyvCErYRKrImwaksMZ"], // fallback poem IDs for testing
//     },
//   },
//   addRoleSpecificData: (_updates: any) => {
//     console.log("[Standalone Mode] addRoleSpecificData called:", _updates);
//   },
//   addRankSurvey: (_rankingData: RankingData) => {
//     console.log("[Standalone Mode] addRankSurvey called:", _rankingData);
//   },
// };

// Fallback statements for standalone testing or when API fails
const fallbackStatements = [
  "Statement A",
  "Statement B",
  "Statement C",
  "Statement D",
];

// Type for tracking which statement belongs to which poem
type PoemStatementMap = Record<string, string>; // poemId -> correct statement

const AudienceRanking = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [artistStatements, setArtistStatements] = useState<string[]>([]);
  const [correctStatements, setCorrectStatements] = useState<PoemStatementMap>({}); // Maps poemId to its correct statement
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData, addRankSurvey } = context;

  const passageId = (userData as any)?.data?.passageId || "1";
  // TODO: Remove hard coded values
  const poemsViewed: string[] = (userData as any)?.data?.poemsViewed || ["nvDp4FklkwSvxAMsyNqn", "5XWe4xHm6G1e9d43hKW7", "La33yHt4rC5vKg23fs7b", "FbCyvCErYRKrImwaksMZ"];

  const passage = Passages.find((p) => p.id === passageId) || Passages[0];
  const poems = Poems;

  // Fetch artist statements on mount
  useEffect(() => {
    const fetchArtistStatements = async () => {
      if (poemsViewed.length === 0) {
        setArtistStatements(fallbackStatements);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/firebase/audience/artist-statements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ poemIds: poemsViewed }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch artist statements");
        }

        const data = await response.json();
        // Filter out nulls and build the correct statement mapping
        const validStatements = data.poemStatements.filter(
          (s: { poemId: string; statement: string } | null) => s !== null
        ) as { poemId: string; statement: string }[];

        // Build poemId -> statement mapping for correctness checking
        const statementMap: PoemStatementMap = {};
        validStatements.forEach((s) => {
          statementMap[s.poemId] = s.statement;
        });
        setCorrectStatements(statementMap);

        // Extract just the statement strings for display options (already shuffled by API)
        const statements = validStatements.map((s) => s.statement);
        setArtistStatements(statements.length > 0 ? statements : fallbackStatements);
      } catch (error) {
        console.error("Error fetching artist statements:", error);
        setArtistStatements(fallbackStatements);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtistStatements();
  }, []);

  // Options for multiple choice: statements + "Unsure"
  const statementOptions = [...artistStatements, "Unsure"];

  const surveyWithItems = (() => {
    const words = passage.text.split(" ");

    return {
      ...AudienceRankingQuestions,
      sections: AudienceRankingQuestions.sections.map((section: Section) => {
        // ---- SECTION 1: dragRank ----
        if (section.id === "section1") {
          return {
            ...section,
            questions: section.questions.map((q) => {
              if (q.type !== "dragRank") return q;

              const items = poems.map((poem, i) => ({
                id: `${q.id}-poem-${i}`,
                title: `Poem ${i + 1}`,
                content: (
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
              }));

              return { ...q, items };
            }),
          };
        }

        // ---- SECTION 2: one multipleChoice question per poem ----
        if (section.id === "section2") {
          return {
            ...section,
            questions: poems.flatMap((poem, i) => [
              {
                id: `q4-poem-${i}`,
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
                question: `Poem ${i + 1}`,
                options: statementOptions,
                required: true,
              },
              {
                id: `q4-poem-${i}-unsure`,
                type: "openEnded",
                question:
                  "If you selected 'Unsure', please explain why (optional)",
                required: false,
                poemId: `poem-${i}`,
              },
            ]),
          };
        }

        return section;
      }),
    } as SurveyDefinition;
  })();

  //     return {
  //       ...AudienceRankingQuestions,
  //       sections: AudienceRankingQuestions.sections.map((section) => ({
  //         ...section,
  //         questions: section.questions.map((q) =>
  //           q.type === "dragRank" ? { ...q, items } : q
  //         ),
  //       })),
  //     };
  //   })();

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
    // Helper to process a dragRank answer into ordered poemIds
    const processRanking = (questionId: string): string[] => {
      const rankingAnswer = answers[questionId] as string[] | undefined;
      return rankingAnswer
        ? rankingAnswer.map((itemId) => {
            // Extract poem index from item ID (e.g., "q1-poem-2" -> 2)
            const match = itemId.match(/poem-(\d+)$/);
            const index = match ? parseInt(match[1], 10) : 0;
            return poemsViewed[index] || itemId;
          })
        : [];
    };

    // Process all three rankings
    const poemRankings: PoemRankings = {
      favourite: processRanking("q1"),
      impact: processRanking("q2"),
      creative: processRanking("q3"),
    };

    // Process statement matching answers
    const statementMatches: StatementMatch[] = poems.map((_, i) => {
      const poemId = poemsViewed[i] || `poem-${i}`;
      const chosenStatement = (answers[`q4-poem-${i}`] as string) || "";
      const explanation = (answers[`q4-poem-${i}-unsure`] as string) || undefined;
      
      // Check if the chosen statement matches the correct one for this poem
      const correctStatement = correctStatements[poemId];
      const isCorrect = chosenStatement !== "Unsure" && chosenStatement === correctStatement;
      
      return {
        poemId,
        isCorrect,
        chosenStatement,
        ...(chosenStatement === "Unsure" && explanation ? { explanation } : {}),
      };
    });

    // Save ranking data
    const rankingData: RankingData = {
      poemRankings,
      statementMatches,
    };
    console.log(rankingData);
    addRankSurvey(rankingData);

    // Update timestamps and navigate
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/ai");
  };

  if (isLoading) {
    return (
      <PageTemplate
        title={`Step 2: Answer some questions about the poems`}
        description="Now that you have read all the blackout poems, please answer the following questions about them."
      >
        <div className="flex items-center justify-center py-16">
          <p className="text-grey">Loading...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`Step 2: Answer some questions about the poems`}
      description="Now that you have read all the blackout poems, please answer the following questions about them."
    >
      {/* Top Controls */}
      <div className="w-[50vh] md:w-[60vh] h-max flex-col space-y-6 pt-4 md:pt-8 self-center">
        <p
          className="text-main text-justify text-sm md:text-base select-none"
          onCopy={(e) => e.preventDefault()}
        >
          {passage.text}
        </p>
        <p className="text-xs text-grey text-left pt-2">
          <span className="italic">{'"' + passage.title + '"'}</span>
          <span>{", " + passage.author + " from The New York Times"}</span>
        </p>
      </div>
      <SurveyScroll
        key={`survey-rank`}
        survey={surveyWithItems}
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

export default AudienceRanking;
