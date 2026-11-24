"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAccount, getAccount, setAccount } from "@/lib/session";
import { store } from "@/lib/store";

/**
 * The old way: an account is a phone number. Nothing ties two numbers to one
 * person, so a new SIM is a new customer — and a new voucher.
 */
export async function signUpWithPhone(formData: FormData) {
  const digits = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits;
  if (!/^01[3-9]\d{8}$/.test(local)) redirect("/daraz?error=phone");
  await setAccount("daraz", { kind: "phone", phone: local, at: Date.now() });
  redirect("/daraz");
}

export async function collectVoucher() {
  const account = await getAccount("daraz");
  if (!account) redirect("/daraz");
  if (account.kind === "phone") {
    if (!store.voucherByPhone.has(account.phone)) store.voucherByPhone.set(account.phone, Date.now());
  } else if (!store.voucherBySub.has(account.sub)) {
    // One real person has one subject at this shop, whatever SIM or email they use.
    store.voucherBySub.set(account.sub, Date.now());
  }
  revalidatePath("/daraz");
}

export async function signOut() {
  await clearAccount("daraz");
  redirect("/daraz");
}

export async function resetDemo() {
  store.voucherByPhone.clear();
  store.voucherBySub.clear();
  await clearAccount("daraz");
  redirect("/daraz");
}
