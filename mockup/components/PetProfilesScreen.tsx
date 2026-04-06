import React, { useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions, 
  Modal,
  SafeAreaView
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Plus, Clock, TrendingUp, Weight, Edit, X } from "lucide-react-native";
// Note: For a real chart, import { VictoryLine, VictoryChart, VictoryTheme } from "victory-native";

const { width } = Dimensions.get("window");

const pets = [
  {
    id: 1,
    name: "Luna",
    tagId: "#A4F2B8",
    image: "https://images.unsplash.com/photo-1734966213753-1b361564bab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAyMzUzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    weight: "25 kg",
    foodType: "Premium Dry Food",
    emoji: "🐕"
  },
  {
    id: 2,
    name: "Charlie",
    tagId: "#C8D5E9",
    image: "https://images.unsplash.com/photo-1556977882-e768c8e30866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAyMzUzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    weight: "4.5 kg",
    foodType: "Wet Food Mix",
    emoji: "🐱"
  },
];

export function PetProfilesScreen({ onBack }: { onBack: () => void }) {
  const [selectedPet, setSelectedPet] = useState<typeof pets[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pet Profiles</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.grid}>
          {pets.map((pet, index) => (
            <MotiView
              key={pet.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 100 }}
              style={styles.cardWrapper}
            >
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setSelectedPet(pet)}
                style={styles.petCard}
              >
                <Image source={{ uri: pet.image }} style={styles.petImage} />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.cardGradient} />
                <View style={styles.cardInfo}>
                  <Text style={styles.petNameText}>{pet.name}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{pet.tagId}</Text>
                  </View>
                </View>
                <Text style={styles.emojiOverlay}>{pet.emoji}</Text>
              </TouchableOpacity>
            </MotiView>
          ))}

          {/* Add Pet Button */}
          <TouchableOpacity 
            style={styles.addCard} 
            onPress={() => setShowAddModal(true)}
          >
            <View style={styles.plusCircle}>
              <Plus size={32} color="white" />
            </View>
            <Text style={styles.addText}>Add Pet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pet Detail Modal */}
      <Modal visible={!!selectedPet} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPet && (
              <>
                <View style={styles.modalHeader}>
                  <Image source={{ uri: selectedPet.image }} style={styles.modalAvatar} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.modalTitle}>{selectedPet.name}</Text>
                    <Text style={styles.modalSub}>{selectedPet.tagId}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPet(null)} style={styles.closeBtn}>
                    <X size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.statRow}>
                  <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
                    <Weight size={24} color="#FFB74D" />
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>{selectedPet.weight}</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                    <Clock size={24} color="#81C784" />
                    <Text style={styles.statLabel}>Food Type</Text>
                    <Text style={styles.statValue} numberOfLines={1}>{selectedPet.foodType}</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Feeding History</Text>
                <View style={styles.chartPlaceholder}>
                   {/* Replace this with VictoryLine Chart */}
                   <TrendingUp size={48} color="#5C6BC0" opacity={0.2} />
                   <Text style={{color: '#999', marginTop: 8}}>Chart Data Visualization</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.btnText}>Edit Schedule</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: -30 },
  cardWrapper: { width: '48%', marginBottom: 16 },
  petCard: { height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: 'white', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  petImage: { width: '100%', height: '100%' },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  cardInfo: { position: 'absolute', bottom: 12, left: 12 },
  petNameText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  tagBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  tagText: { color: 'white', fontSize: 10 },
  emojiOverlay: { position: 'absolute', top: 12, right: 12, fontSize: 24 },
  addCard: { width: '48%', height: 180, borderRadius: 24, borderWidth: 2, borderColor: '#5C6BC0', borderStyle: 'dashed', backgroundColor: 'rgba(92, 107, 192, 0.05)', justifyContent: 'center', alignItems: 'center' },
  plusCircle: { width: 56, height: 56, backgroundColor: '#5C6BC0', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  addText: { color: '#5C6BC0', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  modalAvatar: { width: 64, height: 64, borderRadius: 32 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  modalSub: { color: '#5C6BC0', fontWeight: '500' },
  closeBtn: { padding: 8 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 20 },
  statLabel: { color: '#666', fontSize: 12, marginTop: 8 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  chartPlaceholder: { height: 180, backgroundColor: '#F5F5F5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  modalActions: { marginTop: 'auto', paddingBottom: 20 },
  primaryBtn: { backgroundColor: '#5C6BC0', padding: 18, borderRadius: 100, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});