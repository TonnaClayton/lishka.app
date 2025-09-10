import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";
import {
  UploadPhotoStreamData,
  UploadStepStatus,
} from "@/contexts/upload-context";
import { cn } from "@/lib/utils";

export default function GearItemUploadBar({
  uploadGearItemStreamData,

  className,
}: {
  uploadGearItemStreamData: UploadPhotoStreamData | null;
  className?: string;
}) {
  if (uploadGearItemStreamData == null) {
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
          uploadGearItemStreamData.data.analyzing ===
            UploadStepStatus.PENDING && "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          AI Analyzing Photo
        </p>
        {getStepIcon(uploadGearItemStreamData.data.analyzing)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadGearItemStreamData.data.uploading ===
            UploadStepStatus.PENDING && "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Photo Uploading
        </p>
        {getStepIcon(uploadGearItemStreamData.data.uploading)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadGearItemStreamData.data.saved === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Gear uploaded successfully!
        </p>
        {getStepIcon(uploadGearItemStreamData.data.saved)}
      </div>
    </div>
  );
}
