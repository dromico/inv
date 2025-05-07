export interface Profile {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone_number: string | null;
  address: string | null;
  role: 'admin' | 'subcontractor';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  subcontractor_id: string;
  job_type: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'in-progress' | 'completed' | null;
  unit: number | null;
  unit_price: number | null;
  total: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  line_items?: any; // Using any for flexibility with different line item formats
}

export interface JobWithSubcontractor extends Job {
  profile: Profile;
}

export interface Invoice {
  id: string;
  job_id: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  message: string;
  read: boolean;
  related_entity_type: 'job' | 'invoice' | 'system';
  related_entity_id: string | null;
  created_at: string;
}
