"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

type Tool = "freehand" | "rectangle" | "circle" | "text" | "line" | "eraser";

interface CanvasBoardProps {
  selectedTool: Tool;
}

interface TextState {
  isTyping: boolean;
  position: { x: number; y: number } | null;
  content: string;
}

const gridBgStyles = {
  backgroundImage: `
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: 'center',
};

const STORAGE_KEY = 'whiteboard-state';

const CanvasBoard: React.FC<CanvasBoardProps> = ({ selectedTool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [color, setColor] = useState("#000000");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [textState, setTextState] = useState<TextState>({
    isTyping: false,
    position: null,
    content: ''
  });

  const saveCanvasState = useCallback(() => {
    if (context && canvasRef.current) {
      const state = {
        timestamp: Date.now(),
        imageData: canvasRef.current.toDataURL(),
        history: history.map(data => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasRef.current!.width;
          tempCanvas.height = canvasRef.current!.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx?.putImageData(data, 0, 0);
          return tempCanvas.toDataURL();
        })
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [context, history]);

  useEffect(() => {
    const loadCanvasState = () => {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState && context && canvasRef.current) {
        const state = JSON.parse(savedState);
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          context.drawImage(img, 0, 0);
          
          // Restore history
          const newHistory = state.history.map((dataUrl: string) => {
            const tempImg = new Image();
            tempImg.src = dataUrl;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current!.width;
            tempCanvas.height = canvasRef.current!.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.drawImage(tempImg, 0, 0);
            return tempCtx!.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          });
          setHistory(newHistory);
        };
        img.src = state.imageData;
      }
    };

    // Load initial state
    loadCanvasState();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        loadCanvasState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [context]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        setContext(ctx);
      }
    }
  }, []);

  useEffect(() => {
    if (context) {
      context.strokeStyle = selectedTool === "eraser" ? "#ffffff" : color;
      context.lineWidth = selectedTool === "eraser" ? 20 : 2;
    }
  }, [color, context, selectedTool]);

  // Update saveToHistory to trigger localStorage save
  const saveToHistory = useCallback(() => {
    if (context && canvasRef.current) {
      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      setHistory((prev) => [...prev, imageData]);
      setRedoStack([]);
      saveCanvasState(); 
    }
  }, [context, saveCanvasState]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    setIsDrawing(true);
    
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    
    context.beginPath();
    context.moveTo(x, y);
    setStartPoint({ x, y });

    if (selectedTool === "eraser") {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
    }
    
    saveToHistory();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !isDrawing || !startPoint || !canvasRef.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (selectedTool === "freehand" || selectedTool === "eraser") {
      context.lineTo(x, y);
      context.stroke();
    } else if (selectedTool === "line") {
      const lastHistoryState = history[history.length - 1];
      if (lastHistoryState) {
        context.putImageData(lastHistoryState, 0, 0);
      } else {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !startPoint || !canvasRef.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    if (selectedTool === "rectangle") {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      context.strokeRect(startPoint.x, startPoint.y, width, height);
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      context.beginPath();
      context.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      context.stroke();
    } else if (selectedTool === "line") {
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(x, y);
      context.stroke();
    } else if (selectedTool === "text") {
      setTextState({
        isTyping: true,
        position: { x, y },
        content: ''
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
    context?.beginPath(); // Reset path
    saveToHistory();
  }, [context, startPoint, selectedTool, saveToHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!context || !textState.isTyping || !textState.position) return;
  
    if (e.key === 'Enter') {
      context.font = "16px sans-serif";
      context.fillStyle = color;
      context.fillText(textState.content, textState.position.x, textState.position.y);
      setTextState({ isTyping: false, position: null, content: '' });
      saveToHistory();
    } else if (e.key === 'Escape') {
      setTextState({ isTyping: false, position: null, content: '' });
    } else if (e.key === 'Backspace') {
      e.preventDefault(); 
      if (textState.content.length > 0) {
        setTextState(prev => ({
          ...prev,
          content: prev.content.slice(0, -1)
        }));
      }
    } else if (e.key.length === 1) {
      setTextState(prev => ({
        ...prev,
        content: prev.content + e.key
      }));
    }
  };

  const undo = () => {
    if (history.length > 0 && context && canvasRef.current) {
      const currentState = context.getImageData(
        0, 
        0, 
        canvasRef.current.width, 
        canvasRef.current.height
      );
      setRedoStack(prev => [...prev, currentState]);

      const prevState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      context.putImageData(prevState, 0, 0);
    }
  };

  const redo = () => {
    if (redoStack.length > 0 && context && canvasRef.current) {
      const currentState = context.getImageData(
        0, 
        0, 
        canvasRef.current.width, 
        canvasRef.current.height
      );
      setHistory(prev => [...prev, currentState]);

      const nextState = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      context.putImageData(nextState, 0, 0);
    }
  };

  const clear = useCallback(() => {
    if (context && canvasRef.current) {
      // Clear the canvas
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Update history with cleared state
      const clearedImageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      
      // Reset history and redo stack
      setHistory([clearedImageData]);
      setRedoStack([]);
      
      // Save cleared state to localStorage
      const clearedState = {
        timestamp: Date.now(),
        imageData: canvasRef.current.toDataURL(),
        history: [canvasRef.current.toDataURL()]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedState));
    }
  }, [context]);

  return (
    <div 
      className="flex-1 relative" 
      tabIndex={0} 
      onKeyDown={handleKeyDown}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={gridBgStyles}
      />
      <canvas
        ref={canvasRef}
        className="bg-transparent cursor-crosshair absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
      />
      {/* Preview text while typing */}
      {textState.isTyping && textState.position && (
        <div
          className="absolute pointer-events-none animate-blink"
          style={{
            left: textState.position.x,
            top: textState.position.y - 16,
            color: color,
            font: "16px sans-serif"
          }}
        >
          {textState.content}<span className="animate-pulse">|</span>
        </div>
      )}
      {/* Color Picker */}
      <div className="absolute top-2 right-4 bg-white shadow px-3 py-1 rounded">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      {/* Hidden controls for toolbar access */}
      <div className="hidden">
        <button onClick={undo} id="undo-btn"></button>
        <button onClick={redo} id="redo-btn"></button>
        <button onClick={clear} id="clear-btn"></button>
      </div>
    </div>
  );
};

export default CanvasBoard;
