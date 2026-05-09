import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string;
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    sub?: string;
  }
}
