import * as z from 'zod';

export const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().min(1).max(8),
  dateOfBirth: z.date(),
  placeOfBirth: z.string().min(1),
  maritalStatus: z.string().min(1),
  gender: z.string().min(1),
  spouseName: z.string().min(1).optional().nullable(),
  occupation: z.string().min(1),
  residenceTime: z.string().min(1),
  address: z.string().min(1),
  lastDentistVisit: z.date().min(1).optional().nullable(),
  reasonLastDentistVisit: z.string().min(1).optional().nullable(),
  lastDoctorVisit: z.date().min(1).optional().nullable(),
  reasonLastDoctorVisit: z.string().min(1).optional().nullable(),
  emergencyContact: z.string().min(1),
  emergencyContactRelation: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
  phone: z.string().min(1),
});

export function validatePatient(input) {
  return patientSchema.safeParse(input);
}
