import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { AudiencePostSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import PageTemplate from "../../components/shared/pages/audiencePages/scrollFullPage";
import type { Audience } from "../../types";
import { toaster } from "../../components/ui/toaster";

const AudiencePostSurvey = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPostSurvey, sessionId } = context;

  const submitDb = async (answers: any) => {
    if (!userData || !userData.data) {
      console.error("userData not loaded yet!");
      return;
    }

    const audienceData = userData.data as Audience;
    const survey = audienceData.surveyResponse;

    const surveyData = {
      preAnswers: survey?.preAnswers ?? {},
      poemAnswers: survey?.poemAnswers ?? [],
      rankingData: survey?.rankingData ?? {},
      AIAnswers: survey?.AIAnswers ?? {},
      reRankingData: survey?.reRankingData ?? {},
      postAnswers: answers,
    };

    try {
      const response = await fetch("/api/firebase/audience/commit-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceData,
          surveyData,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to commit session");
      }

      toaster.create({
        description: "Survey successfully submitted!",
        type: "success",
        duration: 5000,
      });
      navigate("/audience/thank-you");
    } catch (error) {
      console.error("Error saving data:", error);
      toaster.create({
        description: "There was an error submitting your survey. Please try again.",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleSubmit = async (answers: any) => {
    // Save post-survey answers locally
    addPostSurvey({
      postAnswers: answers,
    });

    // Commit to database
    await submitDb(answers);
  };

  return (
    <PageTemplate description="Please fill out the following questions before we end! (Scroll to view all questions)">
      <SurveyScroll
        survey={AudiencePostSurveyQuestions}
        onSubmit={handleSubmit}
      />
    </PageTemplate>
  );
};

export default AudiencePostSurvey;
