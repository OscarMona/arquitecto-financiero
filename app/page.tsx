"use client";
import { useAuth } from "../lib/auth-context";
import LoginScreen from "./login";
import Landing from "./calculadoras";

export default function Home() {
  const { user, loading } = useAuth();

  // Show calculators to everyone (no login required)
  return <Landing />;
}