import React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Dimensions 
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { 
  LineChart, 
  BarChart, 
  PieChart 
} from "react-native-chart-kit";
import { 
  ArrowLeft, 
  TrendingUp, 
  Download, 
  Calendar 
} from "lucide-react-native";

const screenWidth = Dimensions.get("window").width;

const weeklyData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    { data: [240, 250, 235, 255, 245, 260, 248], color: () => "#5C6BC0" }, // Luna
    { data: [120, 130, 125, 135, 128, 140, 132], color: () => "#FFB74D" }  // Charlie
  ],
  legend: ["Luna", "Charlie"]
};

const timeDistribution = [
  { name: "Morning", population: 35, color: "#FFB74D", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  { name: "Midday", population: 20, color: "#5C6BC0", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  { name: "Evening", population: 40, color: "#81C784", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  { name: "Night", population: 5, color: "#64B5F6", legendFontColor: "#7F7F7F", legendFontSize: 12 },
];

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(92, 107, 192, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#5C6BC0" }
};

export function AnalyticsTestScreen({ 
  onBack, 
  onNavigate // Add this prop
}: { 
  onBack: () => void, 
  onNavigate: (screen: string) => void 
}) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analytics</Text>
            <TouchableOpacity style={styles.iconBtn}>
              <Calendar size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats Grid */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={styles.statsRow}>
          {[
            { val: "14", label: "Total Meals", color: "#5C6BC0" },
            { val: "2.8kg", label: "Food Used", color: "#FFB74D" },
            { val: "98%", label: "On Time", color: "#81C784" }
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.val}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </MotiView>

        {/* Bar Chart Section */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 100 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Feeding</Text>
            <TrendingUp size={20} color="#81C784" />
          </View>
          <View style={styles.chartCard}>
            <BarChart
              data={weeklyData}
              width={screenWidth - 80}
              height={220}
              yAxisLabel=""
              yAxisSuffix="g"
              chartConfig={{...chartConfig, color: () => "#5C6BC0"}}
              verticalLabelRotation={0}
              fromZero
              style={styles.chart}
            />
          </View>
        </MotiView>

        {/* Pie Chart Section */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 200 }}>
          <Text style={styles.sectionTitle}>Time Distribution</Text>
          <View style={styles.chartCard}>
            <PieChart
              data={timeDistribution}
              width={screenWidth - 48}
              height={180}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
        </MotiView>

        {/* Line Chart Section */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 300 }}>
          <Text style={styles.sectionTitle}>30-Day Trend</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={weeklyData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </MotiView>

        {/* Export Button */}
        <TouchableOpacity 
          style={styles.exportBtn} 
        >
          <Download size={20} color="white" />
          <Text style={styles.exportBtnText}>Share Report (PDF)</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '31%', backgroundColor: 'white', padding: 16, borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  chartCard: { backgroundColor: 'white', borderRadius: 24, padding: 12, marginBottom: 24, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  chart: { marginVertical: 8, borderRadius: 16 },
  exportBtn: { backgroundColor: '#5C6BC0', borderRadius: 100, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  exportBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});