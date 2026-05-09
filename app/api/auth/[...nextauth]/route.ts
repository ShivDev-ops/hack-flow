// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
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
        console.log("[AUTH_DEBUG] Attempting login for:", credentials?.accessId);
        if (!credentials?.accessId || !credentials?.password) return null;

        const supabase = await createAdminClient();
        
        // 1. Check in hf_organizer_credentials
        const { data: organizer, error } = await supabase
          .from("hf_organizer_credentials")
          .select("*")
          .ilike("access_id", credentials.accessId) // Use ilike for case-insensitive
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
            console.error("[AUTH_DEBUG] Supabase Error:", error.message);
            return null;
        }

        if (!organizer) {
            console.warn("[AUTH_DEBUG] Organizer not found or inactive for ID:", credentials.accessId);
            return null;
        }

        // 2. Verify Password
        const isValid = await bcrypt.compare(credentials.password, organizer.password_hash);
        if (!isValid) {
            console.warn("[AUTH_DEBUG] Invalid password for ID:", credentials.accessId);
            return null;
        }

        console.log("[AUTH_DEBUG] Login SUCCESS for:", credentials.accessId);
        return {
          id: organizer.id,
          name: organizer.access_id,
          role: organizer.role,
          eventId: organizer.event_id,
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.eventId = user.eventId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.role = token.role;
        session.eventId = token.eventId;

        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub,
          email: session.user.email,
          role: "authenticated",
          user_role: token.role, // Custom claim for Supabase RLS
          event_id: token.eventId // Custom claim for Supabase RLS
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
