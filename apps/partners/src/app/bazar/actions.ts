"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAccount, getAccount, setAccount } from "@/lib/session";
import { store } from "@/lib/store";

/**
 * The old way: an account is a phone number. Nothing ties two numbers to one
 * person, so a new SIM is a new customer — and a new coupon.
 */
export async function signUpWithPhone(formData: FormData) {
  const digits = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits;
  if (!/^01[3-9]\d{8}$/.test(local)) redirect("/bazar?error=phone");
  await setAccount("bazar", { kind: "phone", phone: local, at: Date.now() });
  redirect("/bazar");
}

export async function claimCoupon() {
  const account = await getAccount("bazar");
  if (!account) redirect("/bazar");
  if (account.kind === "phone") {
    if (!store.couponByPhone.has(account.phone)) store.couponByPhone.set(account.phone, Date.now());
  } else if (!store.couponBySub.has(account.sub)) {
    // One real person has one subject at this shop, whatever SIM or email they use.
    store.couponBySub.set(account.sub, Date.now());
  }
  revalidatePath("/bazar");
}

export async function signOut() {
  await clearAccount("bazar");
  redirect("/bazar");
}

export async function resetDemo() {
  store.couponByPhone.clear();
  store.couponBySub.clear();
  await clearAccount("bazar");
  redirect("/bazar");
}
