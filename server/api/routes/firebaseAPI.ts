import express from "express";
import { db, FieldValue } from "../firebase/firebase";

const router = express.Router();

// ARTIST COLLECTIONS
const ARTIST_COLLECTION = "artist";
const ARTIST_SURVEY_COLLECTION = "artistSurvey";
const POEM_COLLECTION = "poem";
const ARTIST_INCOMPLETE_SESSION_COLLECTION = "artistIncompleteSession";

// AUDIENCE COLLECTIONS
const AUDIENCE_COLLECTION = "audience";
const AUDIENCE_SURVEY_COLLECTION = "audienceSurvey";
const AUDIENCE_INCOMPLETE_SESSION_COLLECTION = "audienceIncompleteSession";

// ARTIST ROUTES
router.post("/artist/autosave", async (req, res) => {
  try {
    const { sessionId, data } = req.body;

    if (!sessionId || !data) {
      return res
        .status(400)
        .json({ error: "Missing sessionId or data objects" });
    }

    const statusMap: Record<number, string> = {
      1: "captcha",
      2: "consent",
      3: "pre-survey",
      4: "brainstorm-instructions",
      5: "brainstorm",
      6: "write",
      7: "post-survey",
    };

    const status = data.data?.timeStamps
      ? statusMap[data.data.timeStamps.length] || "started"
      : "started";

    const ref = db
      .collection(ARTIST_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);
    const payload = {
      sessionId,
      role: data.role,
      partialData: data.data,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
    };

    await ref.set(payload, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to autosave" });
  }
});

router.post("/artist/commit-session", async (req, res) => {
  try {
    const { artistData, surveyData, poemData, sessionId } = req.body;

    if (!artistData) {
      return res.status(400).json({ error: "Missing artistData" });
    }

    if (!surveyData) {
      return res.status(400).json({ error: "Missing surveyData" });
    }

    if (!poemData) {
      return res.status(400).json({ error: "Missing poemData" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const batch = db.batch();

    const artistRef = db.collection(ARTIST_COLLECTION).doc();
    const surveyRef = db.collection(ARTIST_SURVEY_COLLECTION).doc();
    const poemRef = db.collection(POEM_COLLECTION).doc();
    const incompleteRef = db
      .collection(ARTIST_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);

    const artist = {
      condition: artistData.condition,
      surveyResponse: surveyRef,
      poem: poemRef,
      timestamps: [...(artistData.timeStamps ?? []), new Date()],
    };

    batch.set(artistRef, artist);
    batch.set(surveyRef, { artistId: artistRef.id, ...surveyData });
    batch.set(poemRef, { artistId: artistRef.id, ...poemData });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, artistId: artistRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

// AUDIENCE ROUTES
router.post("/audience/autosave", async (req, res) => {
  try {
    const { sessionId, data } = req.body;

    if (!sessionId || !data) {
      return res
        .status(400)
        .json({ error: "Missing sessionId or data objects" });
    }

    const statusMap: Record<number, string> = {
      1: "captcha",
      2: "consent",
      3: "pre-survey",
      4: "instructions",
      5: "readPassage",
      6: "poemEvaluation1",
      7: "poemEvaluation2",
      8: "poemEvaluation3",
      9: "poemEvaluation4",
      10: "post-survey",
    };

    const status = data.data?.timeStamps
      ? statusMap[data.data.timeStamps.length] || "started"
      : "started";

    const ref = db
      .collection(AUDIENCE_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);
    const payload = {
      sessionId,
      role: data.role,
      partialData: data.data,
      lastUpdated: FieldValue.serverTimestamp(),
      completionStatus: status,
    };

    await ref.set(payload, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to autosave" });
  }
});

router.post("/audience/commit-session", async (req, res) => {
  try {
    const { audienceData, surveyData, sessionId } = req.body;

    if (!audienceData) {
      return res.status(400).json({ error: "Missing audienceData" });
    }

    if (!surveyData) {
      return res.status(400).json({ error: "Missing surveyData" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const batch = db.batch();

    const audienceRef = db.collection(AUDIENCE_COLLECTION).doc();
    const surveyRef = db.collection(AUDIENCE_SURVEY_COLLECTION).doc();
    const incompleteRef = db
      .collection(AUDIENCE_INCOMPLETE_SESSION_COLLECTION)
      .doc(sessionId);

    // Main audience document with references and metadata
    const existingTimestamps = (audienceData.timeStamps ?? []).map(
      (ts: string | Date) => new Date(ts)
    );
    const audience = {
      passageId: audienceData.passageId,
      poemsViewed: audienceData.poemsViewed ?? [],
      surveyResponse: surveyRef,
      timestamps: [...existingTimestamps, new Date()],

    };

    // Survey document with all survey responses
    const survey = {
      audienceId: audienceRef.id,
      preAnswers: surveyData.preAnswers ?? {},
      poemAnswers: surveyData.poemAnswers ?? [],
      rankingData: surveyData.rankingData ?? {},
      AIAnswers: surveyData.AIAnswers ?? {},
      reRankingData: surveyData.reRankingData ?? {},
      postAnswers: surveyData.postAnswers ?? {},
    };

    batch.set(audienceRef, audience);
    batch.set(surveyRef, survey);
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, audienceId: audienceRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

router.get("/audience/poems", async (req, res) => {
  try {
    const { passageId } = req.query;

    if (!passageId || typeof passageId !== "string") {
      return res.status(400).json({ error: "Missing or invalid passageId" });
    }

    // query all poems with the given passageId
    const snapshot = await db
      .collection(POEM_COLLECTION)
      .where("passageId", "==", passageId)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No poems found for this passage" });
    }

    // map to { poemId, text } format
    const allPoems = snapshot.docs.map((doc) => ({
      poemId: doc.id,
      text: doc.data().text as number[],
    }));

    // Fisher-Yates shuffle for true randomness
    for (let i = allPoems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPoems[i], allPoems[j]] = [allPoems[j], allPoems[i]];
    }

    // Take first 4 (or fewer if not enough poems exist)
    const randomPoems = allPoems.slice(0, 4);

    res.json({ poems: randomPoems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get poems" });
  }
});

router.post("/audience/artist-statements", async (req, res) => {
  try {
    const { poemIds } = req.body;

    if (!poemIds || !Array.isArray(poemIds) || poemIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Missing or invalid poemIds array" });
    }

    // Get statements for the requested poem IDs
    const poemStatements = await Promise.all(
      poemIds.map((id: string) => getArtistStatement(id))
    );

    // Fisher-Yates shuffle to randomize statement order
    for (let i = poemStatements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poemStatements[i], poemStatements[j]] = [poemStatements[j], poemStatements[i]];
    }

    res.json({ poemStatements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get artist statements" });
  }
});

const getArtistStatement = async (
  poemId: string
): Promise<{ poemId: string; statement: string } | null> => {
  // 1. get artistId from poemId
  const poemDoc = await db.collection(POEM_COLLECTION).doc(poemId).get();
  if (!poemDoc.exists) return null;

  const artistId = poemDoc.data()?.artistId;
  if (!artistId) return null;

  // 2. query survey collection for matching artistId
  const surveySnapshot = await db
    .collection(ARTIST_SURVEY_COLLECTION)
    .where("artistId", "==", artistId)
    .limit(1)
    .get();

  if (surveySnapshot.empty) return null;

  // 3. extract q14 from postAnswers
  const statement = surveySnapshot.docs[0].data()?.postSurveyAnswers.q14;
  if (!statement) return null;

  return { poemId, statement };
};

export default router;
