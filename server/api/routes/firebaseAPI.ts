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
      5: "passage",
      6: "poems",
      7: "post-survey",
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

    const audience = {
      surveyResponse: surveyRef,
      timestamps: [...(audienceData.timeStamps ?? []), new Date()],
    };

    batch.set(audienceRef, audience);
    batch.set(surveyRef, { audienceId: audienceRef.id, ...surveyData });
    batch.delete(incompleteRef);

    await batch.commit();

    res.json({ success: true, audienceId: audienceRef.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Batch commit failed" });
  }
});

export default router;
