import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "../../App";
import { AudiencePreSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";
import PageTemplate from "../../components/shared/pages/audiencePages/scrollFullPage";

const AudiencePreSurvey = () => {
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
    navigate("/audience/instructions");
    addPreSurvey({
      id: "artistSurvey",
      preSurvey: AudiencePreSurveyQuestions,
      preAnswers: answers,
    });
  };

  return (
    <PageTemplate description="Please fill out the following questions before we begin! (Scroll to view all questions)">
      <SurveyScroll
        survey={AudiencePreSurveyQuestions}
        onSubmit={handleSubmit}
      />
    </PageTemplate>
  );
};

export default AudiencePreSurvey;
