import useIsMobile from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routing";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

export default function LoginPage() {
  const isMobile = useIsMobile();
  const { signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      if (isGoogleLoading) return;
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Google sign-in error:", error);
        // You could add a toast notification here
      }
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-black h-full w-full">
      <div className="grid grid-cols-1 h-full">
        <div
          className={cn(
            "w-full h-full flex flex-col",
            !isMobile && "justify-center items-center",
          )}
        >
          <div
            className={cn(
              "w-full flex flex-col items-center justify-center  h-full z-10 max-w-[327px] mx-auto",
            )}
          >
            <div
              className={cn(
                "flex flex-col gap-[60px] h-full w-full items-center justify-center text-center",
                !isMobile && "h-[85%] max-h-[586px]",
              )}
            >
              <div className="flex items-center flex-col">
                <Link to="/">
                  <img
                    src={"/images/tempo-image-20250804T201257275Z.png"}
                    alt={"Pasted Image"}
                    className={"w-[210px] h-[40px]"}
                  />
                </Link>
              </div>

              <div className="">
                <p
                  className={cn(
                    "leading-relaxed max-w-md font-light text-white font-[serif] text-6xl",
                  )}
                >
                  Create
                  <br className="" /> Your Free
                  <br className="" /> <span className="italic">Account</span>
                </p>
              </div>

              <div className="flex flex-col w-full">
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className={
                      "flex-1 px-6 rounded-full font-semibold size-full text-sm py-4 h-[46px] border bg-white border-gray-200 text-[#243041] flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 19 19"
                      fill="none"
                      className="mr-2"
                    >
                      <g clipPath="url(#clip0_3233_1404)">
                        <path
                          d="M18.674 9.71058C18.674 8.93171 18.6121 8.36334 18.4782 7.77393H9.77246V11.2894H14.8825C14.7796 12.163 14.2232 13.4787 12.9869 14.3628L12.9695 14.4805L15.7221 16.659L15.9128 16.6784C17.6643 15.0259 18.674 12.5945 18.674 9.71058Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M9.77263 18.9729C12.2761 18.9729 14.3779 18.1308 15.913 16.6783L12.987 14.3627C12.2041 14.9205 11.1532 15.31 9.77263 15.31C7.32061 15.31 5.23948 13.6575 4.49762 11.3735L4.38888 11.383L1.52669 13.6459L1.48926 13.7522C3.01404 16.8467 6.14606 18.9729 9.77263 18.9729Z"
                          fill="#34A853"
                        />
                        <path
                          d="M4.4974 11.3736C4.30165 10.7842 4.18836 10.1526 4.18836 9.50004C4.18836 8.84742 4.30165 8.21592 4.4871 7.62651L4.48191 7.50098L1.58385 5.20166L1.48903 5.24774C0.860597 6.53185 0.5 7.97386 0.5 9.50004C0.5 11.0262 0.860597 12.4682 1.48903 13.7523L4.4974 11.3736Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M9.77263 3.68991C11.5138 3.68991 12.6882 4.45826 13.3579 5.10036L15.9748 2.49004C14.3676 0.963864 12.2761 0.0270996 9.77263 0.0270996C6.14606 0.0270996 3.01404 2.15321 1.48926 5.24766L4.48732 7.62643C5.23949 5.34242 7.32061 3.68991 9.77263 3.68991Z"
                          fill="#EB4335"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_3233_1404">
                          <rect
                            x="0.5"
                            width="18.1739"
                            height="19"
                            rx="9.08696"
                            fill="white"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                    {isGoogleLoading ? "Connecting..." : "Continue with Google"}
                  </button>
                  <button
                    disabled={isGoogleLoading}
                    className={
                      "flex-1 px-6 rounded-full font-semibold transition-colors size-full text-sm py-4 h-[46px] border bg-[#ffffff] border-[#d8dadc] text-[#243041] flex justify-center items-center"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="mr-2"
                    >
                      <path
                        d="M15.8169 10.534C15.8081 8.90076 16.537 7.668 18.0122 6.76012C17.1868 5.56297 15.9399 4.90432 14.2934 4.77526C12.7348 4.65065 11.0313 5.69648 10.4078 5.69648C9.74925 5.69648 8.23891 4.81976 7.05347 4.81976C4.60357 4.85981 2 6.80018 2 10.7477C2 11.9137 2.21074 13.1182 2.63223 14.3614C3.19422 15.9947 5.22263 20 7.33886 19.9332C8.44527 19.9065 9.22678 19.1366 10.6669 19.1366C12.063 19.1366 12.7875 19.9332 14.0212 19.9332C16.155 19.9021 17.9902 16.2617 18.5259 14.6239C15.6633 13.2577 15.8169 10.6186 15.8169 10.534ZM13.3319 3.22652C14.5305 1.7846 14.4207 0.47174 14.3856 0C13.3275 0.0623053 12.1026 0.729862 11.4045 1.55318C10.6361 2.43436 10.1839 3.5247 10.2805 4.753C11.4264 4.84201 12.4714 4.24566 13.3319 3.22652Z"
                        fill="black"
                      />
                    </svg>
                    Continue with Apple
                  </button>
                  <Link
                    to={"/signup"}
                    aria-disabled={isGoogleLoading}
                    className={
                      "flex-1 px-6 rounded-full font-semibold transition-colors size-full text-sm py-4 h-[46px] border bg-[#ffffff] border-[#d8dadc] text-[#243041] flex justify-center items-center"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="21"
                      height="20"
                      viewBox="0 0 21 20"
                      className="mr-2"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.9451 3C16.152 3 17.313 3.43647 18.1671 4.21965C19.0221 5.00118 19.5 6.05529 19.5 7.15882V13.6647C19.5 15.9624 17.457 17.8235 14.9451 17.8235H6.054C3.5421 17.8235 1.5 15.9624 1.5 13.6647V7.15882C1.5 4.86118 3.5331 3 6.054 3H14.9451ZM16.3771 8.38587L16.4491 8.31999C16.6642 8.08117 16.6642 7.73528 16.4392 7.49646C16.3141 7.37375 16.1422 7.29881 15.9631 7.28234C15.7741 7.27328 15.5941 7.33175 15.4582 7.44705L11.4001 10.4118C10.8781 10.8079 10.1302 10.8079 9.60014 10.4118L5.55014 7.44705C5.27024 7.25764 4.88324 7.28234 4.65014 7.5047C4.40714 7.72705 4.38014 8.08117 4.58624 8.32823L4.70414 8.43528L8.79914 11.3588C9.30314 11.7212 9.91424 11.9188 10.5541 11.9188C11.1922 11.9188 11.8141 11.7212 12.3172 11.3588L16.3771 8.38587Z"
                        fill="black"
                      />
                    </svg>
                    Continue with Email
                  </Link>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-center text-white px-6 gap-4 gap-x-1 py-6",
                  )}
                >
                  <p className={"max-w-md text-sm text-white/70 font-normal"}>
                    Already have an account? {" "}
                  </p>
                  <Link
                    to={ROUTES.LOGIN_EMAIL}
                    className={" max-w-md text-sm font-bold"}
                  >
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <Particles />
        </div>
      </div>
    </div>
  );
}

const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="navbar-particle navbar-particle-1"></div>
      <div className="navbar-particle navbar-particle-2"></div>
      <div className="navbar-particle navbar-particle-3"></div>
      <div className="navbar-particle navbar-particle-4"></div>
      <div className="navbar-particle navbar-particle-5"></div>
      <div className="navbar-particle navbar-particle-6"></div>
      <div className="navbar-particle navbar-particle-7"></div>
      <div className="navbar-particle navbar-particle-8"></div>
      <div className="navbar-particle navbar-particle-9"></div>
      <div className="navbar-particle navbar-particle-10"></div>
      <div className="navbar-particle navbar-particle-11"></div>
      <div className="navbar-particle navbar-particle-12"></div>
      <div className="navbar-particle navbar-particle-13"></div>
      <div className="navbar-particle navbar-particle-14"></div>
      <div className="navbar-particle navbar-particle-15"></div>
      <div className="navbar-particle navbar-particle-16"></div>
      <div className="navbar-particle navbar-particle-17"></div>
      <div className="navbar-particle navbar-particle-18"></div>
      <div className="navbar-particle navbar-particle-19"></div>
      <div className="navbar-particle navbar-particle-20"></div>
      <div className="navbar-particle navbar-particle-21"></div>
      <div className="navbar-particle navbar-particle-22"></div>
      <div className="navbar-particle navbar-particle-23"></div>
      <div className="navbar-particle navbar-particle-24"></div>
      {/* CSS for animations */}
      <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-20px) translateX(10px); }
              50% { transform: translateY(-10px) translateX(-15px); }
              75% { transform: translateY(-25px) translateX(5px); }
            }
            
            @keyframes navbarFloat {
              0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.8; }
              25% { transform: translateY(-15px) translateX(8px) scale(1.1); opacity: 1; }
              50% { transform: translateY(-8px) translateX(-12px) scale(0.9); opacity: 0.6; }
              75% { transform: translateY(-18px) translateX(6px) scale(1.05); opacity: 0.9; }
            }
            
            .particle {
              position: absolute;
              background: radial-gradient(circle, rgba(2, 81, 251, 0.8) 0%, rgba(2, 81, 251, 0.4) 50%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
            }
            
            .navbar-particle {
              position: absolute;
              background: radial-gradient(circle, rgba(2, 81, 251, 0.9) 0%, rgba(2, 81, 251, 0.6) 40%, rgba(2, 81, 251, 0.3) 70%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.4), 0 0 16px rgba(2, 81, 251, 0.2);
            }
            
            .navbar-particle-1 {
              width: 10px;
              height: 10px;
              top: 20%;
              left: 15%;
              animation: navbarFloat 6s ease-in-out infinite;
              animation-delay: 0s;
            }
            
            .navbar-particle-2 {
              width: 8px;
              height: 8px;
              top: 35%;
              left: 85%;
              animation: navbarFloat 8s ease-in-out infinite;
              animation-delay: -1s;
            }
            
            .navbar-particle-3 {
              width: 6px;
              height: 6px;
              top: 60%;
              left: 25%;
              animation: navbarFloat 7s ease-in-out infinite;
              animation-delay: -2s;
            }
            
            .navbar-particle-4 {
              width: 5px;
              height: 5px;
              top: 15%;
              left: 70%;
              animation: navbarFloat 9s ease-in-out infinite;
              animation-delay: -0.5s;
            }
            
            .navbar-particle-5 {
              width: 8px;
              height: 8px;
              top: 45%;
              left: 50%;
              animation: navbarFloat 5.5s ease-in-out infinite;
              animation-delay: -1.5s;
            }
            
            .navbar-particle-6 {
              width: 6px;
              height: 6px;
              top: 75%;
              left: 10%;
              animation: navbarFloat 10s ease-in-out infinite;
              animation-delay: -3s;
            }
            
            .navbar-particle-7 {
              width: 6px;
              height: 6px;
              top: 25%;
              left: 90%;
              animation: navbarFloat 6.5s ease-in-out infinite;
              animation-delay: -2.5s;
            }
            
            .navbar-particle-8 {
              width: 6px;
              height: 6px;
              top: 80%;
              left: 40%;
              animation: navbarFloat 8.5s ease-in-out infinite;
              animation-delay: -1.8s;
            }
            
            .navbar-particle-9 {
              width: 4px;
              height: 4px;
              top: 10%;
              left: 60%;
              animation: navbarFloat 7.5s ease-in-out infinite;
              animation-delay: -4s;
            }
            
            .navbar-particle-10 {
              width: 3px;
              height: 3px;
              top: 50%;
              left: 85%;
              animation: float 16s ease-in-out infinite;
              animation-delay: -3.5s;
            }

            @keyframes blobMorph {
              0%, 100% {
                border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
                transform: scale(1) rotate(0deg);
              }
              25% {
                border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                transform: scale(1.05) rotate(90deg);
              }
              50% {
                border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%;
                transform: scale(1.1) rotate(180deg);
              }
              75% {
                border-radius: 70% 30% 50% 50% / 30% 60% 40% 70%;
                transform: scale(1.05) rotate(270deg);
              }
            }

            .blob-morph {
              animation: blobMorph 3s ease-in-out infinite;
            }

            @keyframes wave {
              0% {
                transform: translateX(-100%) skewX(-15deg);
              }
              50% {
                transform: translateX(0%) skewX(0deg);
              }
              100% {
                transform: translateX(100%) skewX(15deg);
              }
            }

            .wave-animation {
              animation: wave 0.8s ease-in-out;
            }

            @keyframes ripple {
              0% {
                box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4),
                           0 0 0 10px rgba(255, 255, 255, 0.3),
                           0 0 0 20px rgba(255, 255, 255, 0.2);
              }
              50% {
                box-shadow: 0 0 0 15px rgba(255, 255, 255, 0.2),
                           0 0 0 30px rgba(255, 255, 255, 0.15),
                           0 0 0 45px rgba(255, 255, 255, 0.1);
              }
              100% {
                box-shadow: 0 0 0 30px rgba(255, 255, 255, 0),
                           0 0 0 60px rgba(255, 255, 255, 0),
                           0 0 0 90px rgba(255, 255, 255, 0);
              }
            }

            .ripple-animation {
              animation: ripple 1.2s ease-out;
            }
          `}</style>
    </div>
  );
};
