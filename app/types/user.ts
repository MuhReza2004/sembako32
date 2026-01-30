export type UserRole = "admin" | "staff";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
