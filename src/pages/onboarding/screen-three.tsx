import React from "react";

export default function ScreenThree() {
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
            className={
              "md:text-4xl font-bold leading-tight w-[100%] text-4xl text-white"
            }
          >
            AI-Powered Sonar Scanning
          </h1>
          <p
            className={
              "leading-relaxed max-w-md mb-4 h-20 text-white font-light text-base"
            }
          >
            Upload sonar images and let AI decode fish activity. Get optimised
            settings and suggestions, tailored to your spot.
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
