// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions, User as NextAuthUser, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

interface ExtendedUser extends NextAuthUser {
  role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
  eventId?: string;
  azure_ad_id?: string | null;
}

interface ExtendedSession extends Session {
  role?: 'ORGANIZER' | 'SUPER_ADMIN' | 'AUTHENTICATED';
  eventId?: string;
  supabaseAccessToken?: string;
  user: ExtendedUser & { id: string };
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: "common", 
    }),
    CredentialsProvider({
      name: "Event Credentials",
      credentials: {
        accessId: { label: "Access ID", type: "text", placeholder: "EVENT-ID" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[AUTH_DEBUG] Login attempt for:", credentials?.accessId);
        if (!credentials?.accessId || !credentials?.password) return null;

        const supabase = await createAdminClient();
        
        const { data: organizer, error } = await supabase
          .from("hf_organizer_credentials")
          .select("*")
          .ilike("access_id", credentials.accessId) 
          .maybeSingle();

        if (error || !organizer) {
            console.warn("[AUTH_DEBUG] User not found:", credentials.accessId);
            return null;
        }

        if (!organizer.is_active && organizer.role !== "SUPER_ADMIN") {
            console.warn("[AUTH_DEBUG] Account suspended:", credentials.accessId);
            return null;
        }

        const isValid = await bcrypt.compare(credentials.password, organizer.password_hash);
        if (!isValid) {
            console.warn("[AUTH_DEBUG] Invalid password for:", credentials.accessId);
            return null;
        }

        console.log("[AUTH_DEBUG] Login successful:", organizer.access_id, "ID:", organizer.id);
        
        return {
          id: organizer.id,
          name: organizer.access_id,
          role: organizer.role as any,
          eventId: organizer.event_id || undefined,
          azure_ad_id: organizer.azure_ad_id,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "azure-ad") {
        const supabase = await createAdminClient();
        const cookieStore = await cookies();
        const linkingId = cookieStore.get("linking_organizer_id")?.value;
        
        const { data: existingByAzureId } = await supabase
          .from("hf_organizer_credentials")
          .select("id, is_active, role")
          .eq("azure_ad_id", profile?.sub)
          .maybeSingle();

        if (existingByAzureId) {
          if (linkingId) {
            cookieStore.delete("linking_organizer_id");
            return false;
          }
          return !!(existingByAzureId.is_active || existingByAzureId.role === "SUPER_ADMIN");
        }

        if (linkingId) {
          const { data: targetOrganizer } = await supabase
            .from("hf_organizer_credentials")
            .select("id, azure_ad_id, is_active")
            .eq("id", linkingId)
            .maybeSingle();

          if (targetOrganizer && !targetOrganizer.azure_ad_id) {
            const { error: updateError } = await supabase
              .from("hf_organizer_credentials")
              .update({ azure_ad_id: profile?.sub })
              .eq("id", linkingId)
              .is("azure_ad_id", null);

            cookieStore.delete("linking_organizer_id");
            if (!updateError) return true;
          }
          cookieStore.delete("linking_organizer_id");
        }
        return false; 
      }
      return account?.provider === "credentials";
    },
    async jwt({ token, user, account, profile }) {
      if (user && account) {
        token.sub = user.id;
        token.role = (user as any).role;
        token.eventId = (user as any).eventId || (user as any).event_id || undefined;
        token.azureAdId = (user as any).azure_ad_id || (user as any).azureAdId || null;
      }

      if (account?.provider === "azure-ad") {
        const supabase = await createAdminClient();
        const { data: organizer } = await supabase
          .from("hf_organizer_credentials")
          .select("*")
          .eq("azure_ad_id", profile?.sub)
          .maybeSingle();
        
        if (organizer) {
          token.sub = organizer.id;
          token.role = organizer.role;
          token.eventId = organizer.event_id || undefined;
          token.azureAdId = organizer.azure_ad_id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.role = token.role as any;
        session.eventId = token.eventId as string | undefined;
        session.user.azure_ad_id = token.azureAdId as string | null;

        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub,
          email: session.user.email,
          role: "authenticated",
          user_role: token.role, 
          event_id: token.eventId 
        };

        if (!process.env.SUPABASE_JWT_SECRET) {
          throw new Error("Missing SUPABASE_JWT_SECRET environment variable");
        }
        
        session.supabaseAccessToken = jwt.sign(
          payload,
          process.env.SUPABASE_JWT_SECRET
        );
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
