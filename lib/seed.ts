import { hashPassword } from "./password";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { Service } from "@/models/Service";
import { Appointment } from "@/models/Appointment";
import { Visit, computeBilling } from "@/models/Visit";
import { Setting, SETTINGS_ID } from "@/models/Setting";
import { nextSeq, formatCode } from "@/models/Counter";

function daysFromNow(n: number, hour = 10, min = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, min, 0, 0);
  return d;
}

/**
 * Populate the database with demo accounts and sample records the first time
 * it's empty. Safe to call repeatedly — it no-ops if any user already exists.
 */
export async function ensureSeeded(): Promise<void> {
  const existing = await User.countDocuments();
  if (existing > 0) return;

  // eslint-disable-next-line no-console
  console.log("🌱 Clinically: seeding demo data…");

  // --- Clinic settings ---
  await Setting.create({
    _id: SETTINGS_ID,
    clinicName: process.env.NEXT_PUBLIC_CLINIC_NAME || "Clinically",
    tagline: "Your health, our priority",
    address: "24 Wellness Road, Springfield",
    phone: "+1 555 0100",
    email: "care@clinically.test",
    taxRatePercent: 0,
    invoiceFooter: "Thank you for choosing us. Wishing you good health!",
  });

  // --- Users ---
  const [adminPw, drPw, drPw2, recPw] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("doctor123"),
    hashPassword("doctor123"),
    hashPassword("reception123"),
  ]);

  const admin = await User.create({
    name: "Dr. Admin",
    email: "admin@clinically.test",
    passwordHash: adminPw,
    role: "admin",
    phone: "+1 555 0100",
    specialization: "Clinic Director",
  });
  const drSarah = await User.create({
    name: "Dr. Sarah Khan",
    email: "doctor@clinically.test",
    passwordHash: drPw,
    role: "doctor",
    phone: "+1 555 0111",
    specialization: "General Medicine",
  });
  const drRaj = await User.create({
    name: "Dr. Raj Mehta",
    email: "raj@clinically.test",
    passwordHash: drPw2,
    role: "doctor",
    phone: "+1 555 0122",
    specialization: "Pediatrics",
  });
  await User.create({
    name: "Front Desk",
    email: "reception@clinically.test",
    passwordHash: recPw,
    role: "receptionist",
    phone: "+1 555 0133",
  });

  // --- Services ---
  const serviceDefs = [
    { name: "General Consultation", category: "Consultation", price: 500, durationMins: 20 },
    { name: "Follow-up Consultation", category: "Consultation", price: 300, durationMins: 15 },
    { name: "Specialist Consultation", category: "Consultation", price: 900, durationMins: 30 },
    { name: "Complete Blood Count (CBC)", category: "Lab", price: 350, durationMins: 10 },
    { name: "Lipid Profile", category: "Lab", price: 600, durationMins: 10 },
    { name: "Blood Sugar (Fasting)", category: "Lab", price: 150, durationMins: 5 },
    { name: "ECG", category: "Diagnostics", price: 450, durationMins: 15 },
    { name: "X-Ray (Chest)", category: "Diagnostics", price: 700, durationMins: 15 },
    { name: "Dressing & Wound Care", category: "Procedure", price: 250, durationMins: 20 },
    { name: "Nebulization", category: "Procedure", price: 200, durationMins: 15 },
    { name: "Vaccination", category: "Procedure", price: 800, durationMins: 10 },
    { name: "Physiotherapy Session", category: "Therapy", price: 400, durationMins: 45 },
  ];
  const services = await Service.insertMany(serviceDefs);
  const svc = (name: string) => services.find((s) => s.name === name)!;

  // --- Patients ---
  async function makePatient(data: Record<string, unknown>) {
    const code = formatCode("P", await nextSeq("patient"));
    return Patient.create({ ...data, code, createdBy: admin._id });
  }

  const p1 = await makePatient({
    name: "Aisha Verma",
    dob: new Date("1989-03-14"),
    gender: "female",
    phone: "+1 555 2001",
    email: "aisha@example.com",
    address: "12 Maple Street, Springfield",
    bloodGroup: "B+",
    allergies: ["Penicillin"],
    chronicConditions: ["Hypertension"],
    emergencyContact: { name: "Rohan Verma", phone: "+1 555 2002", relation: "Spouse" },
    occupation: "Schoolteacher",
    maritalStatus: "married",
    insuranceProvider: "BlueShield Health",
    insuranceNumber: "BS-4471902",
    referredBy: "Dr. Mehta",
  });
  const p2 = await makePatient({
    name: "John Carter",
    dob: new Date("1976-11-02"),
    gender: "male",
    phone: "+1 555 2010",
    email: "john.carter@example.com",
    address: "88 Oak Avenue, Springfield",
    bloodGroup: "O+",
    chronicConditions: ["Type 2 Diabetes"],
    occupation: "Accountant",
    maritalStatus: "married",
    insuranceProvider: "Acme Care",
    insuranceNumber: "AC-208841",
  });
  const p3 = await makePatient({
    name: "Liam Nguyen",
    dob: new Date("2018-06-21"),
    gender: "male",
    phone: "+1 555 2020",
    bloodGroup: "A+",
    emergencyContact: { name: "Mai Nguyen", phone: "+1 555 2021", relation: "Mother" },
  });
  const p4 = await makePatient({
    name: "Sofia Rossi",
    dob: new Date("1995-09-30"),
    gender: "female",
    phone: "+1 555 2030",
    email: "sofia.r@example.com",
    bloodGroup: "AB-",
    allergies: ["Sulfa drugs", "Peanuts"],
  });
  await makePatient({
    name: "Marcus Lee",
    dob: new Date("1962-01-19"),
    gender: "male",
    phone: "+1 555 2040",
    bloodGroup: "O-",
    chronicConditions: ["Asthma", "Hypertension"],
  });

  // --- Helper to create a completed visit with billing ---
  async function makeVisit(opts: {
    patient: typeof p1;
    doctor: typeof drSarah;
    date: Date;
    chiefComplaint: string;
    diagnosis: string;
    vitals: Record<string, unknown>;
    serviceNames: string[];
    prescriptions: Record<string, string>[];
    discount?: number;
    paidRatio: number; // 0..1
    method?: "cash" | "card" | "upi" | "insurance";
    followUpInDays?: number;
  }) {
    const invoiceNo = formatCode("INV", await nextSeq("invoice"), 5);
    const lines = opts.serviceNames.map((n) => {
      const s = svc(n);
      return { service: s._id, name: s.name, price: s.price, qty: 1 };
    });
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const billing = computeBilling({
      services: lines,
      discount: opts.discount || 0,
      paid: Math.round((subtotal - (opts.discount || 0)) * opts.paidRatio),
      method: opts.method,
    });
    return Visit.create({
      invoiceNo,
      patient: opts.patient._id,
      doctor: opts.doctor._id,
      date: opts.date,
      chiefComplaint: opts.chiefComplaint,
      diagnosis: opts.diagnosis,
      vitals: opts.vitals,
      services: lines,
      prescriptions: opts.prescriptions,
      followUpDate: opts.followUpInDays
        ? daysFromNow(opts.followUpInDays)
        : undefined,
      billing,
      createdBy: opts.doctor._id,
    });
  }

  await makeVisit({
    patient: p1,
    doctor: drSarah,
    date: daysFromNow(-40),
    chiefComplaint: "Headache and elevated blood pressure",
    diagnosis: "Essential hypertension, sub-optimally controlled",
    vitals: { bp: "150/95", pulse: 82, tempC: 36.8, weightKg: 68, heightCm: 165, spo2: 98 },
    serviceNames: ["General Consultation", "ECG"],
    prescriptions: [
      { drug: "Amlodipine 5mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", instructions: "Take in the morning" },
    ],
    paidRatio: 1,
    method: "card",
    followUpInDays: -10,
  });
  await makeVisit({
    patient: p1,
    doctor: drSarah,
    date: daysFromNow(-8),
    chiefComplaint: "Follow-up for blood pressure",
    diagnosis: "Hypertension — improving on medication",
    vitals: { bp: "132/86", pulse: 76, tempC: 36.6, weightKg: 67, heightCm: 165, spo2: 99 },
    serviceNames: ["Follow-up Consultation", "Lipid Profile"],
    prescriptions: [
      { drug: "Amlodipine 5mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" },
    ],
    paidRatio: 0.5,
    method: "upi",
    followUpInDays: 22,
  });
  await makeVisit({
    patient: p2,
    doctor: drSarah,
    date: daysFromNow(-15),
    chiefComplaint: "Routine diabetes review, fatigue",
    diagnosis: "Type 2 Diabetes Mellitus",
    vitals: { bp: "128/82", pulse: 78, tempC: 36.7, weightKg: 84, heightCm: 178, spo2: 97 },
    serviceNames: ["General Consultation", "Blood Sugar (Fasting)", "Complete Blood Count (CBC)"],
    prescriptions: [
      { drug: "Metformin 500mg", dosage: "1 tablet", frequency: "Twice daily", duration: "60 days", instructions: "After meals" },
    ],
    paidRatio: 0,
    followUpInDays: 30,
  });
  await makeVisit({
    patient: p3,
    doctor: drRaj,
    date: daysFromNow(-3),
    chiefComplaint: "Cough, cold and mild fever",
    diagnosis: "Acute viral upper respiratory infection",
    vitals: { bp: "100/70", pulse: 102, tempC: 38.1, weightKg: 22, heightCm: 118, spo2: 98 },
    serviceNames: ["Specialist Consultation", "Nebulization"],
    prescriptions: [
      { drug: "Paracetamol syrup", dosage: "5 ml", frequency: "Every 6 hours if fever", duration: "3 days" },
    ],
    paidRatio: 1,
    method: "cash",
  });
  await makeVisit({
    patient: p4,
    doctor: drSarah,
    date: daysFromNow(-1),
    chiefComplaint: "Annual health check",
    diagnosis: "Healthy — routine screening",
    vitals: { bp: "118/76", pulse: 70, tempC: 36.6, weightKg: 60, heightCm: 168, spo2: 99 },
    serviceNames: ["General Consultation", "Lipid Profile", "Complete Blood Count (CBC)"],
    prescriptions: [],
    discount: 100,
    paidRatio: 1,
    method: "card",
  });

  // --- Upcoming appointments ---
  await Appointment.insertMany([
    { patient: p1._id, doctor: drSarah._id, scheduledAt: daysFromNow(0, 11, 30), reason: "BP follow-up", status: "scheduled", createdBy: admin._id },
    { patient: p2._id, doctor: drSarah._id, scheduledAt: daysFromNow(0, 15, 0), reason: "Diabetes review", status: "scheduled", createdBy: admin._id },
    { patient: p3._id, doctor: drRaj._id, scheduledAt: daysFromNow(1, 10, 0), reason: "Cough review", status: "scheduled", createdBy: admin._id },
    { patient: p4._id, doctor: drSarah._id, scheduledAt: daysFromNow(2, 9, 30), reason: "Report discussion", status: "scheduled", createdBy: admin._id },
  ]);

  // eslint-disable-next-line no-console
  console.log("✅ Clinically: demo data ready.");
}
