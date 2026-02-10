"use client";

import React from "react";

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

/**
 * Surligne les occurrences du terme de recherche dans le texte donné.
 * Retourne le texte original si aucun terme de recherche n'est fourni.
 */
export default function HighlightText({ text, searchTerm }: HighlightTextProps) {
  if (!searchTerm || !searchTerm.trim() || !text) {
    return <>{text}</>;
  }

  const term = searchTerm.trim();
  // Escape regex special characters
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-blue-200 text-blue-900 rounded-sm px-0.5 py-0"
            style={{ textDecoration: "none" }}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
