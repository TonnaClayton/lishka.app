import React from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 max-w-full h-full flex flex-col overflow-hidden">
      <div className="w-full h-full flex-1">{children}</div>
    </div>
  );
}
