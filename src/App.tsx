import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import "./index.css";
import Captcha from "./pages/Captcha";
import ConsentForm from "./pages/ConsentForm";
import AristPreSurvey from "./pages/artist/PreSurvey";
import ArtistInstructions from "./pages/artist/instructions/Instructions";
import ArtistTransitionStep1 from "./pages/artist/step1/TransitionStep1";
import ArtistStep1 from "./pages/artist/step1/Step1";
import ArtistTransitionStep2 from "./pages/artist/step2/TransitionStep2";
import ArtistStep2 from "./pages/artist/step2/Step2";
import ArtistPostSurvey from "./pages/artist/PostSurvey";
import ThankYou from "./pages/ThankYou";
import UserError from "./pages/Error";
import PoemViewer from "./pages/PoemViewer";
import usePreventRefresh from "./components/shared/preventRefresh";
import { nanoid } from "nanoid";

// import AudienceInstructions from "./pages/audience/instructions/Instructions";
// ================= AUDIENCE PAGES =================
// import ChooseYourCharacter from "./pages/ChooseYourCharacter";
// import AudiencePreSurvey from "./pages/audience/PreSurvey";
// import AudienceTransitionStep1 from "./pages/audience/step1/TransitionStep1";
// import AudienceStep1 from "./pages/audience/step1/Step1";
// import AudienceStep2 from "./pages/audience/step2/Step2";
// import AudienceTransitionStep2 from "./pages/audience/step2/TransitionStep2";
// import AudiencePostSurvey from "./pages/audience/PostSurvey";
import LLMInstruction from "./pages/artist/instructions/llmInstructions";
import { useState, createContext, useEffect, useMemo, useRef } from "react";
import type {
  UserData,
  Artist,
  Audience,
  ArtistSurvey,
  AudienceSurvey,
} from "./types";
import { Provider } from "./components/ui/provider";
import { Toaster } from "./components/ui/toaster";
import { db } from "./firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { globalSaveQueue } from "./utils/saveQueue";

interface DataContextValue {
  userData: UserData | null;
  addUserData: (newData: Partial<UserData>) => void;
  addRoleSpecificData: (updates: Partial<Artist> | Partial<Audience>) => void;
  addPreSurvey: (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => void;
  addPostSurvey: (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => void;
  sessionId: string | null;
  flushSaves: () => Promise<void>;
  // Local-only progress (never written to Firestore)
  localProgress: { step1Completed: boolean; step2Completed: boolean };
  markStep1Complete: () => void;
  markStep2Complete: () => void;
}

export const DataContext = createContext<DataContextValue | null>(null);

function App() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [localProgress, setLocalProgress] = useState({
    step1Completed: false,
    step2Completed: false,
  });
  usePreventRefresh(
    "To make sure your session counts, please avoid refreshing the page. Do you still want to refresh?"
  );

  // Generate or restore a session id
  useEffect(() => {
    const existing = sessionStorage.getItem("sessionId");
    if (existing) {
      setSessionId(existing);
    } else {
      const id = nanoid();
      sessionStorage.setItem("sessionId", id);
      setSessionId(id);
    }
    // Attempt restore of last userData snapshot
    const cached = sessionStorage.getItem("userDataSnapshot");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUserData(parsed);
      } catch {
        console.log("Error parsing user data");
      }
    }
    // Restore local-only progress
    const lp = sessionStorage.getItem("localProgress");
    if (lp) {
      try {
        const parsed = JSON.parse(lp);
        setLocalProgress({
          step1Completed: !!parsed.step1Completed,
          step2Completed: !!parsed.step2Completed,
        });
      } catch {}
    }
  }, []);

  const completionStatus = useMemo(() => {
    if (!userData) return "started";
    const data: any = userData.data || {};
    if (data?.surveyResponse?.preAnswers) return "pre-survey";
    if (localProgress.step1Completed) return "brainstorm";
    if (localProgress.step2Completed) return "write";
    if (data?.surveyResponse?.postAnswers) return "post-survey";
    return "started";
  }, [userData, localProgress]);

  const markStep1Complete = () => {
    setLocalProgress((prev) => {
      const next = { ...prev, step1Completed: true };
      sessionStorage.setItem("localProgress", JSON.stringify(next));
      return next;
    });
  };

  const markStep2Complete = () => {
    setLocalProgress((prev) => {
      const next = { ...prev, step2Completed: true };
      sessionStorage.setItem("localProgress", JSON.stringify(next));
      return next;
    });
  };

  const enqueueAutosave = useMemo(() => {
    return (data: UserData | null) => {
      if (!data || !sessionId) return;
      // Backup locally first to survive abrupt closes
      sessionStorage.setItem("userDataSnapshot", JSON.stringify(data));
      sessionStorage.setItem("completionStatus", completionStatus);
      // Debounce: save after 500ms of idle
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        globalSaveQueue.enqueue(async () => {
          const ref = doc(collection(db, "incompleteSessions"), sessionId);
          const payload = {
            sessionId,
            role: data.role,
            partialData: data.data,
            lastUpdated: serverTimestamp(),
            completionStatus,
          };
          await setDoc(ref, payload, { merge: true });
        });
      }, 500);
    };
  }, [sessionId, completionStatus]);

  const flushSaves = () => globalSaveQueue.flush();

  const addUserData = (newData: Partial<UserData>) => {
    setUserData((prev) => {
      const data = {
        ...(prev || {}),
        ...newData,
        data: {
          ...(prev?.data || {}),
          ...(newData.data || {}),
        },
      };

      return data as UserData;
    });
  };

  const addRoleSpecificData = (
    updates: Partial<Artist> | Partial<Audience>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error(
          "Tried to update data when userData is null or incomplete."
        );
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          ...updates,
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addPreSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update pre-survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            preSurvey: {
              ...(prev.data.surveyResponse?.preSurvey || {}),
              ...(updates.preSurvey || {}),
            },
            preAnswers: {
              ...(prev.data.surveyResponse?.preAnswers || {}),
              ...(updates.preAnswers || {}),
            },
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  const addPostSurvey = (
    updates: Partial<ArtistSurvey> | Partial<AudienceSurvey>
  ) => {
    setUserData((prev: any) => {
      if (!prev || !prev.data) {
        throw new Error("Tried to update post-survey when userData is null.");
      }

      const next = {
        ...prev,
        data: {
          ...prev.data,
          surveyResponse: {
            ...prev.data.surveyResponse,
            postSurvey: {
              ...(prev.data.surveyResponse?.postSurvey || {}),
              ...(updates.postSurvey || {}),
            },
            postAnswers: {
              ...(prev.data.surveyResponse?.postAnswers || {}),
              ...(updates.postAnswers || {}),
            },
          },
        },
      };
      enqueueAutosave(next as UserData);
      return next;
    });
  };

  // Flush saves on tab hide/close
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        // best effort flush queued writes
        flushSaves();
      }
    };
    const onBeforeUnload = () => {
      if (userData) {
        // attempt synchronous backup
        sessionStorage.setItem("userDataSnapshot", JSON.stringify(userData));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [userData]);

  return (
    <DataContext.Provider
      value={{
        userData,
        addUserData,
        addRoleSpecificData,
        addPostSurvey,
        addPreSurvey,
        sessionId,
        flushSaves,
        localProgress,
        markStep1Complete,
        markStep2Complete,
      }}
    >
      <Provider>
        <div className="w-screen h-screen">
          <Toaster />
          <Router>
            <Routes>
              <Route path="/" element={<Captcha />} />
              <Route path="/consent" element={<ConsentForm />} />
              <Route path="/poem-viewer" element={<PoemViewer />} />
              {userData && (
                <>
                  <Route
                    path="/artist/pre-survey"
                    element={<AristPreSurvey />}
                  />
                  <Route
                    path="/artist/instructions"
                    element={<ArtistInstructions />}
                  />
                  <Route
                    path="/artist/step-1"
                    element={<ArtistTransitionStep1 />}
                  />
                  <Route path="/artist/brainstorm" element={<ArtistStep1 />} />
                  <Route
                    path="/artist/step-2"
                    element={<ArtistTransitionStep2 />}
                  />
                  <Route path="/artist/blackout" element={<ArtistStep2 />} />
                  <Route
                    path="/artist/post-survey"
                    element={<ArtistPostSurvey />}
                  />
                  <Route
                    path="/artist/assistant-instructions"
                    element={<LLMInstruction />}
                  />
                  <Route path="/thank-you" element={<ThankYou />} />
                </>
              )}

              <Route path="/*" element={<UserError />} />
              {/* 
              AUDIENCE ROUTES
              <Route
                path="/audience/step-1"
                element={<AudienceTransitionStep1 />}
              />
              <Route path="/audience/read" element={<AudienceStep1 />} />
              <Route
                path="/audience/step-2"
                element={<AudienceTransitionStep2 />}
              />
               <Route
                path="/audience/poem-surveys"
                element={<AudienceStep2 />}
              />


               <Route
                path="/audience/pre-survey"
                element={<AudiencePreSurvey />}
              />

              <Route
                path="/audience/instructions"
                element={<AudienceInstructions />}
              />

              <Route
                path="/audience/post-survey"
                element={<AudiencePostSurvey />}
              /> */}

              {/* <Route path="/choice" element={<ChooseYourCharacter />} /> */}
            </Routes>
          </Router>
        </div>
      </Provider>
    </DataContext.Provider>
  );
}

export default App;
