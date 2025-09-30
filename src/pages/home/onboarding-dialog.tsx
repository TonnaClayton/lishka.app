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
import useIsMobile from "@/hooks/use-is-mobile";
import useDeviceSize from "@/hooks/use-device-size";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { captureEvent } from "@/lib/posthog";

export const OnboardingDialog = React.memo(
  ({ hasSeenOnboardingFlow }: { hasSeenOnboardingFlow: boolean }) => {
    const [isOpen, setIsOpen] = React.useState(!hasSeenOnboardingFlow);
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [count, setCount] = React.useState(0);
    const { updateProfile } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const isMobile = useIsMobile(550);
    const deviceSize = useDeviceSize();

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

        // Track onboarding completion
        captureEvent("onboarding_completed", {
          screens_viewed: current,
          total_screens: 5,
        });

        await updateProfile({
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
          className={cn(
            "h-full w-full p-0 overflow-hidden rounded-[32px] bg-transparent sm:rounded-[32px] border-none",
            isMobile ? "rounded-none" : "max-w-[393px]  max-h-[852px]",
          )}
          style={{
            maxWidth: isMobile ? `${deviceSize.width}px` : undefined,
          }}
          hideCloseButton={true}
        >
          <Carousel
            opts={{
              align: "start",
              loop: false,
              dragFree: false,
            }}
            setApi={setApi}
            className={cn(
              "h-full w-full",
              isMobile
                ? "rounded-none"
                : "max-w-[393px]  max-h-[852px] rounded-[32px]",
            )}
            style={{
              maxWidth: isMobile ? `${deviceSize.width}px` : undefined,
            }}
          >
            <CarouselContent
              containerClassName="h-full w-full"
              className="h-full w-full ml-0"
            >
              <CarouselItem
                className={cn(
                  "h-full rounded-[32px] w-full p-0",
                  isMobile && "rounded-none",
                )}
              >
                <ScreenOne
                  titleClassName={cn(deviceSize.height <= 700 && "text-xl")}
                  descriptionClassName={cn(
                    deviceSize.height <= 700 && "text-sm",
                  )}
                />
              </CarouselItem>
              <CarouselItem
                className={cn(
                  "h-full rounded-[32px] w-full p-0",
                  isMobile && "rounded-none",
                )}
              >
                <ScreenTwo
                  titleClassName={cn(deviceSize.height <= 700 && "text-xl")}
                  descriptionClassName={cn(
                    deviceSize.height <= 700 && "text-sm",
                  )}
                />
              </CarouselItem>
              <CarouselItem
                className={cn(
                  "h-full rounded-[32px] w-full p-0",
                  isMobile && "rounded-none",
                )}
              >
                <ScreenThree
                  titleClassName={cn(deviceSize.height <= 700 && "text-xl")}
                  descriptionClassName={cn(
                    deviceSize.height <= 700 && "text-sm",
                  )}
                />
              </CarouselItem>
              <CarouselItem
                className={cn(
                  "h-full rounded-[32px] w-full p-0",
                  isMobile && "rounded-none",
                )}
              >
                <ScreenFour
                  titleClassName={cn(deviceSize.height <= 700 && "text-xl")}
                  descriptionClassName={cn(
                    deviceSize.height <= 700 && "text-sm",
                  )}
                />
              </CarouselItem>
              <CarouselItem
                className={cn(
                  "h-full rounded-[32px] w-full p-0",
                  isMobile && "rounded-none",
                )}
              >
                <ScreenFive
                  titleClassName={cn(deviceSize.height <= 700 && "text-xl")}
                  descriptionClassName={cn(
                    deviceSize.height <= 700 && "text-sm",
                  )}
                />
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
                    "flex-1 py-4 px-6 rounded-full text-white font-medium text-lg transition-colors hover:bg-lishka-blue border-gray-200  border-0 bg-lishka-blue disabled:opacity-50 disabled:cursor-not-allowed"
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
  },
);
