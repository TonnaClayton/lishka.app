import { cn } from "@/lib/utils";
import React from "react";

export default function ScreenThree({
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
            AI-Powered Sonar Scanning
          </h1>
          <p
            className={cn(
              "leading-relaxed max-w-md mb-4 h-20 text-white font-light text-base",
              descriptionClassName,
            )}
          >
            Upload sonar images, and AI reveals fish activity with spot-specific
            settings and tips.
          </p>
        </div>
        <div className="h-[100px]"></div>
      </div>
      <img
        src={"/images/tempo-image-20250804T180626803Z.png"}
        alt={"Pasted Image"}
        width={1572}
        height={3408}
        className={"w-full h-full absolute z-1"}
      />
    </div>
  );
}
