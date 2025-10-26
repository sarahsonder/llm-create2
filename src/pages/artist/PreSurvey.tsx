import { useNavigate } from "react-router-dom";
import HalfPageTemplate from "../../components/shared/pages/halfPage";
import { useContext } from "react";
import { DataContext } from "../../App";
import { ArtistPreSurveyQuestions } from "../../consts/surveyQuestions";
import SurveyScroll from "../../components/survey/surveyScroll";

const AristPreSurvey = () => {
  const navigate = useNavigate();

  const context = useContext(DataContext);
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addPreSurvey, addRoleSpecificData } = context;
  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const handleSubmit = (answers: any) => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/artist/instructions");
    addPreSurvey({
      id: "artistSurvey",
      preSurvey: ArtistPreSurveyQuestions,
      preAnswers: answers,
    });
  };

  return (
    <HalfPageTemplate
      description="Please fill out the following questions before we begin!"
      background="bg5"
    >
      <SurveyScroll survey={ArtistPreSurveyQuestions} onSubmit={handleSubmit} />
    </HalfPageTemplate>
  );
};

export default AristPreSurvey;
