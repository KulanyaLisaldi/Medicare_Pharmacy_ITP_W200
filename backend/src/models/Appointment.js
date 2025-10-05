import mongoose from "mongoose";

// Schema for time slots
const timeSlotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true },
  time: { type: String, required: true }, // HH:mm format
  isBooked: { type: Boolean, default: false },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null }
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  appointmentNo: { type: String, unique: true, required: true },

  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  title: { type: String, default: "Consultation" },
  specialization: { type: String, default: "" },
  location: { type: String, default: "" },

  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },   // HH:mm

  capacity: { type: Number, default: 10 },
  bookedCount: { type: Number, default: 0 },

  price: { type: Number, default: 0 },
  paymentType: { 
    type: String, 
    enum: ["online", "cash"], 
    default: "online" 
  },

  mode: { 
    type: String, 
    enum: ["physical", "video", "audio"], 
    default: "physical" 
  },

  notes: { type: String, default: "" },
  isActive: { type: Boolean, default: true },

  // Reschedule fields
  rescheduleReason: { type: String, default: "" },
  rescheduledAt: { type: Date, default: null },

  // Slots
  timeSlots: [timeSlotSchema],
  slotDuration: { type: Number, default: 10 }, // mins per slot

  // Appointment status
  status: { 
    type: String, 
    enum: ["scheduled", "active", "fully_booked", "completed", "cancelled"], 
    default: "scheduled" 
  }
}, {
  timestamps: true
});


// 🔹 Auto-generate appointment number
appointmentSchema.pre("validate", function(next) {
  if (!this.appointmentNo) {
    const random = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
    const ymd = new Date().toISOString().slice(0,10).replace(/-/g, "");
    this.appointmentNo = `APPT-${ymd}-${random}`;
  }
  next();
});


// 🔹 Virtual: check if fully booked
appointmentSchema.virtual("isFull").get(function() {
  return this.bookedCount >= this.capacity;
});


// 🔹 Method: Generate Time Slots
appointmentSchema.methods.generateTimeSlots = function() {
  const slots = [];
  const [startHour, startMin] = this.startTime.split(":").map(Number);
  const [endHour, endMin] = this.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const totalDuration = endMinutes - startMinutes;

  const maxSlots = Math.floor(totalDuration / this.slotDuration);
  const actualSlots = Math.min(this.capacity, maxSlots);

  for (let i = 0; i < actualSlots; i++) {
    const slotMinutes = startMinutes + (i * this.slotDuration);
    const slotHour = Math.floor(slotMinutes / 60);
    const slotMin = slotMinutes % 60;
    const timeString = `${slotHour.toString().padStart(2, "0")}:${slotMin.toString().padStart(2, "0")}`;

    slots.push({
      slotNumber: i + 1,
      time: timeString,
      isBooked: false,
      patientId: null
    });
  }

  this.timeSlots = slots;
  return slots;
};


// 🔹 Method: Get next available slot
appointmentSchema.methods.getNextAvailableSlot = function() {
  return this.timeSlots.find(slot => !slot.isBooked) || null;
};


// 🔹 Method: Book a specific slot
appointmentSchema.methods.bookSlot = function(slotNumber, bookingId) {
  const slot = this.timeSlots.find(s => s.slotNumber === slotNumber);
  if (slot && !slot.isBooked) {
    slot.isBooked = true;
    slot.patientId = bookingId;
    this.bookedCount += 1;

    // Update appointment status
    if (this.bookedCount >= this.capacity) {
      this.status = "fully_booked";
    } else if (this.status === "scheduled") {
      this.status = "active";
    }
    return slot;
  }
  return null;
};

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
