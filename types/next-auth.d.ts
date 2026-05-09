import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string;
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    user: {
      id: string;
      azure_ad_id?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    azure_ad_id?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
    eventId?: string;
    sub?: string;
    azureAdId?: string | null;
  }
}
