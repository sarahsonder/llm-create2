import { useState, useRef, useEffect } from "react";
import { Textarea, Button } from "@chakra-ui/react";
import ChatTab from "../../chatbot/Chatbot";
import type { Message, Stage } from "../../../types";
import type { ReactNode } from "react";

interface PageTemplateProps {
  children?: ReactNode;
  nextButton?: Button;
  title?: string;
  description?: string;
  left?: boolean;
  buttonLeft?: boolean;
  duration?: number;
  autoRedirectDuration?: number;
  buttonText?: string;
  afterDuration?: () => void;
  llmAccess?: boolean;
  stage: Stage;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;

  selectedWordIndexes?: number[];
}

interface Button {
  text: String;
  action?: () => void;
}

function MultiPageTemplate({
  children,
  title,
  description,
  duration,
  autoRedirectDuration,
  afterDuration,
  buttonText,
  llmAccess = false,
  stage,
  messages,
  setMessages,
  notes,
  setNotes,
  selectedWordIndexes,
}: PageTemplateProps) {
  const [leftWidth, setLeftWidth] = useState(70); // %
  const [topHeight, setTopHeight] = useState(70); // %
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const autoRedirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isDraggingX = useRef(false);
  const isDraggingY = useRef(false);

  const startDragX = () => {
    isDraggingX.current = true;
    document.body.style.userSelect = "none";
  };

  const startDragY = () => {
    isDraggingY.current = true;
    document.body.style.userSelect = "none";
  };

  const updateDrag = (clientX: number, clientY: number) => {
    if (isDraggingX.current) {
      const newWidth = (clientX / window.innerWidth) * 100;
      if (newWidth > 40 && newWidth < 80) setLeftWidth(newWidth);
    }
    if (isDraggingY.current) {
      const containerHeight = window.innerHeight;
      const newHeight = (clientY / containerHeight) * 100;
      if (newHeight > 10 && newHeight < 90) setTopHeight(newHeight);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    updateDrag(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      updateDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const stopDrag = () => {
    isDraggingX.current = false;
    isDraggingY.current = false;
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", stopDrag);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, []);

  const startFadeOut = () => {
    setIsVisible(false);
    setTimeout(() => afterDuration?.(), 500); // matches CSS duration
  };

  useEffect(() => {
    // fade in on mount
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // timer for showing the continue button
  useEffect(() => {
    if (duration && !isTimeUp && autoRedirectDuration) {
      const startTime = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const percentageElapsed = Math.min((elapsed / duration) * 100, 100);
        setProgress(percentageElapsed);

        if (percentageElapsed >= 100) {
          setIsTimeUp(true);
          clearInterval(timerRef.current!);

          autoRedirectTimeoutRef.current = setTimeout(() => {
            startFadeOut();
          }, autoRedirectDuration * 1000);
        }
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration, isTimeUp, afterDuration, autoRedirectDuration]);

  // timer for auto-direct
  useEffect(() => {
    return () => {
      if (autoRedirectTimeoutRef.current) {
        clearTimeout(autoRedirectTimeoutRef.current);
      }
    };
  }, []);

  const handleContinueClick = () => {
    if (autoRedirectTimeoutRef.current) {
      clearTimeout(autoRedirectTimeoutRef.current);
    }
    startFadeOut();
  };

  return (
    <div className="w-full h-full min-w-96 overflow-hidden">
      <div
        className={`flex h-full w-full transform transition-all duration-1000 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Left Panel */}
        <div
          className="flex flex-col w-full h-full bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Main Content */}
          <div
            className=" overflow-auto w-full p-16 pb-8 md:px-20 md:pt-20"
            style={{ height: `${topHeight}%` }}
          >
            <div className="w-full h-max space-y-4">
              <div
                className={`w-full h-max flex text-h1 justify-between items-center flex-row text-h1`}
              >
                <p>{title}</p>
                <Button
                  className={`btn-small px-4 ${
                    !isTimeUp ? "pointer-events-none opacity-50" : ""
                  } font-sans`}
                  onClick={handleContinueClick}
                  disabled={!isTimeUp}
                  style={{
                    background: `linear-gradient(to right, #2F2F2F ${progress}%, #B3B3B3 ${progress}%)`,
                  }}
                >
                  {buttonText}
                </Button>
              </div>

              <div
                className={`w-full h-max flex text-left text-sm font-sans text-grey`}
              >
                <p>{description}</p>
              </div>

              <div className={`w-full flex overflow-auto py-4 h-max`}>
                {children}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-1 bg-gray-300 w-10 self-center cursor-row-resize hover:bg-gray-500"
            onMouseDown={startDragY}
            onTouchStart={startDragY}
          />

          {/* Notes */}
          <div
            className="overflow-auto bg-white flex w-full p-16 pt-8 md:px-20 md:pb-20"
            style={{ height: `${100 - topHeight}%` }}
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take some notes..."
              className="text-main bg-white max-h-full flex-1 px-3 py-2 border rounded-md focus:outline-none focus:border-2 focus:border-grey"
            />
          </div>
        </div>
        {llmAccess ? (
          <>
            {/* Vertical Divider */}
            <div
              className="w-1 bg-gray-300 h-10 self-center cursor-col-resize hover:bg-gray-500"
              onMouseDown={startDragX}
              onTouchStart={startDragX}
            />

            {/* Chatbot Panel */}
            <div className="flex-1 p-4 overflow-auto bg-light-grey-4">
              <ChatTab
                messages={messages}
                setMessages={setMessages}
                stage={stage}
                selectedWordIndexes={selectedWordIndexes}
              />
            </div>
          </>
        ) : (
          <>
            {/* Vertical Divider */}
            <div
              className="w-1 bg-gray-300 h-10 self-center cursor-col-resize hover:bg-gray-500"
              onMouseDown={startDragX}
              onTouchStart={startDragX}
            />

            {/* Chatbot Panel */}
            <div className="flex-1 p-4 overflow-auto bg-light-grey-4">
              <div className="flex flex-col h-full w-full overflow-y-scroll">
                <div className="w-full h-max flex flex-row items-center mt-4">
                  <div className="w-6 h-6 mr-2">
                    <svg viewBox="0 0 92 106" className="w-full h-full">
                      <path
                        fill="#2F2F2F"
                        d="M46 0L56.1221 35.468L91.8993 26.5L66.2442 53L91.8993 79.5L56.1221 70.532L46 106L35.8779 70.532L0.100655 79.5L25.7558 53L0.100655 26.5L35.8779 35.468L46 0Z"
                      />
                    </svg>
                  </div>
                  <p className="text-h2 text-left">Blackout Poetry</p>
                </div>

                <p className="text-sub text-dark-grey text-left mt-2">
                  Blackout poetry encourages readers to create poems by
                  redacting words from ordinary texts.
                </p>
                {stage === "SPARK" ? (
                  <>
                    <p className="text-sub text-left text-dark-grey mt-2">
                      As you start brainstorming your blackout poem, you can
                      think about the following:
                    </p>
                    <ul className=" text-sub text-left text-dark-grey list-disc mt-2 mb-4 pl-4">
                      <li>Themes</li>
                      <li>Tone</li>
                      <li>Mood</li>
                      <li>Imagery</li>
                      <li>Figurative Language</li>
                      <li>Word Choice</li>
                      <li>Symbolism</li>
                      <li className="italic">Anything</li>
                    </ul>
                    <p className="text-sub text-dark-grey text-left mb-4">
                      You have complete freedom to brainstorm however you like.
                      Write down any thoughts, feelings, or ideas that come to
                      mind as you read the passage.
                    </p>{" "}
                  </>
                ) : (
                  <></>
                )}

                {/* <p className="text-h3 text-left mt-4">The passage</p>
                <p className="text-sub text-dark-grey text-left mb-4">
                  What do you initially notice? What are you drawn to?
                </p>
                <p className="text-h3 text-left mt-2">Themes</p>
                <p className="text-sub text-dark-grey text-left mb-4">
                  What themes are you seeing in the passage? What themes do you
                  want to explore in your poem?
                </p>

                <p className="text-h3 text-left mt-2">Emotions</p>
                <p className="text-sub text-dark-grey text-left mb-4">
                  What emotions are you feeling as you read the passage? Is
                  there an emotion you want to express in your poem?
                </p>

                <p className="text-h3 text-left mt-2">Anything</p>
                <p className="text-sub text-dark-grey text-left mb-4">
                  You have complete freedom to brainstorm however you like.
                  Write down any thoughts, feelings, or ideas that come to mind
                  as you read the passage.
                </p> */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MultiPageTemplate;
