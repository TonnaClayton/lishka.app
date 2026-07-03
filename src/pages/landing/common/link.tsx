import React from "react";
import { Link as RouterLink } from "react-router-dom";

/*
  Drop-in replacement for `next/link` inside the Vite landing.

  Anything that starts with a protocol or a hash (#) renders as a
  plain <a>. Same for anchor-only href (empty or "#"). Everything
  else — internal SPA routes — renders as a React Router Link so we
  don't do a full page reload on internal navigation.
*/

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

const isExternal = (href: string) =>
  /^([a-z]+:|#)/i.test(href) || href.startsWith("mailto:");

const Link = ({ href, children, ...rest }: LinkProps) => {
  if (isExternal(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  );
};

export default Link;
