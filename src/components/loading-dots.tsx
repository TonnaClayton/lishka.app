import React from "react";

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  color = "#0251FB",
  size = 4,
}) => {
  return (
    <div className="flex items-center justify-center space-x-1">
      <div
        className="animate-bounce rounded-full"
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: "0ms",
        }}
      />
      <div
        className="animate-bounce rounded-full"
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: "150ms",
        }}
      />
      <div
        className="animate-bounce rounded-full"
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: "300ms",
        }}
      />
    </div>
  );
};

export default LoadingDots;
