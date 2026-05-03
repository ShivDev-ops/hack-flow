import NextAuth, { AuthOptions } from "next-auth"; // Add AuthOptions to your import
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    // ... add your other providers here
  ],
  callbacks: {
    async session({ session, token }: any) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt", // Now TypeScript knows this is the literal "jwt"
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };