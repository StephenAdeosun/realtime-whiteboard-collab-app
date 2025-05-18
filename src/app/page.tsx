"use client";

import { useState } from "react";
import Head from "next/head";
import Toolbar from "../../components/ToolBar";
import dynamic from "next/dynamic";

// Dynamically import CanvasBoard to avoid SSR errors
const CanvasBoard = dynamic(() => import("../../components/CanvasBoard"), {
  ssr: false,
});

type Tool = "freehand" | "rectangle" | "circle" | "text" | "line" | "eraser";

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool>("freehand");

  const triggerClick = (id: string) => {
    const btn = document.getElementById(id) as HTMLButtonElement;
    if (btn) btn.click();
  };

  return (
    <>
      <Head>
        <title>Collaborative Whiteboard</title>
      </Head>
      <main className="h-screen w-full bg-gray-100 text-black flex flex-col">
        <Toolbar
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          undo={() => triggerClick("undo-btn")}
          redo={() => triggerClick("redo-btn")}
          clear={() => triggerClick("clear-btn")}
        />
        <CanvasBoard selectedTool={selectedTool} />
      </main>
    </>
  );
}
