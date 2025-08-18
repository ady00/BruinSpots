import React, { useState, useEffect } from "react";
import { motion } from "motion/react";


interface LoadingScreenProps {
  error?: string | null;
  show: boolean;
  onExited: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  error,
  show,
  onExited,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!show) {
      setIsVisible(false);
      timer = setTimeout(() => {
        onExited();
      }, 300);
    } else {
      setIsVisible(true);
    }

    return () => clearTimeout(timer);
  }, [show, onExited]);

  const transitionClasses = isVisible
    ? "opacity-100"
    : "opacity-0 pointer-events-none";

  const baseContainerClasses =
    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-200 ease-out";

  if (error) {
    return (
      <div className={`${baseContainerClasses} ${transitionClasses}`}>
        <div className="text-red-600 p-4 rounded-md text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const transition = (x: number) => {
    return {
      duration: 1,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: "easeInOut",
    };
  };

  

  return (
    <div className={`${baseContainerClasses} ${transitionClasses}`}>
      <div className="overflow-hidden">
        <div className="loading-bar h-full">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
