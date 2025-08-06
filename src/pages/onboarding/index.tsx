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
import ScreenSix from "./screen-six";
import useIsMobile from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const isMobile = useIsMobile();
  const [showScreenSix, setShowScreenSix] = React.useState(false);

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

  const showContinueButton = isMobile || current > 5;

  return (
    <div className="bg-white dark:bg-gray-900 h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_560px] h-full">
        <div
          className={cn(
            "hidden w-full md:block",
            isMobile && showScreenSix && "block"
          )}
        >
          <ScreenSix isMobile={isMobile} />
        </div>
        <div
          className={cn("w-full h-full", isMobile && showScreenSix && "hidden")}
        >
          <Carousel
            opts={{
              align: "start",
              loop: false,
              dragFree: false,
            }}
            setApi={setApi}
            className="h-full w-full"
          >
            <CarouselContent
              containerClassName="h-full w-full"
              className="h-full w-full ml-0"
            >
              <CarouselItem className="h-full w-full p-0">
                <ScreenOne />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenTwo />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenThree />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenFour />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
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
              {showContinueButton && (
                <div
                  className={
                    "size-full h-[120px] flex items-center justify-center px-6 gap-4 gap-x-3 py-5"
                  }
                >
                  <button
                    className={
                      "flex-1 py-4 px-6 rounded-full text-white font-medium text-lg transition-colors hover:bg-blue-700 border-gray-200  border-0 bg-[#0251FB]"
                    }
                    onClick={() => {
                      if (current === 5) {
                        setShowScreenSix(true);
                      } else {
                        api?.scrollNext();
                      }
                    }}
                  >
                    {current === 5 ? "Continue" : "Next"}
                  </button>
                </div>
              )}
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
