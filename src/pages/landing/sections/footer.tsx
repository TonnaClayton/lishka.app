import { Separator } from "@/components/ui/separator";
import { footerItems } from "../lib/constants";
import Image from "../common/img";
import Link from "../common/link";

import { Facebook, Instagram } from "lucide-react";

/*
  Bottom-of-page footer — wordmark + nav on the top row, copyright +
  socials on the bottom row. Mobile collapses both rows into a stack.
  Logo dimensions match the top nav exactly (h-6 × w-[126px]) so it
  doesn't read squashed.
*/
const Footer = () => {
  return (
    <footer className="w-full py-8 border-t border-foreground/5">
      <div className="max-w-7xl mx-auto lg:px-20 2xl:px-0">
        <div className="w-full flex flex-col md:flex-row items-start md:items-center md:justify-between gap-8 md:gap-0 px-6 md:px-0 pt-8 md:pt-4">
          <Link href="/" aria-label="Lishka home">
            <div className="relative h-6 w-[126px]">
              <Image
                fill
                src="/assets/lishka-logo.svg"
                quality={100}
                className="object-contain object-left"
                alt="Lishka"
              />
            </div>
          </Link>

          <aside className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {footerItems.map((item, index) => (
              <Link
                className="text-foreground/60 hover:text-foreground transition-colors text-sm"
                key={index}
                href={item.href}
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </aside>
        </div>

        <Separator className="opacity-20 mb-2 mt-6 hidden md:block" />

        <div className="mt-12 md:mt-0 w-full flex flex-col-reverse md:flex-row items-center gap-8 md:gap-0 md:justify-between px-6 md:px-0 py-4">
          <div>
            <span className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Lishka. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/lishkaapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lishka on Facebook"
              className="text-foreground/60 hover:text-foreground transition-colors w-9 h-9 flex items-center justify-center"
            >
              <Facebook size={18} />
            </a>
            <a
              href="https://www.instagram.com/lishka.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lishka on Instagram"
              className="text-foreground/60 hover:text-foreground transition-colors w-9 h-9 flex items-center justify-center"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
