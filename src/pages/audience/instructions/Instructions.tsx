import { Collapsible, Icon, Image } from "@chakra-ui/react";
import PageTemplate from "../../../components/shared/pages/audiencePages/scrollFullPage";
import { useNavigate } from "react-router-dom";
import { MdInfoOutline } from "react-icons/md";
import BlackoutExample1 from "../../../assets/blackout1.png";
import BlackoutExample2 from "../../../assets/blackout2.png";
import CheatIcon from "../../../assets/cheat-icon.png";
import { useContext } from "react";
import { DataContext } from "../../../App";

const AudienceInstructions = () => {
  const navigate = useNavigate();
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("Component must be used within a DataContext.Provider");
  }

  const { userData, addRoleSpecificData } = context;

  const handleSubmit = () => {
    addRoleSpecificData({
      timeStamps: [...(userData?.data?.timeStamps ?? []), new Date()],
    });
    navigate("/audience/passage");
  };

  return (
    <PageTemplate
      title="Your Task"
      nextButton={{ text: "Begin step 1", action: handleSubmit }}
    >
      <div className="w-full h-max flex-col space-y-6">
        <div className="text-main mb-2">
          In this study, you will be introduced to blackout poetry and read a
          couple blackout poems! In a previous study, we asked participants to
          write their own blackout poems, and now you will read some of the
          poems they created. We will first share with you the passage that the
          participants used for their blackout poems, then ask you a couple
          questions about each poem.
          <Collapsible.Root unmountOnExit>
            <Collapsible.Trigger className="text-main underline italic text-light-grey-1 pt-2">
              <div className="flex flex-row items-center space-x-2">
                <Icon className="w-4 h-4 fill-light-grey-1">
                  <MdInfoOutline />
                </Icon>
                <p>Click here for more information on blackout poetry</p>
              </div>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="w-full h-max p-4 mt-3 border rounded-lg border-light-grey-2">
                <p className="text-main">
                  <strong className="italic">Blackout poetry</strong> involves{" "}
                  <strong>blacking out words</strong> from an existing piece of
                  text <strong>to create a new poem</strong>.
                </p>
                <p className="text-main pt-1">
                  Here are two examples of blackout poetry made using the same
                  piece of text:{" "}
                </p>
                <div className="w-full h-max flex flex-col md:flex-row">
                  <Image
                    alt="Blackout Example 1"
                    src={BlackoutExample1}
                    className="w-64"
                  />
                  <Image
                    alt="Blackout Example 2"
                    src={BlackoutExample2}
                    className="w-64"
                  />
                </div>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
        <div>
          <p className="text-main mb-2">The task involves three steps:</p>
          <ul className="list-decimal mb-4 pl-6 space-y-4">
            <li className="text-main">
              <strong>Familiarize yourself with the text</strong>
              <p className="text-main">
                You’ll be shown the passage used to create the blackout poems.
                For now, you won’t start analyzing the poems yet!
              </p>
            </li>
            <li className="text-main">
              <strong>Read the poems</strong>
              <p className="text-main w-full max-w-128">
                You will be shown 4 blackout poems created from the passage one
                by one. For each poem, take your time to read and reflect on
                them. After reading each poem, you will be asked a couple of
                questions about it.
              </p>
            </li>
            <li className="text-main">
              <strong>Final thoughts</strong>
              <p className="text-main w-full max-w-128">
                After reading all the poems, you will be asked a couple of final
                questions about your experience and thoughts.
              </p>
            </li>
          </ul>
          <div className="w-full h-max p-4 mt-4 border rounded-lg border-light-grey-2 flex items-center gap-4">
            <Image alt="Cheat icon" src={CheatIcon} className="w-12" />
            <p className="text-main mb-0">
              Important: please do not take screenshots, copy text, or consult
              external tools such as ChatGPT. We're interested in your best
              effort and what you learn! In addition, do not refresh or use the
              browser's back/forward buttons as you will not be able to continue
              the task.
            </p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default AudienceInstructions;
