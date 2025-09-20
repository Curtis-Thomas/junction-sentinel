"use client";
import { loginUrl } from "./utils/miscellaneous";

export default function Home() {
  return (
    <>
      <>Junction boxers</>

      <a href={loginUrl}>
        <button type="button">Login</button>
      </a>
    </>
  );
}
