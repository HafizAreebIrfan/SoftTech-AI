import { create } from "zustand";
import { PatientAppointment, MedicalRecord, HealthProvider } from "../../types/health";

interface HealthState {
  perspective: 'subscriber' | 'provider';
  appointments: PatientAppointment[];
  records: MedicalRecord[];
  providers: HealthProvider[];
  appointmentModalOpen: boolean;

  setPerspective: (val: 'subscriber' | 'provider') => void;
  openAppointmentModal: () => void;
  closeAppointmentModal: () => void;

  bookAppointment: (patientName: string, doctorName: string, specialty: string, date: string, time: string) => void;
  updateAppointmentStatus: (id: string, status: PatientAppointment['status']) => void;
  toggleProviderAvailability: (id: string) => void;
  resetStore: () => void;
}

const INITIAL_APPOINTMENTS: PatientAppointment[] = [
  { id: "apt_1", patientName: "Sarah Connor", doctorName: "Dr. Stephen Strange", specialty: "Neurology", date: "2026-07-22", time: "10:30 AM", status: "Scheduled" },
  { id: "apt_2", patientName: "Arthur Dent", doctorName: "Dr. Gregory House", specialty: "Internal Medicine", date: "2026-07-21", time: "02:15 PM", status: "Scheduled" },
  { id: "apt_3", patientName: "Diana Prince", doctorName: "Dr. Leonard McCoy", specialty: "Cardiology", date: "2026-07-18", time: "09:00 AM", status: "Completed" }
];

const INITIAL_RECORDS: MedicalRecord[] = [
  { id: "rec_1", patientName: "Sarah Connor", condition: "Acute Migraine Telemetry", prescriptions: ["Sumatriptan 50mg", "Electrolyte Solution"], lastVisited: "2026-07-10" },
  { id: "rec_2", patientName: "Arthur Dent", condition: "Chronic Anxiety & Stress", prescriptions: ["Cetirizine 10mg"], lastVisited: "2026-06-28" }
];

const INITIAL_PROVIDERS: HealthProvider[] = [
  { id: "prv_1", name: "Dr. Stephen Strange", specialty: "Neurology", rating: 4.9, available: true },
  { id: "prv_2", name: "Dr. Gregory House", specialty: "Diagnostics", rating: 4.8, available: true },
  { id: "prv_3", name: "Dr. Leonard McCoy", specialty: "General Practice", rating: 4.7, available: false }
];

export const useHealthStore = create<HealthState>((set, get) => ({
  perspective: 'subscriber',
  appointments: INITIAL_APPOINTMENTS,
  records: INITIAL_RECORDS,
  providers: INITIAL_PROVIDERS,
  appointmentModalOpen: false,

  setPerspective: (val) => set({ perspective: val }),
  openAppointmentModal: () => set({ appointmentModalOpen: true }),
  closeAppointmentModal: () => set({ appointmentModalOpen: false }),

  bookAppointment: (patientName, doctorName, specialty, date, time) => {
    const { appointments } = get();
    const newApt: PatientAppointment = {
      id: `apt_${Date.now()}`,
      patientName,
      doctorName,
      specialty,
      date,
      time,
      status: "Scheduled"
    };
    set({
      appointments: [newApt, ...appointments],
      appointmentModalOpen: false
    });
  },

  updateAppointmentStatus: (id, status) => {
    const { appointments } = get();
    set({
      appointments: appointments.map((a) => a.id === id ? { ...a, status } : a)
    });
  },

  toggleProviderAvailability: (id) => {
    const { providers } = get();
    set({
      providers: providers.map((p) => p.id === id ? { ...p, available: !p.available } : p)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    appointments: INITIAL_APPOINTMENTS,
    records: INITIAL_RECORDS,
    providers: INITIAL_PROVIDERS,
    appointmentModalOpen: false
  })
}));
