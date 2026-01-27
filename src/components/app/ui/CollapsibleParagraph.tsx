'use client';
import React, { useState, useMemo } from 'react';

export const CollapsibleParagraph = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCollapsible = useMemo(() => {
    if (!text) return false;
    const lineCount = text.split('\n').length;
    return lineCount > 3 || text.length > 250;
  }, [text]);

  if (!isCollapsible) {
    return <>{text}</>;
  }

  return (
    <>
      <span
        style={!isExpanded ? {
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        } : {}}
      >
        {text}
      </span>
      <br />
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-indigo-400 text-xs font-bold mt-1.5 hover:underline"
      >
        {isExpanded ? 'Ver menos' : 'Ver mais'}
      </button>
    </>
  );
};
