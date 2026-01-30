"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../app/lib/firebase";

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
};
