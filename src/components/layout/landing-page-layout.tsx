import { ROUTES } from "@/lib/routing";
import { Instagram } from "lucide-react";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Menu } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const homeLink = useMemo(() => (user ? "/home" : "/"), [user]);
  return (
    <div className="flex-1 flex-col h-full w-full relative overflow-y-auto bg-black">
      {children}

      <div className="w-full flex flex-col px-5 md:px-10 items-center bg-black border-t border-white/20 z-5 justify-start gap-y-[40px] py-20">
        <div className="w-full bg-transparent flex justify-center items-center h-[fit] flex-col gap-y-6">
          <img
            src={"/logo-dark.svg"}
            alt={"Lishka Logo"}
            className={"w-auto object-contain h-[40px]"}
          />
          <p
            className={
              "text-[#D1D5DB] mx-auto justify-center items-start text-center mb-4 font-extralight text-[12.8px] leading-[20.8px] max-w-2xl"
            }
          >
            Built for anglers, powered by AI. Lishka helps you fish smarter,
            safer, and together.
            <br />
            <span className="italic">
              "From beginner to builder, I made Lishka to be the fishing
              companion I always needed."
            </span>
          </p>
          <div
            className={
              "flex gap-8 w-full flex-wrap items-start justify-center lg:gap-x-[32px] gap-x-[16px]"
            }
          >
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={homeLink}
            >
              Home
            </Link>
            <span className="text-white/60">•</span>
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={homeLink + "#features"}
            >
              Features
            </Link>
            <span className="text-white/60">•</span>
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={homeLink + "#gallery"}
            >
              Gallery
            </Link>
            <span className="text-white/60">•</span>
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={homeLink + "#faqs"}
            >
              FAQs
            </Link>
            <span className="text-white/60">•</span>
            <Link
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              to={ROUTES.LOGIN_EMAIL}
            >
              Log In
            </Link>
          </div>
        </div>
        <div className="flex justify-center items-center flex-col gap-y-4 h-px bg-white opacity-10 md:w-3/5 w-full"></div>
        <div className="flex justify-between items-center py-0 w-full lg:w-3/5">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
            <div className="text-white/60 text-sm">© 2025 Lishka App</div>
            <div className="flex md:hidden gap-2 items-center">
              <Link
                to={ROUTES.PRIVACY_POLICY}
                className=" text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer"
              >
                Privacy Policy
              </Link>
              <span className="text-white/60">•</span>
              <Link
                to={ROUTES.TERMS}
                className=" text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer"
              >
                Terms
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <a
              href="https://www.instagram.com/lishka.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-[#0251FB]"
            >
              <Instagram className="w-5 h-5 text-white/80" />
            </a>
          </div>

          <div className="hidden md:flex gap-2 items-center">
            <Link
              to={ROUTES.PRIVACY_POLICY}
              className=" text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer"
            >
              Privacy Policy
            </Link>
            <span className="text-white/60">•</span>
            <Link
              to={ROUTES.TERMS}
              className=" text-white/60 text-sm hover:text-white/80 transition-colors cursor-pointer"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>

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
              background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(2, 81, 251, 0.3) 70%, transparent 100%);
              border-radius: 50%;
              pointer-events: none;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.4), 0 0 16px rgba(2, 81, 251, 0.2);
            }
            
            .navbar-particle-1 {
              width: 2px;
              height: 2px;
              top: 20%;
              left: 15%;
              animation: navbarFloat 6s ease-in-out infinite;
              animation-delay: 0s;
            }
            
            .navbar-particle-2 {
              width: 3px;
              height: 3px;
              top: 35%;
              left: 85%;
              animation: navbarFloat 8s ease-in-out infinite;
              animation-delay: -1s;
            }
            
            .navbar-particle-3 {
              width: 1.5px;
              height: 1.5px;
              top: 60%;
              left: 25%;
              animation: navbarFloat 7s ease-in-out infinite;
              animation-delay: -2s;
            }
            
            .navbar-particle-4 {
              width: 2.5px;
              height: 2.5px;
              top: 15%;
              left: 70%;
              animation: navbarFloat 9s ease-in-out infinite;
              animation-delay: -0.5s;
            }
            
            .navbar-particle-5 {
              width: 2px;
              height: 2px;
              top: 45%;
              left: 50%;
              animation: navbarFloat 5.5s ease-in-out infinite;
              animation-delay: -1.5s;
            }
            
            .navbar-particle-6 {
              width: 1px;
              height: 1px;
              top: 75%;
              left: 10%;
              animation: navbarFloat 10s ease-in-out infinite;
              animation-delay: -3s;
            }
            
            .navbar-particle-7 {
              width: 3px;
              height: 3px;
              top: 25%;
              left: 90%;
              animation: navbarFloat 6.5s ease-in-out infinite;
              animation-delay: -2.5s;
            }
            
            .navbar-particle-8 {
              width: 1.5px;
              height: 1.5px;
              top: 80%;
              left: 40%;
              animation: navbarFloat 8.5s ease-in-out infinite;
              animation-delay: -1.8s;
            }
            
            .navbar-particle-9 {
              width: 2px;
              height: 2px;
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
}

export function LandingPageHeader({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}) {
  const { user } = useAuth();

  const homeLink = useMemo(() => (user ? "/home" : "/"), [user]);
  return (
    <>
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
        <div className="particle particle-7"></div>
        <div className="particle particle-8"></div>
        <div className="particle particle-9"></div>
        <div className="particle particle-10"></div>
      </div>
      {/* Background glow */}
      <div className="flex justify-center items-center w-[600px] max-w-full md:max-w-[600px] h-[300px] absolute rounded-full top-[-105px] blur-3xl left-1/2 -translate-x-1/2 bg-[#0251FB] opacity-35" />

      {/* Glass navbar pill */}
      <div className="w-full bg-transparent flex justify-center items-center relative overflow-visible h-[150px] px-5">
        {/* Tiny luminous particles for navbar area */}
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
        </div>

        <div className="flex items-center justify-center w-full max-w-2xl mx-auto border-white/20 rounded-full py-3 h-[64px] relative z-10 border-0 px-0">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to={homeLink}
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal"
            >
              Home
            </Link>
            <span className="text-white/60">•</span>
            <Link
              to={homeLink + "#features"}
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal"
            >
              Features
            </Link>
            <div className="flex items-center justify-center rounded-xl h-[48px]">
              <Link to={homeLink}>
                <img
                  src="/logo-dark.svg"
                  alt="Lishka Logo"
                  className="h-full object-contain lg:w-[250px] w-[120px]"
                />
              </Link>
            </div>
            <Link
              to={homeLink + "#faqs"}
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal"
            >
              FAQs
            </Link>
            <span className="text-white/60">•</span>
            <Link
              to={ROUTES.LOGIN}
              className="text-white/90 hover:text-white transition-colors cursor-pointer text-[14px] font-normal w-[55px]"
            >
              Log In
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between w-full">
            <div>
              <Link
                to={homeLink}
                className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              >
                Home
              </Link>
            </div>
            <div className="flex items-center justify-center rounded-xl h-[48px]">
              <Link to={homeLink}>
                <img
                  src="/logo-dark.svg"
                  alt="Lishka Logo"
                  className="h-full object-contain w-[137px]"
                />
              </Link>
            </div>
            <div>
              <Link
                to={ROUTES.LOGIN_EMAIL}
                className="text-white/90 hover:text-white transition-colors cursor-pointer text-sm font-normal"
              >
                Log In
              </Link>
            </div>
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white/90 hover:text-white transition-colors p-2 hidden"
              aria-label="Toggle mobile menu"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <motion.button
                  initial={{ rotate: -180 }}
                  animate={{ rotate: 0 }}
                  exit={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-8 right-8 text-white/90 hover:text-white transition-colors p-2"
                  aria-label="Close mobile menu"
                >
                  <X className="h-6 w-6" />
                </motion.button>

                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center justify-center rounded-xl h-[48px] mb-8"
                >
                  <img
                    src="/logo-dark.svg"
                    alt="Lishka Logo"
                    className="h-full object-contain w-[150px]"
                  />
                </motion.div>

                <nav className="flex flex-col items-center gap-6">
                  {[
                    { name: "Home", id: "home" },
                    { name: "Features", id: "features" },
                    { name: "Gallery", id: "gallery" },
                    { name: "FAQs", id: "faqs" },
                  ].map((item, index) => (
                    <motion.span
                      key={item.name}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.3 + index * 0.1,
                      }}
                      className="text-white/90 hover:text-white transition-colors cursor-pointer text-lg font-normal"
                      onClick={() =>
                        item.id === "home"
                          ? setIsMobileMenuOpen(false)
                          : setIsMobileMenuOpen(false)
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item.name}
                    </motion.span>
                  ))}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
