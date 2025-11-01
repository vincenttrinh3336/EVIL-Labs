import { motion } from "framer-motion";
import { Card } from "@/lib/ui";

import { ArrowLeft, Bell, AlertCircle, CheckCircle, Info, Trash2 } from "lucide-react";

interface NotificationsScreenProps {
  onBack: () => void;
}

const notifications = [
  {
    id: 1,
    type: "success",
    icon: CheckCircle,
    title: "Luna has eaten",
    message: "Your pet completed their meal at 2:45 PM",
    time: "2h ago",
    color: "#81C784",
    unread: true,
  },
  {
    id: 2,
    type: "warning",
    icon: AlertCircle,
    title: "Food reservoir low",
    message: "Only 10% food remaining. Please refill soon.",
    time: "5h ago",
    color: "#FFB74D",
    unread: true,
  },
  {
    id: 3,
    type: "info",
    icon: Info,
    title: "Software update available",
    message: "Version 2.4.1 is ready to install",
    time: "1d ago",
    color: "#64B5F6",
    unread: false,
  },
  {
    id: 4,
    type: "success",
    icon: CheckCircle,
    title: "Charlie has eaten",
    message: "Your pet completed their meal at 8:30 AM",
    time: "1d ago",
    color: "#81C784",
    unread: false,
  },
  {
    id: 5,
    type: "info",
    icon: Bell,
    title: "Schedule reminder",
    message: "Next feeding scheduled for 6:00 PM today",
    time: "2d ago",
    color: "#5C6BC0",
    unread: false,
  },
];

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
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
          <h2 className="text-white">Notifications</h2>
          <button className="text-white text-sm">Clear All</button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Today Section */}
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">Today</p>
          <div className="space-y-3">
            {notifications.slice(0, 2).map((notification, index) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`rounded-2xl border-0 overflow-hidden ${
                      notification.unread ? "shadow-md" : "shadow-sm"
                    }`}
                  >
                    <motion.div
                      className="relative"
                      initial={false}
                      whileHover={{ x: -80 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="p-4 flex items-start gap-4 bg-card">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${notification.color}20` }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: notification.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium">{notification.title}</p>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-[#5C6BC0] rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {notification.message}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {notification.time}
                          </p>
                        </div>
                      </div>

                      {/* Swipe Action */}
                      <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Earlier Section */}
        <div>
          <p className="text-muted-foreground mb-4">Earlier</p>
          <div className="space-y-3">
            {notifications.slice(2).map((notification, index) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 2) * 0.1 }}
                >
                  <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
                    <motion.div
                      className="relative"
                      initial={false}
                      whileHover={{ x: -80 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="p-4 flex items-start gap-4 bg-card">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${notification.color}20` }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: notification.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium mb-1">{notification.title}</p>
                          <p className="text-muted-foreground text-sm mb-2">
                            {notification.message}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {notification.time}
                          </p>
                        </div>
                      </div>

                      {/* Swipe Action */}
                      <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State (shown when no notifications) - Hidden for now */}
      {notifications.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Bell className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No notifications</h3>
          <p className="text-muted-foreground text-center">
            You're all caught up! Check back later for updates.
          </p>
        </div>
      )}
    </div>
  );
}
