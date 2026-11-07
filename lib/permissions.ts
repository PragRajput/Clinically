export type Role = "admin" | "doctor" | "receptionist";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  receptionist: "Receptionist",
};

/**
 * Each permission maps to the roles allowed to perform it.
 * Keep this as the single source of truth for access control.
 */
export const PERMISSIONS = {
  // Patients
  "patients.view": ["admin", "doctor", "receptionist"],
  "patients.manage": ["admin", "doctor", "receptionist"],
  "patients.delete": ["admin"],
  // Appointments
  "appointments.view": ["admin", "doctor", "receptionist"],
  "appointments.manage": ["admin", "doctor", "receptionist"],
  // Visits / clinical records
  "visits.view": ["admin", "doctor", "receptionist"],
  "visits.manage": ["admin", "doctor"], // only clinicians write clinical notes
  "visits.delete": ["admin"],
  // Billing
  "billing.view": ["admin", "doctor", "receptionist"],
  "billing.manage": ["admin", "receptionist"], // front desk collects payments
  // Attachments / documents (lab reports, scans, files)
  "attachments.view": ["admin", "doctor", "receptionist"],
  "attachments.manage": ["admin", "doctor", "receptionist"],
  // Services catalog
  "services.view": ["admin", "doctor", "receptionist"],
  "services.manage": ["admin"],
  // Staff / users
  "staff.view": ["admin"],
  "staff.manage": ["admin"],
  // Reports
  "reports.view": ["admin", "doctor", "receptionist"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
