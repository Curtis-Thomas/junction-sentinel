"use client";

import { useEffect } from "react";
import { HeroSection, Navigation } from "@/components";
import { useUser } from "@auth0/nextjs-auth0";

export default function Home() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      window.location.href = "/dashboard";
    }
  }, [user]);

  return (
    <main>
      <Navigation />
      <HeroSection />
    </main>
  );
}
