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
    batch.set(poemRef, {
      artistId: artistRef.id,
      ...poemData,
      random: Math.random(),
    });
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
      (ts: string | Date) => new Date(ts),
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

    const rand = Math.random();
    const POEM_LIMIT = 4;

    // First query: random >= rand
    const firstSnapshot = await db
      .collection(POEM_COLLECTION)
      .where("passageId", "==", passageId)
      .where("random", ">=", rand)
      .orderBy("random")
      .limit(POEM_LIMIT)
      .get();

    let poemDocs = firstSnapshot.docs;

    // Fallback query if fewer than 4 results
    if (poemDocs.length < POEM_LIMIT) {
      const remaining = POEM_LIMIT - poemDocs.length;
      const fallbackSnapshot = await db
        .collection(POEM_COLLECTION)
        .where("passageId", "==", passageId)
        .where("random", "<", rand)
        .orderBy("random")
        .limit(remaining)
        .get();

      poemDocs = [...poemDocs, ...fallbackSnapshot.docs];
    }

    if (poemDocs.length < POEM_LIMIT) {
      console.warn(
        `[audience/poems] Only ${poemDocs.length} poems found for passageId: ${passageId}`,
      );
    }

    if (poemDocs.length === 0) {
      return res.status(404).json({ error: "No poems found for this passage" });
    }

    // Fetch artist statements for each poem
    const poems = await Promise.all(
      poemDocs.map(async (doc) => {
        const data = doc.data();
        const artistId = data.artistId;

        let statement: string = "";
        if (artistId) {
          const surveySnapshot = await db
            .collection(ARTIST_SURVEY_COLLECTION)
            .where("artistId", "==", artistId)
            .limit(1)
            .get();

          statement =
            surveySnapshot.docs[0]?.data()?.postSurveyAnswers?.q14 ?? "";
        }

        return {
          poemId: doc.id,
          text: data.text as number[],
          statement,
        };
      }),
    );

    res.json({ poems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get poems" });
  }
});

export default router;
