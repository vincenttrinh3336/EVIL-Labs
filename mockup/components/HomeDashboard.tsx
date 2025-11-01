import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Slider, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/ui";
import { Home, Video, Heart, Bell, Utensils, Clock, BarChart3, Wifi, Settings } from "lucide-react";

interface HomeDashboardProps {
  onNavigate: (screen: string) => void;
}

export function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [portion, setPortion] = useState([50]);
  const [activeTab, setActiveTab] = useState("home");

  const stats = [
    { icon: Utensils, label: "Last Feeding", value: "2h ago", color: "#FFB74D" },
    { icon: Clock, label: "Next Scheduled", value: "6:00 PM", color: "#5C6BC0" },
    { icon: BarChart3, label: "Food Remaining", value: "65%", color: "#81C784" },
    { icon: Wifi, label: "Feeder Status", value: "Online", color: "#64B5F6" },
  ];

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "live", icon: Video, label: "Live" },
    { id: "pets", icon: Heart, label: "Pets" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (id === "live") onNavigate("live");
    if (id === "pets") onNavigate("pets");
    if (id === "notifications") onNavigate("notifications");
  };

  const handleFeedNow = () => {
    setShowFeedDialog(false);
    // Animation feedback
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5C6BC0] to-[#7986CB] pt-12 pb-6 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-white mb-1">Hi, Welcome Back! 👋</h2>
            <p className="text-white/80">Luna's feeder is ready 🐕</p>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("settings")}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Live Feed Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="-mt-8 mb-6"
        >
          <Card className="overflow-hidden shadow-lg rounded-3xl border-0">
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src="https://images.unsplash.com/photo-1597105888983-ae503ec1ef3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZWF0aW5nfGVufDF8fHx8MTc2MDIzNTM5NXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Live feed"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm">LIVE</span>
              </div>
              <button
                onClick={() => onNavigate("live")}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="bg-white/90 rounded-full p-4">
                  <Video className="w-8 h-8 text-[#5C6BC0]" />
                </div>
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-4 rounded-2xl border-0 shadow-md hover:shadow-lg transition-shadow">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <p className="text-muted-foreground mb-1 text-sm">{stat.label}</p>
                  <p className="font-medium">{stat.value}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Card className="p-4 rounded-2xl border-0 shadow-md flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">Schedule Next Meal</p>
                <p className="text-muted-foreground text-sm">Set a custom feeding time</p>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-[#5C6BC0] text-[#5C6BC0]"
              >
                Schedule
              </Button>
            </Card>

            <Card className="p-4 rounded-2xl border-0 shadow-md flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">View Analytics</p>
                <p className="text-muted-foreground text-sm">Check feeding patterns</p>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-[#FFB74D] text-[#FFB74D]"
                onClick={() => onNavigate("analytics")}
              >
                View
              </Button>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Floating Feed Button */}
      <motion.div
        className="absolute bottom-24 right-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFeedDialog(true)}
          className="bg-[#FFB74D] hover:bg-[#FFB74D]/90 text-white rounded-full p-5 shadow-2xl"
        >
          <Utensils className="w-7 h-7" />
        </motion.button>
      </motion.div>

      {/* Feed Dialog */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Feed Now</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-muted-foreground mb-6">Select portion size</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-muted-foreground">Portion</span>
                  <span className="font-medium">{portion[0]}g</span>
                </div>
                <Slider
                  value={portion}
                  onValueChange={setPortion}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleFeedNow}
                className="w-full bg-[#5C6BC0] hover:bg-[#5C6BC0]/90 rounded-full h-12"
              >
                Dispense Food
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "text-[#5C6BC0]" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-[#5C6BC0]" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#5C6BC0] rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
