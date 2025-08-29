import { cn } from "@/lib/utils";
import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";
import React from "react";

export enum UploadStepStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export type UploadPhotoStreamData = {
  data: {
    message: string;
    analyzing: UploadStepStatus;
    uploading: UploadStepStatus;
    saved: UploadStepStatus;
  };
};

export default function PhotoUploadBar({
  uploadPhotoStreamData,
}: {
  uploadPhotoStreamData: UploadPhotoStreamData | null;
}) {
  if (uploadPhotoStreamData == null) {
    return null;
  }

  const getStepIcon = (step: UploadStepStatus) => {
    if (step === UploadStepStatus.COMPLETED) {
      return <CheckIcon className="w-5 h-5 text-white" />;
    }
    if (step === UploadStepStatus.FAILED) {
      return <XIcon className="w-5 h-5 text-white" />;
    }

    if (step === UploadStepStatus.PROCESSING) {
      return <LoaderIcon className="w-5 h-5 text-white animate-spin" />;
    }
    return null;
  };

  return (
    <div className="w-full py-3 px-4  bg-[#0251FB] flex flex-col gap-2 h-fit z-20 sticky top-[69px]">
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.analyzing === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-base">AI Analyzing Photo</p>
        {getStepIcon(uploadPhotoStreamData.data.analyzing)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.uploading === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-base">Photo Uploading</p>
        {getStepIcon(uploadPhotoStreamData.data.uploading)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.saved === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-base">Photo Saved</p>
        {getStepIcon(uploadPhotoStreamData.data.saved)}
      </div>
    </div>
  );
}
