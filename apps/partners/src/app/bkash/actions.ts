"use server";

import { redirect } from "next/navigation";
import { clearAccount } from "@/lib/session";

export async function signOut() {
  await clearAccount("bkash");
  redirect("/bkash");
}
