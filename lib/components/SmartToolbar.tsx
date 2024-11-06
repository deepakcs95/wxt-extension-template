import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ToolbarProps {
  selection: Selection | null;
  onAction: (actionId: string) => void;
  onClose?: () => void;
  style?: React.CSSProperties;
}

interface Suggestion {
  id: string;
  icon: string;
  text: string;
  confidence: number;
}

export const SmartToolbar: React.FC<ToolbarProps> = ({ selection, onAction, onClose, style }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: "summarize", icon: "🧠", text: "Summarize Text", confidence: 0.9 },
    { id: "calendar", icon: "📅", text: "Add to Calendar", confidence: 0.85 },
    { id: "translate", icon: "🌐", text: "Translate", confidence: 0.7 },
  ]);

  useEffect(() => {
    if (selection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, [selection]);

  if (!selection || !position.top || !position.left) return null;

  return createPortal(
    <div
      className="fixed z-50 transform -translate-x-1/2 "
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-2 w-64">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-sm font-medium text-gray-700">Suggested Actions</span>
          <div className="flex space-x-1">
            <span className="text-green-500">🔒</span>
            <span className="text-xs text-gray-500">Local</span>
          </div>
        </div>

        <div className="space-y-1">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onAction(suggestion.id)}
              className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span className="text-blue-500">{suggestion.icon}</span>
              <span className="flex-grow text-black text-sm text-left">{suggestion.text}</span>
              <div
                className="w-1 h-4 rounded-full"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${suggestion.confidence})`,
                }}
              />
            </button>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            className="w-full text-xs text-gray-500 hover:text-gray-700"
            onClick={() => {
              /* Handle customize */
            }}
          >
            Customize suggestions...
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
