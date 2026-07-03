import React from "react";

/*
  Drop-in replacement for `next/image` inside the Vite landing.

  Handles the two API shapes the port actually uses:
    - `fill` — absolutely fills the parent (position: absolute, inset 0,
      w/h 100%). Used everywhere the Next landing rendered a photo
      inside a relatively-positioned container.
    - regular props with explicit width/height — treated as a plain
      <img>.

  `sizes`, `quality`, and `priority` are ignored (they only matter to
  the Next.js image pipeline, which we're not using — Vite serves the
  raw asset from public/).
*/

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  fill?: boolean;
  quality?: number;
  priority?: boolean;
  sizes?: string;
};

const Image = ({
  fill,
  quality: _quality,
  priority,
  sizes: _sizes,
  className,
  alt,
  ...rest
}: ImgProps) => {
  const fillClassName = fill
    ? `absolute inset-0 w-full h-full ${className || ""}`
    : className;

  return (
    <img
      alt={alt || ""}
      loading={priority ? "eager" : "lazy"}
      className={fillClassName}
      {...rest}
    />
  );
};

export default Image;
