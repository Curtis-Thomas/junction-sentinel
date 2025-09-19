"use client";

import { Button } from "@mui/material";

export default function Home() {
  return (
    <>
      <>Junction boxers</>

      <Button
        onClick={() => {
          window.location.href = "/dashboard";
        }}
      >
        Login
      </Button>
    </>
  );
}
