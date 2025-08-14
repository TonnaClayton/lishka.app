import { Dialog, DialogContent } from "@/components/ui/dialog";
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDot,
  type CarouselApi,
} from "@/components/ui/carousel";
import ScreenOne from "./screen-one";
import ScreenTwo from "./screen-two";
import ScreenFour from "./screen-four";
import ScreenThree from "./screen-three";
import ScreenFive from "./screen-five";
import { useUpdateProfile } from "@/hooks/queries";

export function OnboardingDialog({
  hasSeenOnboardingFlow,
}: {
  hasSeenOnboardingFlow: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(!hasSeenOnboardingFlow);
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const mutation = useUpdateProfile();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      await mutation.mutateAsync({
        has_seen_onboarding_flow: true,
      });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open == false && hasSeenOnboardingFlow == false) {
          // setIsOpen(false);
        }
      }}
    >
      <DialogContent
        className="h-full max-h-[852px] w-full max-w-[393px] p-0 overflow-hidden rounded-[24px] border-none"
        hideCloseButton={true}
      >
        <Carousel
          opts={{
            align: "start",
            loop: false,
            dragFree: false,
          }}
          setApi={setApi}
          className="h-full max-w-[393px] max-h-[852px] w-full rounded-[24px]"
        >
          <CarouselContent
            containerClassName="h-full w-full"
            className="h-full w-full ml-0"
          >
            <CarouselItem className="h-full rounded-[24px] w-full p-0">
              <ScreenOne />
            </CarouselItem>
            <CarouselItem className="h-full rounded-[24px] w-full p-0">
              <ScreenTwo />
            </CarouselItem>
            <CarouselItem className="h-full rounded-[24px] w-full p-0">
              <ScreenThree />
            </CarouselItem>
            <CarouselItem className="h-full rounded-[24px] w-full p-0">
              <ScreenFour />
            </CarouselItem>
            <CarouselItem className="h-full rounded-[24px] w-full p-0">
              <ScreenFive />
            </CarouselItem>
          </CarouselContent>
          <div className="absolute bottom-0 flex w-full flex-col items-center justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <CarouselDot
                  className="mx-1 mt-4"
                  key={i}
                  scrollToIndex={i}
                  selectedClassName="bg-white"
                />
              ))}
            </div>

            <div
              className={
                "size-full h-[120px] flex items-center justify-center px-6 gap-4 gap-x-3 py-5"
              }
            >
              <button
                disabled={isLoading}
                className={
                  "flex-1 py-4 px-6 rounded-full text-white font-medium text-lg transition-colors hover:bg-blue-700 border-gray-200  border-0 bg-[#0251FB] disabled:opacity-50 disabled:cursor-not-allowed"
                }
                onClick={() => {
                  if (current === 5) {
                    handleContinue();
                  } else {
                    api?.scrollNext();
                  }
                }}
              >
                {isLoading
                  ? "Please wait..."
                  : current === 5
                    ? "Continue"
                    : "Next"}
              </button>
            </div>
          </div>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
