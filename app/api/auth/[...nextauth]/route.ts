// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

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
        if (!credentials?.accessId || !credentials?.password) return null;

        const supabase = await createAdminClient();
        
        const { data: organizer, error } = await supabase
          .from("hf_organizer_credentials")
          .select("*")
          .ilike("access_id", credentials.accessId) 
          .eq("is_active", true)
          .maybeSingle();

        if (error || !organizer) {
            return null;
        }

        const isValid = await bcrypt.compare(credentials.password, organizer.password_hash);
        if (!isValid) {
            return null;
        }

        return {
          id: organizer.id,
          name: organizer.access_id,
          role: organizer.role,
          eventId: organizer.event_id,
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
        
        // 1. Check if this Microsoft account is already linked to ANYONE
        const { data: existingByAzureId } = await supabase
          .from("hf_organizer_credentials")
          .select("id, is_active")
          .eq("azure_ad_id", profile?.sub)
          .maybeSingle();

        if (existingByAzureId) {
          // If a linking handshake is active, but the account is already taken by someone else
          if (linkingId) {
            console.warn(`[AUTH] Link failed: Microsoft account ${profile?.sub} is already linked to another user.`);
            cookieStore.delete("linking_organizer_id");
            return false;
          }
          // Normal login: allow if account is active
          return !!existingByAzureId.is_active;
        }

        // 2. If not linked, check for a valid linking handshake
        if (linkingId) {
          const { data: targetOrganizer } = await supabase
            .from("hf_organizer_credentials")
            .select("id, azure_ad_id, is_active")
            .eq("id", linkingId)
            .maybeSingle();

          if (targetOrganizer && targetOrganizer.is_active && !targetOrganizer.azure_ad_id) {
            const { error: updateError } = await supabase
              .from("hf_organizer_credentials")
              .update({ azure_ad_id: profile?.sub })
              .eq("id", linkingId)
              .is("azure_ad_id", null);

            cookieStore.delete("linking_organizer_id");

            if (!updateError) {
              console.log(`[AUTH] Linked Microsoft account ${profile?.sub} to organizer ${linkingId}`);
              return true;
            }
          }
          cookieStore.delete("linking_organizer_id");
        }
        
        return false; 
      }
      return account?.provider === "credentials";
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        if (account.provider === "azure-ad") {
          const supabase = await createAdminClient();
          const { data: organizer } = await supabase
            .from("hf_organizer_credentials")
            .select("*")
            .eq("azure_ad_id", profile?.sub)
            .eq("is_active", true) 
            .maybeSingle();
          
          if (organizer) {
            token.sub = organizer.id;
            token.role = organizer.role;
            token.eventId = organizer.event_id;
            token.azureAdId = organizer.azure_ad_id;
          }
        } else {
          token.sub = user.id;
          token.role = user.role;
          token.eventId = user.eventId;
          token.azureAdId = user.azure_ad_id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.role = token.role;
        session.eventId = token.eventId;
        session.user.azure_ad_id = token.azureAdId;

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
