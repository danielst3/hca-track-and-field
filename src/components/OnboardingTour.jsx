import React, { useEffect, useState } from "react";
import Joyride, { STATUS } from "react-joyride";

const COACH_STEPS = [
  {
    target: "[data-tour='hamburger']",
    title: "Welcome to HCA Chargers! 👋",
    content: "This is the menu button. Tap it to access team management, settings, and more.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='nav-today']",
    title: "Today's Plan",
    content: "The Today page shows the current practice plan for all events. You can navigate between dates and see the day type.",
  },
  {
    target: "[data-tour='nav-calendar']",
    title: "Practice Plans Calendar",
    content: "Use the Calendar to view, create, and update daily practice plans for the entire season.",
  },
  {
    target: "[data-tour='nav-logactivity']",
    title: "Log Activity",
    content: "Log throws, jumps, or runs for yourself or your athletes here. You can record distances, times, and notes.",
  },
  {
    target: "[data-tour='nav-athletes']",
    title: "Athletes",
    content: "View all athletes on your team, check their progress, and manage individual practice overrides.",
  },
  {
    target: "[data-tour='nav-videoreview']",
    title: "Feedback Hub",
    content: "Send coaching feedback, review athlete videos with AI analysis, and communicate directly with your athletes here.",
  },
  {
    target: "[data-tour='create-post']",
    title: "Create Announcements",
    content: "Use this button to create posts and announcements visible to your whole team. You can drag it anywhere on the screen!",
  },
];

const ATHLETE_STEPS = [
  {
    target: "[data-tour='hamburger']",
    title: "Welcome to HCA Chargers! 👋",
    content: "This is the menu button. Tap it to access your settings, privacy policy, and more.",
    disableBeacon: true,
  },
  {
    target: "[data-tour='nav-today']",
    title: "Today's Plan",
    content: "This is your home base — see today's practice plan for your events and any personal overrides from your coach.",
  },
  {
    target: "[data-tour='nav-logactivity']",
    title: "Log Your Activity",
    content: "After practice or a meet, log your throws, jumps, or times here to track your progress over the season.",
  },
  {
    target: "[data-tour='nav-progress']",
    title: "Your Progress",
    content: "View charts and history of your personal bests and improvements across all your events.",
  },
  {
    target: "[data-tour='nav-videoreview']",
    title: "Feedback Hub",
    content: "Check here for coaching feedback on your technique, video analysis, and messages from your coach.",
  },
  {
    target: "[data-tour='nav-calendar']",
    title: "Calendar",
    content: "See the full season schedule, upcoming meets, and practice plans for any day.",
  },
];

const STORAGE_KEY = "onboarding_tour_completed";

export default function OnboardingTour({ userRole, userId, run, onFinish }) {
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    const isCoach = userRole === "admin" || userRole === "coach";
    setSteps(isCoach ? COACH_STEPS : ATHLETE_STEPS);
  }, [userRole]);

  const handleCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (userId) localStorage.setItem(`${STORAGE_KEY}_${userId}`, "true");
      onFinish?.();
    }
  };

  if (!steps.length) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#551e1b",
          zIndex: 10000,
          arrowColor: "#fff",
          backgroundColor: "#fff",
          textColor: "#1a1a1a",
        },
        buttonNext: {
          backgroundColor: "#551e1b",
          color: "#fff",
          borderRadius: "8px",
          padding: "8px 18px",
          fontWeight: 600,
        },
        buttonBack: {
          color: "#551e1b",
          fontWeight: 600,
        },
        buttonSkip: {
          color: "#888",
        },
        tooltip: {
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        },
        tooltipTitle: {
          fontWeight: 700,
          fontSize: "16px",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}

export function shouldShowTour(userId) {
  return !localStorage.getItem(`${STORAGE_KEY}_${userId}`);
}

export function resetTour(userId) {
  localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
}