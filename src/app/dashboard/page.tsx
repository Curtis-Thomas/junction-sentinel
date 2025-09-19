"use client";

function DashboardPage() {
  return (
    <>
      <>Dashboard Page</>

      <button
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Log Out
      </button>
    </>
  );
}
export default DashboardPage;
