import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import BottomNav from "./BottomNav";

const FAQPage: React.FC = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I identify a fish I caught?",
      answer:
        "You can use our AI-powered fish identification feature by taking a photo of your catch. Simply tap the camera button in the bottom navigation and our AI will analyze the image to identify the species, estimate size and weight, and provide detailed information about the fish.",
    },
    {
      question: "How accurate is the AI?",
      answer:
        "Our AI fish identification system is highly accurate, with success rates typically ranging from 85-95% depending on photo quality and fish visibility. Each identification comes with a confidence score (0-100%) that indicates how certain the AI is about its prediction. Higher confidence scores generally mean more accurate identifications. For best results, ensure clear, well-lit photos showing the entire fish with distinctive features visible.",
    },
    {
      question: "How accurate is the weather forecast for fishing?",
      answer:
        "Our weather data is sourced from reliable meteorological services and is updated regularly. The forecast includes marine-specific conditions like wind speed, wave height, and barometric pressure that are crucial for fishing success. However, weather conditions can change rapidly, so always check current conditions before heading out.",
    },
    {
      question: "Can I use the app offline?",
      answer:
        "Some features of Lishka work offline, including previously loaded fish information and saved photos. However, AI fish identification, weather updates, and location-based recommendations require an internet connection to function properly.",
    },
    {
      question: "How do I change my fishing location?",
      answer:
        "You can update your location by going to Settings and selecting 'Change Location'. You can either allow the app to use your current GPS location or manually enter a specific fishing location. This helps us provide more accurate local fish species and weather information.",
    },
    {
      question: "What information does the fish identification provide?",
      answer:
        "Our AI fish identification provides species name, estimated size and weight, seasonal availability, preferred habitats, fishing techniques, bait recommendations, and local fishing hotspots. The accuracy depends on photo quality and fish visibility.",
    },
    {
      question: "How does the AI gear reading and recommendation work?",
      answer:
        "Our AI can analyze photos of your fishing gear to identify rod types, reel specifications, lures, and tackle. Based on this analysis and your target fish species, the AI provides personalized gear recommendations including optimal rod action, line weight, lure colors, and bait suggestions. The system considers factors like water conditions, fish behavior, and seasonal patterns to suggest the most effective gear combinations for your fishing situation.",
    },
    {
      question: "How do I save my fishing photos and data?",
      answer:
        "All photos you take through the app are automatically saved to your profile. You can view them in your Profile section along with the AI-generated fish data. Your fishing history and catches are stored securely in your account.",
    },
    {
      question: "Are there fishing regulations and limits included?",
      answer:
        "While we provide general information about fish species, you should always check local fishing regulations, size limits, bag limits, and seasonal restrictions with your local wildlife agency. Fishing laws vary by location and can change frequently.",
    },
    {
      question: "How do I get the best results from fish photo identification?",
      answer:
        "For best AI identification results: take photos in good lighting, show the entire fish clearly, include distinctive features like fins and markings, avoid blurry or dark images, and try to photograph the fish against a contrasting background.",
    },
    {
      question: "Can I share my catches with other anglers?",
      answer:
        "Currently, Lishka focuses on personal fishing assistance and data tracking. Social sharing features may be added in future updates. You can save your catches to build your personal fishing log and track your success over time.",
    },
    {
      question: "What should I do if the app isn't working properly?",
      answer:
        "If you're experiencing issues, try restarting the app first. Check that you have a stable internet connection for features that require it. Make sure you're using the latest version of the app. If problems persist, contact us through our Instagram @lishka.app with details about the issue.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 w-full border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2 dark:text-white">
            Frequently Asked Questions
          </h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto pb-20 w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => {
              const isFirst = index === 0;
              const isLast = index === faqs.length - 1;
              let triggerClasses =
                "px-6 py-4 text-left hover:no-underline hover:bg-white dark:hover:bg-gray-800 dark:text-white bg-white dark:bg-gray-800 data-[state=open]:bg-white dark:data-[state=open]:bg-gray-800";

              if (isFirst) {
                triggerClasses += " rounded-t-lg";
              }
              if (isLast) {
                triggerClasses += " rounded-b-lg";
              }

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <AccordionTrigger className={triggerClasses}>
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 dark:text-white">
            Still have questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Can't find what you're looking for? We're here to help!
          </p>
          <Button
            onClick={() =>
              window.open("https://www.instagram.com/lishka.app/", "_blank")
            }
            className="w-full sm:w-auto"
          >
            Contact Us on Instagram
          </Button>
        </div>
      </main>
      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <div className="hidden lg:block lg:h-16"></div>
    </div>
  );
};

export default FAQPage;
