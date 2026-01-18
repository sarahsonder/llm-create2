import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { AudiencePostSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import PageTemplate from "../../components/shared/pages/audiencePages/scrollFullPage";

const AudiencePostSurvey = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPreSurvey, addRoleSpecificData } = context;

  const handleSubmit = (answers: any) => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/thank-you");
    addPreSurvey({
      id: "audienceSurvey",
      preSurvey: AudiencePostSurveyQuestions,
      preAnswers: answers,
    });
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
