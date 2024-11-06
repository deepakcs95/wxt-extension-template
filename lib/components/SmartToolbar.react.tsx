import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export const SmartToolbar: React.FC<ToolbarProps> = ({ selection, onAction, onClose }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

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

  if (!selection || !position) return null;

  // Use inline styles instead of classes for Google apps
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
        zIndex: 9999999,
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        width: "256px",
        padding: "8px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          padding: "0 8px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          Suggested Actions
        </span>
        <div
          style={{
            display: "flex",
            gap: "4px",
          }}
        >
          <span style={{ color: "#10B981" }}>🔒</span>
          <span
            style={{
              fontSize: "12px",
              color: "#6B7280",
            }}
          >
            Local
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {[
          { id: "summarize", icon: "🧠", text: "Summarize Text", confidence: 0.9 },
          { id: "calendar", icon: "📅", text: "Add to Calendar", confidence: 0.85 },
          { id: "translate", icon: "🌐", text: "Translate", confidence: 0.7 },
        ].map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onAction(suggestion.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              border: "none",
              borderRadius: "6px",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span style={{ color: "#3B82F6" }}>{suggestion.icon}</span>
            <span
              style={{
                flexGrow: 1,
                fontSize: "14px",
                color: "#1F2937",
              }}
            >
              {suggestion.text}
            </span>
            <div
              style={{
                width: "4px",
                height: "16px",
                borderRadius: "9999px",
                backgroundColor: `rgba(59, 130, 246, ${suggestion.confidence})`,
              }}
            />
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <button
          style={{
            width: "100%",
            fontSize: "12px",
            color: "#6B7280",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          Customize suggestions...
        </button>
      </div>
    </div>,
    document.body
  );
};
