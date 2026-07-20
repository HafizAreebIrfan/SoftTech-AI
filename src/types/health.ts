export interface PatientAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface MedicalRecord {
  id: string;
  patientName: string;
  condition: string;
  prescriptions: string[];
  lastVisited: string;
}

export interface HealthProvider {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  available: boolean;
}
