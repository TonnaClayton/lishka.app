import { cn } from "@/lib/utils";
import React from "react";

export default function ScreenOne({
  titleClassName,
  descriptionClassName,
}: {
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="z-10 w-full h-[50%] bg-transparent"></div>
      <div className="z-10 w-full h-[50%] flex flex-col justify-end items-center bg-transparent gap-y-4">
        <div
          className={
            "size-full flex flex-col items-center justify-center text-center px-4 gap-y-3 py-8 h-[45%]"
          }
        >
          <h1
            className={cn(
              "md:text-4xl font-bold leading-tight w-[100%] text-3xl text-white",
              titleClassName,
            )}
          >
            Your AI Fishing Companion
          </h1>
          <p
            className={cn(
              "leading-relaxed max-w-md mb-4 h-20 text-white font-light text-base",
              descriptionClassName,
            )}
          >
            AI gear picks, active fish insights, how-to guides, and sonar
            decoding, all in one place.
          </p>
        </div>
        <div className="h-[100px]"></div>
      </div>
      <img
        src={
          "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250804T171549799Z.png"
        }
        alt={"Pasted Image"}
        width={1572}
        height={3408}
        className={"w-full h-full absolute z-1"}
      />
    </div>
  );
}
