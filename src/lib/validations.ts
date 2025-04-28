import { z } from "zod";

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(64, { message: "Password cannot be longer than 64 characters" }),
  confirmPassword: z.string(),
  company_name: z.string().min(2, { message: "Company name is required" }),
  contact_person: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Line item schema
export const lineItemSchema = z.object({
  item_name: z.string().min(2, { message: "Item name is required" }),
  unit_quantity: z.number().positive({ message: "Quantity must be a positive number" }),
  unit_price: z.number().nonnegative({ message: "Price must be a non-negative number" }),
});

// Job creation/editing schema
export const jobSchema = z.object({
  location: z.string().min(2, { message: "Location is required" }),
  start_date: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date must be a valid date",
  }),
  end_date: z.date({
    required_error: "End date is required",
    invalid_type_error: "End date must be a valid date",
  }),
  line_items: z.array(lineItemSchema).min(1, { message: "At least one line item is required" }),
  notes: z.string().optional(),
}).refine(data => data.end_date >= data.start_date, {
  message: "End date must be after or equal to the start date",
  path: ["end_date"]
});

// Profile editing schema
export const profileSchema = z.object({
  company_name: z.string().min(2, { message: "Company name is required" }),
  contact_person: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(6, { message: "New password must be at least 6 characters" })
    .max(64, { message: "New password cannot be longer than 64 characters" }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"]
});
