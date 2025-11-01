import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/lib/ui";
import { Clock, Video, TrendingUp, ChevronRight } from "lucide-react";

interface OnboardingScreensProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Clock,
    title: "Feed Smarter",
    description: "Automate feeding schedules and never miss a meal. Set custom portions and times for your pets.",
    color: "#5C6BC0",
  },
  {
    icon: Video,
    title: "Stay Connected",
    description: "Watch your pets eat with live video feed. Dispense food remotely with just a tap.",
    color: "#FFB74D",
  },
  {
    icon: TrendingUp,
    title: "Track Nutrition",
    description: "Monitor feeding patterns and track your pet's health with detailed analytics and history.",
    color: "#81C784",
  },
];

export function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-6">
        <button
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <motion.div
              className="mb-8 rounded-full p-8 shadow-lg"
              style={{ backgroundColor: slides[currentSlide].color }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {(() => {
                const Icon = slides[currentSlide].icon;
                return <Icon className="w-16 h-16 text-white" />;
              })()}
            </motion.div>

            {/* Content */}
            <h2 className="mb-4">{slides[currentSlide].title}</h2>
            <p className="text-muted-foreground max-w-sm">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mb-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="transition-all"
          >
            <div
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-[#5C6BC0]"
                  : "w-2 bg-muted"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Continue button */}
      <div className="p-6">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleNext}
            className="w-full bg-[#5C6BC0] hover:bg-[#5C6BC0]/90 rounded-full py-6"
          >
            {currentSlide < slides.length - 1 ? (
              <>
                Continue <ChevronRight className="ml-2 w-5 h-5" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
