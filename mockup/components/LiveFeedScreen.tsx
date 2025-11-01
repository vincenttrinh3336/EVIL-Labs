import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Badge } from "@/lib/ui";
import { ArrowLeft, Video, Camera, Volume2, VolumeX, Radio } from "lucide-react";

interface LiveFeedScreenProps {
  onBack: () => void;
}

export function LiveFeedScreen({ onBack }: LiveFeedScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Video Feed */}
      <div className="flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1597105888983-ae503ec1ef3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZWF0aW5nfGVufDF8fHx8MTc2MDIzNTM5NXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Live feed"
          className="w-full h-full object-cover"
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.button>

            <Badge className="bg-red-500 text-white px-4 py-2 rounded-full border-0 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </Badge>

            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Detection Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-6 right-6"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#5C6BC0] rounded-full flex items-center justify-center">
                <span className="text-2xl">🐕</span>
              </div>
              <div>
                <p className="font-medium">Detected: Luna</p>
                <p className="text-muted-foreground text-sm">RFID Tag: #A4F2B8</p>
              </div>
              <motion.div
                className="ml-auto"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <div className="flex justify-center items-center gap-6">
            {/* Record Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRecording(!isRecording)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? "bg-red-500"
                  : "bg-white/20 backdrop-blur-sm"
              }`}
            >
              <Video className="w-6 h-6 text-white" />
            </motion.button>

            {/* Snapshot Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl"
            >
              <Camera className="w-7 h-7 text-[#5C6BC0]" />
            </motion.button>

            {/* Mute Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMuted(!isMuted)}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </motion.button>
          </div>

          {/* Info Bar */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-white/80 text-sm">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </motion.div>
              )}
            </div>
            <div className="text-white/80 text-sm">
              Quality: HD 1080p
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card p-6 rounded-t-3xl"
      >
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="rounded-2xl h-auto py-4 flex flex-col gap-2 border-border"
          >
            <Camera className="w-6 h-6 text-[#5C6BC0]" />
            <span className="text-sm">Take Photo</span>
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl h-auto py-4 flex flex-col gap-2 border-border"
          >
            <Video className="w-6 h-6 text-[#FFB74D]" />
            <span className="text-sm">Start Recording</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
