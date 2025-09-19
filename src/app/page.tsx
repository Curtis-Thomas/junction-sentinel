"use client";

export default function Home() {
  return (
    <>
      <>Junction boxers</>

      <button
        onClick={() => {
          window.location.href = "/dashboard";
        }}
      >
        Login
      </button>
    </>
  );
}
