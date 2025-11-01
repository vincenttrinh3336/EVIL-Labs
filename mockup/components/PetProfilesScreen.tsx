import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/lib/ui";
import { ArrowLeft, Plus, Clock, TrendingUp, Weight, Edit } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PetProfilesScreenProps {
  onBack: () => void;
}

const pets = [
  {
    id: 1,
    name: "Luna",
    type: "Dog",
    tagId: "#A4F2B8",
    image: "https://images.unsplash.com/photo-1734966213753-1b361564bab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAyMzUzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    weight: "25 kg",
    foodType: "Premium Dry Food",
    emoji: "🐕"
  },
  {
    id: 2,
    name: "Charlie",
    type: "Cat",
    tagId: "#C8D5E9",
    image: "https://images.unsplash.com/photo-1556977882-e768c8e30866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjAyMzUzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    weight: "4.5 kg",
    foodType: "Wet Food Mix",
    emoji: "🐱"
  },
];

const feedingData = [
  { day: "Mon", amount: 120 },
  { day: "Tue", amount: 135 },
  { day: "Wed", amount: 110 },
  { day: "Thu", amount: 145 },
  { day: "Fri", amount: 130 },
  { day: "Sat", amount: 125 },
  { day: "Sun", amount: 140 },
];

export function PetProfilesScreen({ onBack }: PetProfilesScreenProps) {
  const [selectedPet, setSelectedPet] = useState<typeof pets[0] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
          <h2 className="text-white">Pet Profiles</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Pet Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-4 -mt-6 mb-6">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPet(pet)}
            >
              <Card className="overflow-hidden rounded-3xl border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                <div className="aspect-square relative">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white mb-1">{pet.name}</h3>
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      {pet.tagId}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 text-3xl">
                    {pet.emoji}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Add New Pet Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddDialog(true)}
          >
            <Card className="aspect-square rounded-3xl border-2 border-dashed border-[#5C6BC0] bg-[#5C6BC0]/5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#5C6BC0]/10 transition-colors">
              <div className="w-16 h-16 bg-[#5C6BC0] rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <p className="text-[#5C6BC0]">Add Pet</p>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Pet Detail Dialog */}
      <AnimatePresence>
        {selectedPet && (
          <Dialog open={!!selectedPet} onOpenChange={() => setSelectedPet(null)}>
            <DialogContent className="rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img
                      src={selectedPet.image}
                      alt={selectedPet.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <DialogTitle>{selectedPet.name}</DialogTitle>
                    <Badge className="bg-[#5C6BC0]/10 text-[#5C6BC0] border-0 mt-1">
                      {selectedPet.tagId}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Edit className="w-5 h-5" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Pet Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 rounded-2xl border-0 bg-[#FFB74D]/10">
                    <Weight className="w-6 h-6 text-[#FFB74D] mb-2" />
                    <p className="text-muted-foreground text-sm mb-1">Weight</p>
                    <p className="font-medium">{selectedPet.weight}</p>
                  </Card>
                  <Card className="p-4 rounded-2xl border-0 bg-[#81C784]/10">
                    <Clock className="w-6 h-6 text-[#81C784] mb-2" />
                    <p className="text-muted-foreground text-sm mb-1">Food Type</p>
                    <p className="font-medium text-sm">{selectedPet.foodType}</p>
                  </Card>
                </div>

                {/* Feeding History Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3>Feeding History</h3>
                    <TrendingUp className="w-5 h-5 text-[#5C6BC0]" />
                  </div>
                  <Card className="p-4 rounded-2xl border-0 bg-background">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={feedingData}>
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
                          dataKey="amount"
                          stroke="#5C6BC0"
                          strokeWidth={3}
                          dot={{ fill: "#5C6BC0", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="mb-4">Feeding Schedule</h3>
                  <div className="space-y-3">
                    <Card className="p-4 rounded-2xl border-0 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Morning</p>
                        <p className="text-muted-foreground text-sm">8:00 AM • 100g</p>
                      </div>
                      <Badge className="bg-[#81C784] text-white border-0">Active</Badge>
                    </Card>
                    <Card className="p-4 rounded-2xl border-0 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Evening</p>
                        <p className="text-muted-foreground text-sm">6:00 PM • 100g</p>
                      </div>
                      <Badge className="bg-[#FFB74D] text-white border-0">Pending</Badge>
                    </Card>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-[#5C6BC0] hover:bg-[#5C6BC0]/90 rounded-full"
                  >
                    Edit Schedule
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-border"
                  >
                    View Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Add Pet Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#5C6BC0]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-12 h-12 text-[#5C6BC0]" />
              </div>
              <p className="text-muted-foreground mb-6">
                Scan your pet's RFID tag to add them to the system
              </p>
              <Button className="w-full bg-[#5C6BC0] hover:bg-[#5C6BC0]/90 rounded-full">
                Start Scanning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
