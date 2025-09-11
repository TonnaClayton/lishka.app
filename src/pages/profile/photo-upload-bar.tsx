import {
  UploadPhotoStreamData,
  UploadStepStatus,
} from "@/contexts/upload-context";
import { cn } from "@/lib/utils";
import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";

export default function PhotoUploadBar({
  uploadPhotoStreamData,
  className,
}: {
  uploadPhotoStreamData: UploadPhotoStreamData | null;
  className?: string;
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
    <div
      className={cn(
        "w-full py-3 px-4  bg-lishka-blue flex flex-col gap-2 h-fit z-20 sticky top-[69px]",
        className,
      )}
    >
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.analyzing === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          AI Analyzing Photo
        </p>
        {getStepIcon(uploadPhotoStreamData.data.analyzing)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.uploading === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Photo Uploading
        </p>
        {getStepIcon(uploadPhotoStreamData.data.uploading)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadPhotoStreamData.data.saved === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Photo Saved
        </p>
        {getStepIcon(uploadPhotoStreamData.data.saved)}
      </div>
    </div>
  );
}
