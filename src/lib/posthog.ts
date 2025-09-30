import posthog from "posthog-js";
import { config } from "./config";

const initPosthog = () => {
  posthog.init(config.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: config.VITE_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    capture_pageleave: true,
    capture_pageview: true,
    autocapture: true,
  });
};

const captureEvent = (event: string, properties?: Record<string, any>) => {
  posthog.capture(event, properties);
};

const identifyUser = (userId: string, email: string) => {
  posthog.identify(userId, {
    email: email,
  });
};

const resetUser = () => {
  posthog.reset();
};

export { captureEvent, identifyUser, initPosthog, posthog, resetUser };
