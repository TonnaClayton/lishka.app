import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
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
                <ScreenOne onNext={() => api?.scrollNext()} />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenTwo onNext={() => api?.scrollNext()} />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenThree onNext={() => api?.scrollNext()} />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenFour onNext={() => api?.scrollNext()} />
              </CarouselItem>
              <CarouselItem className="h-full w-full p-0">
                <ScreenFive
                  onNext={() => setShowScreenSix(true)}
                  isMobile={isMobile}
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
