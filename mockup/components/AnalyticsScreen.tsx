import { motion } from "framer-motion";
import { Card, Button } from "@/lib/ui";
import { ArrowLeft, TrendingUp, Download, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsScreenProps {
  onBack: () => void;
}

const weeklyData = [
  { day: "Mon", Luna: 240, Charlie: 120 },
  { day: "Tue", Luna: 250, Charlie: 130 },
  { day: "Wed", Luna: 235, Charlie: 125 },
  { day: "Thu", Luna: 255, Charlie: 135 },
  { day: "Fri", Luna: 245, Charlie: 128 },
  { day: "Sat", Luna: 260, Charlie: 140 },
  { day: "Sun", Luna: 248, Charlie: 132 },
];

const timeDistribution = [
  { name: "Morning (6-10 AM)", value: 35, color: "#FFB74D" },
  { name: "Midday (10-2 PM)", value: 20, color: "#5C6BC0" },
  { name: "Evening (6-8 PM)", value: 40, color: "#81C784" },
  { name: "Night (8-10 PM)", value: 5, color: "#64B5F6" },
];

export function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
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
          <h2 className="text-white">Analytics</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Calendar className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="p-4 rounded-2xl border-0 shadow-md text-center">
            <div className="text-2xl font-medium text-[#5C6BC0] mb-1">14</div>
            <p className="text-muted-foreground text-xs">Total Meals</p>
          </Card>
          <Card className="p-4 rounded-2xl border-0 shadow-md text-center">
            <div className="text-2xl font-medium text-[#FFB74D] mb-1">2.8kg</div>
            <p className="text-muted-foreground text-xs">Food Used</p>
          </Card>
          <Card className="p-4 rounded-2xl border-0 shadow-md text-center">
            <div className="text-2xl font-medium text-[#81C784] mb-1">98%</div>
            <p className="text-muted-foreground text-xs">On Time</p>
          </Card>
        </motion.div>

        {/* Weekly Feeding Frequency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3>Weekly Feeding</h3>
            <TrendingUp className="w-5 h-5 text-[#81C784]" />
          </div>
          <Card className="p-4 rounded-2xl border-0 shadow-md">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="day"
                  stroke="#757575"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#757575" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Luna" fill="#5C6BC0" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Charlie" fill="#FFB74D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Feeding Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4">Most Active Feeding Times</h3>
          <Card className="p-4 rounded-2xl border-0 shadow-md">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={timeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {timeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-2 mt-4">
              {timeDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Consumption Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4">30-Day Consumption Trend</h3>
          <Card className="p-4 rounded-2xl border-0 shadow-md">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="day"
                  stroke="#757575"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#757575" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Luna"
                  stroke="#5C6BC0"
                  strokeWidth={3}
                  dot={{ fill: "#5C6BC0", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Charlie"
                  stroke="#FFB74D"
                  strokeWidth={3}
                  dot={{ fill: "#FFB74D", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Export Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-6"
        >
          <Button className="w-full bg-[#5C6BC0] hover:bg-[#5C6BC0]/90 rounded-full h-12 flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Share Feeding Report (PDF)
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
