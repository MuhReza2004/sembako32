"use client";

import { auth } from "@/app/lib/firebase";
import { getUserById } from "@/app/services/user.service";
import { UserRole } from "@/app/types/user";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const profile = await getUserById(user.uid);
        setRole(profile?.role ?? null);
      } catch (err: any) {
        console.error("Error fetching user role:", err);
        setError(err?.message || "Gagal memuat role user");
        // Tetap set loading false agar UI tidak stuck
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { role, loading, error };
}
