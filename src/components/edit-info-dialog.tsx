import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useLocalStorageBoolean } from "@/hooks/use-local-storage";
import { STORAGE_KEYS, COLORS } from "@/lib/constants";

interface EditInfoDialogProps {
  trigger?: boolean; // External trigger to show the dialog
  onTriggerHandled?: () => void; // Callback when the trigger has been processed
}

export default function EditInfoDialog({
  trigger = false,
  onTriggerHandled,
}: EditInfoDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useLocalStorageBoolean(
    STORAGE_KEYS.EDIT_INFO_DIALOG,
    false,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(
    (value: boolean) => {
      setIsOpen(value);

      // Notify parent that the dialog was closed
      if (!value && onTriggerHandled) {
        onTriggerHandled();
      }
    },
    [onTriggerHandled],
  );

  // Check local storage on mount and when trigger changes
  useEffect(() => {
    // If user has opted out, don't show the dialog
    if (dontShowAgain === true) {
      if (trigger && onTriggerHandled) {
        onTriggerHandled(); // Acknowledge the trigger even though we're not showing the dialog
      }
      return;
    }

    // Show dialog when triggered
    if (trigger) {
      setIsOpen(true);
    }
  }, [trigger, onTriggerHandled, dontShowAgain]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="p-8 w-full max-w-md mx-auto shadow-xl rounded-[16px]"
        hideCloseButton={true}
      >
        <div className="flex flex-col w-full h-full relative">
          {/* Close button */}
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            onClick={() => handleClose(false)}
            aria-label="Close dialog"
            type="button"
          >
            <Cross2Icon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 rounded-full flex items-center justify-center w-24 h-24">
              <div className="flex flex-col gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full mx-auto"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full mx-auto"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full mx-auto"></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-6 text-[#020817]">
            Edit AI Information
          </h2>

          {/* Description */}
          <p className="text-center text-lg leading-relaxed mb-8 text-[#65758B]">
            Your image has been uploaded successfully! You can tap on the{" "}
            <span className="text-blue-600 font-semibold">three dots icon</span>{" "}
            to review, edit, or confirm the AI-generated information.
          </p>

          {/* Checkbox */}
          <div className="flex items-center gap-3 mb-8">
            <input
              type="checkbox"
              id="dontShow"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              aria-checked={dontShowAgain}
              role="checkbox"
            />
            <label
              htmlFor="dontShow"
              className="text-gray-700 text-lg cursor-pointer"
            >
              Don't show this message again
            </label>
          </div>

          {/* Button */}
          <button
            className="w-full hover:bg-blue-700 text-white font-semibold transition-colors rounded-full text-[12px] py-3"
            style={{ backgroundColor: COLORS.BRAND_BLUE }}
            onClick={() => handleClose(false)}
            type="button"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
