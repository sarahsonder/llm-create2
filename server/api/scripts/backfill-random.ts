import { db } from "../firebase/firebase";

async function backfillRandom() {
  const snapshot = await db.collection("poem").get();

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    if (doc.data().random === undefined) {
      batch.update(doc.ref, { random: Math.random() });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} poems with random field`);
  } else {
    console.log("All poems already have random field");
  }
}

backfillRandom().catch(console.error);
