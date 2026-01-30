import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserRole } from "../types/user";

export const saveUser = async (uid: string, email: string, role: UserRole) => {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    role,
    createdAt: serverTimestamp(),
  });
};

export const getUserById = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};
