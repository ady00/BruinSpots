"use client";

import { useState, useEffect } from 'react';

export default function DateTimeDisplay() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="text-center text-sm font-medium text-foreground/80 pt-3 pb-1">
      <p>{`${formattedDate} • ${formattedTime}`}</p>
    </div>
  );
}
