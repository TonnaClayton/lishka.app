import Link from "./link";

/*
  Sticky top banner announcing that the web app is retiring
  soon. Fixed at the very top of the viewport on every page so
  users who arrive on the new landing can still find their
  legacy web account before it goes dark.

  Sits above the floating pill navigation, which is offset
  vertically in app/layout to make room for this strip.

  Copy is deliberately date-less until the Android launch lands
  and a hard sunset window can be committed to. Once that date
  is fixed, swap "retiring soon" back to an explicit deadline
  so users have a concrete number to plan around.
*/
const SunsetBanner = () => {
  return (
    <div className="fixed top-0 inset-x-0 z-[110] bg-[#131415] text-white">
      <p className="m-0 mx-auto max-w-[1440px] px-4 md:px-6 py-2 text-center text-[12px] md:text-[13px] leading-[1.45] tracking-[0.1px] text-white/90">
        The web app will be{" "}
        <span className="font-semibold text-white">retiring soon</span>. If
        you still would like to access your web account,{" "}
        <Link
          href="https://www.lishka.app/login"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white underline underline-offset-4 hover:text-white/80 transition-colors"
        >
          login here
        </Link>
        .
      </p>
    </div>
  );
};

export default SunsetBanner;
