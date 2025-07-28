import React from "react";
import { Button } from "./ui/button";

interface SearchMiniCardProps {
  key?: string;
  variant?: "outline";
  size?: "sm";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const SearchMiniCard = ({
  key,
  variant = "outline",
  size = "sm",
  className = "cursor-pointer bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors h-auto px-4 py-3 text-sm rounded-2xl border-0 whitespace-normal flex items-start justify-start shadow-sm w-full aspect-[1.8/1]",
  onClick,
  children,
}: SearchMiniCardProps) => {
  return (
    <Button
      key={key}
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

// This file is deprecated - use search-mini-card.tsx instead
