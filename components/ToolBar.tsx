"use client";

import React from "react";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Slash as LineIcon,
  Eraser,
  Undo2,
  Redo2,
  Trash2
} from "lucide-react";

type Tool = "freehand" | "rectangle" | "circle" | "text" | "line" | "eraser";

interface ToolbarProps {
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  setSelectedTool,
  undo,
  redo,
  clear,
}) => {
  const tools = [
    { id: 'freehand', icon: <Pencil size={20} />, label: 'Freehand' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'line', icon: <LineIcon size={20} />, label: 'Line' },
    { id: 'text', icon: <Type size={20} />, label: 'Text' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id as Tool)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors group relative ${
              selectedTool === tool.id ? 'bg-gray-100' : ''
            }`}
            title={tool.label}
          >
            {tool.icon}
            {/* Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {tool.label}
            </span>
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-200" /> {/* Divider */}
        
        <button
          onClick={undo}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
          title="Undo"
        >
          <Undo2 size={20} />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Undo
          </span>
        </button>
        <button
          onClick={redo}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
          title="Redo"
        >
          <Redo2 size={20} />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Redo
          </span>
        </button>
        <button
          onClick={clear}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
          title="Clear"
        >
          <Trash2 size={20} />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Clear
          </span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
