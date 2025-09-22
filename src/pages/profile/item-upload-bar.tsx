import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";
import {
  UploadPhotoStreamData,
  UploadStepStatus,
} from "@/contexts/upload-context";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function ItemUploadBar({
  streamData,
  totalItemsUploading,
  className,
}: {
  totalItemsUploading?: number;
  streamData: UploadPhotoStreamData | null;
  className?: string;
}) {
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

  const analyzingText = useMemo(() => {
    if (totalItemsUploading && totalItemsUploading > 1) {
      return `AI Analyzing ${totalItemsUploading} Photos`;
    }

    return "AI Analyzing Photo";
  }, [totalItemsUploading]);

  if (streamData == null) {
    return null;
  }

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
          streamData.data.analyzing === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          {analyzingText}
        </p>
        {getStepIcon(streamData.data.analyzing)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          streamData.data.uploading === UploadStepStatus.PENDING &&
            "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Photo Uploading
        </p>
        {getStepIcon(streamData.data.uploading)}
      </div>
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          streamData.data.saved === UploadStepStatus.PENDING && "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-sm md:text-base">
          Photo Saved
        </p>
        {getStepIcon(streamData.data.saved)}
      </div>
    </div>
  );
}
