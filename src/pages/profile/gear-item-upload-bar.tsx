import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";
import { UploadPhotoStreamData, UploadStepStatus } from "./photo-upload-bar";
import { cn } from "@/lib/utils";

export default function GearItemUploadBar({
  uploadGearItemStreamData,
}: {
  uploadGearItemStreamData: UploadPhotoStreamData | null;
}) {
  if (uploadGearItemStreamData == null) {
    return null;
  }

  const getStepIcon = () => {
    if (
      uploadGearItemStreamData.data.analyzing === UploadStepStatus.COMPLETED &&
      uploadGearItemStreamData.data.uploading === UploadStepStatus.COMPLETED &&
      uploadGearItemStreamData.data.saved === UploadStepStatus.COMPLETED
    ) {
      return <CheckIcon className="w-5 h-5 text-white" />;
    }
    if (
      uploadGearItemStreamData.data.analyzing === UploadStepStatus.FAILED ||
      uploadGearItemStreamData.data.uploading === UploadStepStatus.FAILED ||
      uploadGearItemStreamData.data.saved === UploadStepStatus.FAILED
    ) {
      return <XIcon className="w-5 h-5 text-white" />;
    }

    if (
      uploadGearItemStreamData.data.analyzing === UploadStepStatus.PROCESSING ||
      uploadGearItemStreamData.data.uploading === UploadStepStatus.PROCESSING ||
      uploadGearItemStreamData.data.saved === UploadStepStatus.PROCESSING
    ) {
      return <LoaderIcon className="w-5 h-5 text-white animate-spin" />;
    }

    return null;
  };

  return (
    <div className="size-full bg-lishka-blue py-3 px-4 flex flex-col gap-y-2 h-fit z-20 sticky top-[69px]">
      <div
        className={cn(
          "h-[26px] w-full flex items-center justify-between",
          uploadGearItemStreamData.data.analyzing ===
            UploadStepStatus.PENDING && "opacity-50",
        )}
      >
        <p className="leading-snug text-white text-base">
          {uploadGearItemStreamData.data.message}
        </p>
        {getStepIcon()}
      </div>
    </div>
  );
}
