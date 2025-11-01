import { motion } from "framer-motion";
import { Card, Switch } from "@/lib/ui";
import { ArrowLeft, Wifi, Bell, Moon, Globe, HelpCircle, Mail, Shield, ChevronRight } from "lucide-react";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5C6BC0] to-[#7986CB] pt-12 pb-8 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          <h2 className="text-white">Settings</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Device Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="mb-4">Device Settings</h3>
          <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5C6BC0]/10 rounded-full flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-[#5C6BC0]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Wi-Fi Connection</p>
                  <p className="text-muted-foreground text-sm">Home Network</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFB74D]/10 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#FFB74D]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Firmware Update</p>
                  <p className="text-muted-foreground text-sm">Version 2.4.0</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#81C784]/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#81C784]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground text-sm">Living Room</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </motion.div>

        {/* App Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-4">App Preferences</h3>
          <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5C6BC0]/10 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#5C6BC0]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-muted-foreground text-sm">Get feeding alerts</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="border-t border-border" />

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#64B5F6]/10 rounded-full flex items-center justify-center">
                  <Moon className="w-5 h-5 text-[#64B5F6]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-muted-foreground text-sm">Use system theme</p>
                </div>
              </div>
              <Switch />
            </div>

            <div className="border-t border-border" />

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFB74D]/10 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#FFB74D]" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Units</p>
                  <p className="text-muted-foreground text-sm">Grams (g)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </motion.div>

        {/* Support & About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4">Support & About</h3>
          <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5C6BC0]/10 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#5C6BC0]" />
                </div>
                <p className="font-medium">Help Center</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#81C784]/10 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#81C784]" />
                </div>
                <p className="font-medium">Contact Support</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFB74D]/10 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#FFB74D]" />
                </div>
                <p className="font-medium">Privacy Policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Smart Pet Feeder</p>
                  <p className="text-muted-foreground text-sm">Version 1.0.0</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-6"
        >
          <button className="w-full p-4 bg-destructive/10 text-destructive rounded-2xl font-medium hover:bg-destructive/20 transition-colors">
            Log Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
