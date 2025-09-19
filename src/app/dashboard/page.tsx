"use client";

import { Button } from "@mui/material";

function DashboardPage() {
  return (
    <>
      <>Dashboard Page</>

      <Button
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Log Out
      </Button>
    </>
  );
}
export default DashboardPage;
