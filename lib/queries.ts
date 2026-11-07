import { connectDB } from "./db";
import { serialize } from "./api";
import { Patient } from "@/models/Patient";
import { Visit } from "@/models/Visit";
import { Appointment } from "@/models/Appointment";
import { User } from "@/models/User";
import { Attachment } from "@/models/Attachment";
import type {
  AppointmentVM,
  AttachmentVM,
  DoctorRef,
  PatientVM,
  ServiceVM,
  VisitVM,
} from "./types";

function dayBounds(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getDashboardStats() {
  await connectDB();
  const { start, end } = dayBounds();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(start);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAhead = new Date(end);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const today = new Date();

  const [
    patientsCount,
    todaysAppointments,
    recentVisits,
    revenueTodayAgg,
    revenueMonthAgg,
    outstandingAgg,
    visitsTodayCount,
    revenue7dAgg,
    followUpsDueCount,
    birthdays,
  ] = await Promise.all([
    Patient.countDocuments({ active: true }),
    Appointment.find({ scheduledAt: { $gte: start, $lt: end } })
      .populate("patient", "name code phone")
      .populate("doctor", "name")
      .sort({ scheduledAt: 1 })
      .lean(),
    Visit.find()
      .populate("patient", "name code")
      .populate("doctor", "name")
      .sort({ date: -1 })
      .limit(6)
      .lean(),
    Visit.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$billing.paid" } } },
    ]),
    Visit.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$billing.paid" } } },
    ]),
    Visit.aggregate([
      { $group: { _id: null, total: { $sum: "$billing.balance" } } },
    ]),
    Visit.countDocuments({ date: { $gte: start, $lt: end } }),
    // Revenue collected per day for the last 7 days
    Visit.aggregate([
      { $match: { date: { $gte: weekAgo, $lt: end } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          total: { $sum: "$billing.paid" },
        },
      },
    ]),
    // Follow-ups due in the next 7 days (and overdue)
    Visit.countDocuments({
      followUpDate: { $ne: null, $lt: weekAhead },
    }),
    // Birthdays today
    Patient.aggregate([
      { $match: { dob: { $ne: null }, active: true } },
      {
        $project: {
          name: 1,
          code: 1,
          m: { $month: "$dob" },
          d: { $dayOfMonth: "$dob" },
        },
      },
      {
        $match: {
          m: today.getMonth() + 1,
          d: today.getDate(),
        },
      },
    ]),
  ]);

  // Build a zero-filled 7-day revenue series
  const revMap = new Map<string, number>(
    (revenue7dAgg as { _id: string; total: number }[]).map((r) => [
      r._id,
      r.total,
    ])
  );
  const revenue7d: { label: string; date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenue7d.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      date: key,
      total: revMap.get(key) || 0,
    });
  }

  return serialize({
    patientsCount,
    visitsTodayCount,
    revenueToday: revenueTodayAgg[0]?.total || 0,
    revenueMonth: revenueMonthAgg[0]?.total || 0,
    outstanding: outstandingAgg[0]?.total || 0,
    followUpsDueCount,
    revenue7d,
    birthdays: birthdays as { _id: string; name: string; code: string }[],
    todaysAppointments: todaysAppointments as unknown as AppointmentVM[],
    recentVisits: recentVisits as unknown as VisitVM[],
  });
}

export async function getPatientProfile(id: string) {
  await connectDB();
  const patient = await Patient.findById(id).lean();
  if (!patient) return null;

  const [visits, appointments, attachments, agg] = await Promise.all([
    Visit.find({ patient: id })
      .populate("doctor", "name specialization")
      .sort({ date: -1 })
      .lean(),
    Appointment.find({ patient: id, scheduledAt: { $gte: new Date() } })
      .populate("doctor", "name")
      .sort({ scheduledAt: 1 })
      .lean(),
    Attachment.find({ patient: id })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .lean(),
    Visit.aggregate([
      { $match: { patient: patient._id } },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          totalBilled: { $sum: "$billing.total" },
          totalPaid: { $sum: "$billing.paid" },
          totalBalance: { $sum: "$billing.balance" },
          lastVisit: { $max: "$date" },
        },
      },
    ]),
  ]);

  const stats = agg[0] || {
    totalVisits: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalBalance: 0,
    lastVisit: null,
  };

  return serialize({
    patient: patient as unknown as PatientVM,
    visits: visits as unknown as VisitVM[],
    appointments: appointments as unknown as AppointmentVM[],
    attachments: attachments as unknown as AttachmentVM[],
    stats: stats as {
      totalVisits: number;
      totalBilled: number;
      totalPaid: number;
      totalBalance: number;
      lastVisit: string | null;
    },
  });
}

export async function getFollowUps(): Promise<VisitVM[]> {
  await connectDB();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 60);
  const visits = await Visit.find({
    followUpDate: { $ne: null, $lte: horizon },
  })
    .populate("patient", "name code phone")
    .populate("doctor", "name")
    .sort({ followUpDate: 1 })
    .lean();
  return serialize(visits) as unknown as VisitVM[];
}

export async function getReports() {
  await connectDB();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [revenueByMonth, byDoctor, topServices, paymentBreakdown, totals] =
    await Promise.all([
      Visit.aggregate([
        { $match: { date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { y: { $year: "$date" }, m: { $month: "$date" } },
            billed: { $sum: "$billing.total" },
            collected: { $sum: "$billing.paid" },
            visits: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      Visit.aggregate([
        {
          $group: {
            _id: "$doctor",
            visits: { $sum: 1 },
            collected: { $sum: "$billing.paid" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "doc",
          },
        },
        { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
        { $sort: { visits: -1 } },
      ]),
      Visit.aggregate([
        { $unwind: "$services" },
        {
          $group: {
            _id: "$services.name",
            count: { $sum: "$services.qty" },
            revenue: { $sum: { $multiply: ["$services.price", "$services.qty"] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
      ]),
      Visit.aggregate([
        {
          $group: {
            _id: "$billing.status",
            count: { $sum: 1 },
            amount: { $sum: "$billing.balance" },
          },
        },
      ]),
      Visit.aggregate([
        {
          $group: {
            _id: null,
            billed: { $sum: "$billing.total" },
            collected: { $sum: "$billing.paid" },
            outstanding: { $sum: "$billing.balance" },
            visits: { $sum: 1 },
          },
        },
      ]),
    ]);

  return serialize({
    revenueByMonth,
    byDoctor,
    topServices,
    paymentBreakdown,
    totals: totals[0] || { billed: 0, collected: 0, outstanding: 0, visits: 0 },
  });
}

export async function getDoctors(): Promise<DoctorRef[]> {
  await connectDB();
  return serialize(
    await User.find({ role: "doctor", active: true })
      .select("name specialization")
      .sort({ name: 1 })
      .lean()
  ) as unknown as DoctorRef[];
}

export async function getActiveServices(): Promise<ServiceVM[]> {
  await connectDB();
  const { Service } = await import("@/models/Service");
  return serialize(
    await Service.find({ active: true }).sort({ category: 1, name: 1 }).lean()
  ) as unknown as ServiceVM[];
}
