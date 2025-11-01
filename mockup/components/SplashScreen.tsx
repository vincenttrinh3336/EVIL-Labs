import { motion } from "framer-motion";
import { Button } from "@/lib/ui";

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="relative h-full bg-gradient-to-b from-[#5C6BC0] to-[#7986CB] overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Paw print background pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      {/* Logo Animation */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <div className="bg-white rounded-full p-8 shadow-2xl">
          <motion.div
            className="text-7xl"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1.5,
            }}
          >
            🍽️
          </motion.div>
        </div>
      </motion.div>

      {/* Food dropping animation */}
      <motion.div
        className="absolute text-4xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 100, opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
        style={{ top: "30%", left: "50%" }}
      >
        🦴
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center z-10"
      >
        <h1 className="text-white mb-2">Feed Smarter</h1>
        <p className="text-white/90 mb-8">
          Automate and monitor your pet's meals.
        </p>

        <motion.div
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={onGetStarted}
            className="bg-white text-[#5C6BC0] hover:bg-white/90 rounded-full px-8 py-6 shadow-lg"
          >
            Get Started
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom wave decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-white/10 rounded-t-[3rem]"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      />
    </div>
  );
}
