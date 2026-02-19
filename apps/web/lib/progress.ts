import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function saveProgress(userId: string, payload: Record<string, unknown>) {
  const ref = doc(db, "user_progress", userId);
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
