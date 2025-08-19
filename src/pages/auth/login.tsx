import React from "react";

import useIsMobile from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { MailIcon } from "lucide-react";
import { ROUTES } from "@/lib/routing";

export default function LoginPage() {
  const isMobile = useIsMobile();

  return (
    <div className="bg-white dark:bg-gray-900 h-full w-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_560px] h-full">
        <div
          className={cn(
            "w-full h-full flex flex-col bg-[#2E8EB1]",
            !isMobile && "justify-center items-center bg-white",
          )}
        >
          {isMobile && (
            <div className="z-10 w-full h-[50%] bg-transparent"></div>
          )}
          <div
            className={cn(
              "w-full flex flex-col items-center",
              isMobile
                ? "h-[50%] z-10 justify-end bg-transparent"
                : "justify-center max-w-md mx-auto w-full h-full",
            )}
          >
            <div
              className={
                "size-full flex flex-col items-center justify-center text-center px-4 h-fit py-4 gap-4"
              }
            >
              <div className="flex items-center flex-col gap-3">
                {isMobile ? (
                  <img
                    src={"/images/tempo-image-20250804T201257275Z.png"}
                    alt={"Pasted Image"}
                    width={840}
                    height={160}
                    className={"w-[210px] h-[48px]"}
                  />
                ) : (
                  <>
                    <img
                      src="/logo.svg"
                      alt="Lishka Logo"
                      className="h-8 w-auto dark:hidden"
                    />
                    <img
                      src="/logo-night.svg"
                      alt="Lishka Logo"
                      className="h-8 w-auto hidden dark:block"
                    />
                  </>
                )}
                <p
                  className={cn(
                    "leading-relaxed max-w-md font-light text-base",
                    isMobile && "text-white",
                  )}
                >
                  Your AI Fishing Companion
                </p>
              </div>

              <button
                className={
                  "flex-1 px-6 rounded-full font-medium size-full text-sm py-4 border bg-white border-gray-200 text-[#243041] flex justify-center items-center"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="#000000"
                  viewBox="0 0 256 256"
                  className="w-4 h-4 mr-2"
                >
                  <path d="M228,128a100,100,0,1,1-22.86-63.64,12,12,0,0,1-18.51,15.28A76,76,0,1,0,203.05,140H128a12,12,0,0,1,0-24h88A12,12,0,0,1,228,128Z"></path>
                </svg>
                Continue with Google
              </button>
              <button
                className={
                  "flex-1 px-6 rounded-full font-medium transition-colors size-full text-sm py-4 h-[48px] border bg-[#ffffff] border-[#d8dadc] text-[#243041] flex justify-center items-center"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-2"
                >
                  <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                  <path d="M10 2c1 .5 2 2 2 5" />
                </svg>
                Continue with Apple
              </button>
              <Link
                to={"/signup"}
                className={
                  "flex-1 px-6 rounded-full font-medium transition-colors size-full text-sm py-4 h-[48px] border bg-[#ffffff] border-[#d8dadc] text-[#243041] flex justify-center items-center"
                }
              >
                <MailIcon className="w-4 h-4 mr-2" />
                Continue with Email
              </Link>
            </div>
            <div
              className={cn(
                "flex items-center justify-center px-6 gap-4 gap-x-1 py-6",
                isMobile && "text-white",
              )}
            >
              <p
                className={
                  "leading-relaxed max-w-md text-base h-[fit] font-normal"
                }
              >
                Already have an account? {" "}
              </p>
              <Link
                to={ROUTES.LOGIN_EMAIL}
                className={
                  "leading-relaxed max-w-md text-base h-[fit] font-medium"
                }
              >
                Sign in
              </Link>
            </div>
          </div>
          {isMobile && (
            <img
              src={
                "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250804T193646745Z.png"
              }
              alt={"Pasted Image"}
              width={1572}
              height={3408}
              className={"w-full h-full absolute z-1"}
            />
          )}
        </div>

        <div
          className={cn(
            "w-full h-full relative overflow-hidden",
            isMobile && "hidden",
          )}
        >
          <div className="z-10 absolute top-0 w-full h-[50%] bg-transparent"></div>
          <img
            src={
              "https://lmjlmyqbwgxmiguxqdhi.supabase.co/storage/v1/object/public/assets/tempo-image-20250804T193646745Z.png"
            }
            alt={"Pasted Image"}
            width={1572}
            height={3408}
            className={"w-full h-full object-fill"}
          />
        </div>
      </div>
    </div>
  );
}
