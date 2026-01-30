"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/app/services/auth.service";
import { getUserById } from "@/app/services/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      console.log("AUTH UID:", res.user.uid);

      // 🔑 AMBIL TOKEN
      const token = await res.user.getIdToken();

      // 🔐 SET COOKIE VIA API
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      // Ambil profile user
      const user = await getUserById(res.user.uid);

      if (!user) {
        throw new Error("Data user tidak ditemukan di database");
      }

      // Redirect berdasarkan role
      if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/staff");
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      switch (err.code) {
        case "auth/user-not-found":
          setError("Akun tidak ditemukan");
          break;
        case "auth/wrong-password":
          setError("Password salah");
          break;
        case "auth/invalid-credential":
          setError("Email atau password tidak valid");
          break;
        default:
          setError(err.message || "Terjadi kesalahan saat login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Login Gudang</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@gudang.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Belum punya akun?{" "}
            <a href="/auth/register" className="text-blue-600 hover:underline">
              Daftar
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
