export type ProfileRole = "admin" | "member";

export type Frequency = "weekly" | "biweekly" | "monthly";

export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at: string;
}

export interface San {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: Frequency;
  start_date: string;
  total_turns: number;
  announcement: string;
  created_by: string;
  created_at: string;
}

export interface SanMember {
  id: string;
  san_id: string;
  user_id: string;
  turn_number: number;
  payout_date: string;
  created_at: string;
}

export interface Payment {
  id: string;
  san_id: string;
  user_id: string;
  round_number: number;
  amount_paid: number;
  is_complete: boolean;
  updated_at: string;
}

export interface MemberCredential {
  id: string;
  san_id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  temp_password: string;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type PaymentStatus = "al-dia" | "incompleto" | "pendiente";

export interface TransparencyRow {
  member: SanMember;
  profile: Profile;
  payment: Payment | null;
  status: PaymentStatus;
}

