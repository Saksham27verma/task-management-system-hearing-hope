'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import Confetti from 'react-confetti';

type ConfettiContextType = {
  showConfetti: (options?: ConfettiOptions) => void;
};

type ConfettiOptions = {
  x?: number;
  y?: number;
  duration?: number;
  pieces?: number;
};

const ConfettiContext = createContext<ConfettiContextType>({
  showConfetti: () => {},
});

export const useConfetti = () => useContext(ConfettiContext);

type ConfettiProviderProps = {
  children: ReactNode;
};

export const ConfettiProvider: React.FC<ConfettiProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [confettiSource, setConfettiSource] = useState({ x: 0, y: 0, w: 10, h: 10 });
  const [numberOfPieces, setNumberOfPieces] = useState(200);
  
  const showConfetti = (options?: ConfettiOptions) => {
    if (options?.x && options?.y) {
      setConfettiSource({
        x: options.x,
        y: options.y,
        w: 10,
        h: 10
      });
    } else {
      // Default to center of screen if no position provided
      if (typeof window !== 'undefined') {
        setConfettiSource({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          w: 10,
          h: 10
        });
      }
    }
    
    // Set number of confetti pieces
    setNumberOfPieces(options?.pieces || 200);
    
    // Show confetti
    setIsActive(true);
    
    // Hide confetti after duration
    setTimeout(() => {
      setIsActive(false);
    }, options?.duration || 5000);
  };
  
  return (
    <ConfettiContext.Provider value={{ showConfetti }}>
      {isActive && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1000}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={numberOfPieces}
          gravity={0.2}
          confettiSource={confettiSource}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
        />
      )}
      {children}
    </ConfettiContext.Provider>
  );
}; 