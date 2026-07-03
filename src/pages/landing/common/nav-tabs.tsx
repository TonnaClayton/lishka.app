
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "./link";

/*
  Hover-following pill nav. The Cursor element animates between Tab
  positions on mouseenter, fades out on mouseleave. Desktop only.

  Tabs match the Figma navbar spec (node 8638:6647): Features /
  How it works / FAQ / Contact, 14px Inter Medium, 40px text-to-text.
*/
export const SlideTabs = () => {
  const [position, setPosition] = useState<Position>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      onMouseLeave={() => {
        setPosition((pv) => ({ ...pv, opacity: 0 }));
      }}
      className="relative hidden lg:flex w-fit items-center gap-4"
    >
      <Link href="#features">
        <Tab setPosition={setPosition}>Features</Tab>
      </Link>
      <Link href="#how-it-works">
        <Tab setPosition={setPosition}>How it works</Tab>
      </Link>
      <Link href="#faq">
        <Tab setPosition={setPosition}>FAQ</Tab>
      </Link>
      <Link href="mailto:hello@lishka.app">
        <Tab setPosition={setPosition}>Contact</Tab>
      </Link>

      <Cursor position={position} />
    </ul>
  );
};

const Tab = ({
  children,
  setPosition,
}: {
  children: string;
  setPosition: Dispatch<SetStateAction<Position>>;
}) => {
  const ref = useRef<null | HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          left: ref.current.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      // Figma: 14px Inter Medium, 40px between text — implemented as
      // px-3 (12px each side = 24px) on the tab + gap-4 (16px) on the
      // parent <ul>, so text-to-text = 24 + 16 = 40px. The internal
      // padding gives the hover cursor pill breathing room around the
      // word. Text flips white on hover because the pill background is
      // the near-black foreground.
      className="relative text-nowrap z-10 block cursor-pointer px-3 text-[14px] font-medium text-[#131415] hover:text-primary-foreground transition-colors"
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: Position }) => {
  return (
    <motion.li
      animate={{ ...position }}
      className="absolute z-0 h-8 rounded-full bg-foreground md:h-10 top-1/2 -translate-y-1/2"
    />
  );
};

type Position = {
  left: number;
  width: number;
  opacity: number;
};
