import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import React from "react";

export default function UploadedInfoMsg({
  className,
  message,
  onClose,
}: {
  className?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "w-full py-3 px-4 bg-lishka-blue flex flex-col gap-2 h-fit z-20 sticky top-[69px]",
        className,
      )}
    >
      <div className={cn(" w-full flex items-center justify-between")}>
        <p className="leading-snug text-white text-sm md:text-base">
          {message}
        </p>
        <button onClick={onClose}>
          <XIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
