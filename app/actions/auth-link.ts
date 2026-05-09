"use server";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function prepareMicrosoftLink() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED: You must be logged in to link an account.");
  }

  const cookieStore = await cookies();
  cookieStore.set("linking_organizer_id", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });

  return { success: true };
}

export async function clearLinkingCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("linking_organizer_id");
}
