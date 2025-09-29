
'use client';

import React, { useEffect, useState } from 'react';

// A simple confetti component without external libraries
export const Confetti = () => {
  const [pieces, setPieces] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 100 }).map((_, i) => {
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}%`,
        top: `${-20 + Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`,
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        animationName: 'fall',
        animationDuration: `${2 + Math.random() * 3}s`,
        animationDelay: `${Math.random() * 2}s`,
        animationTimingFunction: 'ease-out',
        animationIterationCount: '1',
        animationFillMode: 'forwards',
        position: 'absolute',
        width: `${Math.floor(Math.random() * 10) + 5}px`,
        height: `${Math.floor(Math.random() * 10) + 5}px`,
        opacity: 0,
      };
      return <div key={i} className="confetti-piece" style={style} />;
    });

    setPieces(newPieces);
    
    // Add keyframes to the document
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes fall {
        0% { opacity: 1; transform: translateY(-100px) rotateZ(0deg); }
        100% { opacity: 1; transform: translateY(800px) rotateZ(720deg); }
      }
    `;
     try {
       if (styleSheet) {
          styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
       }
     } catch(e) {
        console.error('Could not insert confetti keyframes', e)
     }

  }, []);

  return <div className="absolute inset-0 pointer-events-none z-50">{pieces}</div>;
};
