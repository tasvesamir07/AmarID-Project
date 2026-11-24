// Seeds what a fresh sandbox needs: the three demo partners and a few civil
// registry test records. Safe to run repeatedly.
import { sha256 } from "../src/server/crypto/tokens";
import { db } from "../src/server/db";
import { env } from "../src/server/env";

async function main() {
  const partners = env().partnersUrl;
  const secret = (name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} must be set (run \`npm run dev\` once to generate .env)`);
    return value;
  };

  const clients = [
    {
      clientId: "daraz-demo",
      name: "Daraz (demo)",
      description: "Online marketplace",
      category: "Shopping",
      secret: secret("DARAZ_CLIENT_SECRET"),
      redirectUris: [`${partners}/daraz/callback`],
      // A shop needs to know you are one real adult. It does not need your birth date or phone.
      allowedScopes: ["openid", "age", "profile"],
    },
    {
      clientId: "bkash-demo",
      name: "bKash (demo)",
      description: "Mobile financial service — account opening",
      category: "Mobile banking",
      secret: secret("BKASH_CLIENT_SECRET"),
      redirectUris: [`${partners}/bkash/callback`],
      // A financial service is legally required to know its customer.
      allowedScopes: ["openid", "age", "profile", "birthdate", "phone", "kyc"],
    },
    {
      clientId: "globalverify",
      name: "GlobalVerify",
      description: "Identity checks for employers and universities abroad",
      category: "Verification abroad",
      secret: secret("GLOBALVERIFY_CLIENT_SECRET"),
      redirectUris: [`${partners}/abroad/callback`],
      // A foreign service gets facts, never the passport itself.
      allowedScopes: ["openid", "age", "nationality", "profile"],
    },
  ];
  // Partners from earlier versions of the demo.
  await db.oidcClient.deleteMany({ where: { clientId: { in: ["bazar-local", "probashi-bank"] }, grants: { none: {} } } }).catch(() => undefined);
  for (const c of clients) {
    const data = {
      name: c.name,
      description: c.description,
      category: c.category,
      type: "CONFIDENTIAL" as const,
      secretHash: sha256(c.secret),
      redirectUris: c.redirectUris,
      allowedScopes: c.allowedScopes,
      sector: c.clientId,
      verified: true,
    };
    await db.oidcClient.upsert({ where: { clientId: c.clientId }, update: data, create: { clientId: c.clientId, ...data } });
  }

  if (env().sandbox) {
    // Test records, in the spirit of payment-sandbox test cards.
    const deceased = { docType: "NID" as const, docNumber: "1000000001" };
    await db.registryPerson.upsert({
      where: { docType_docNumber: deceased },
      update: {},
      create: { ...deceased, fullName: "Abdul Karim", dob: "1950-03-12", deceased: true },
    });
    const other = { docType: "NID" as const, docNumber: "1000000002" };
    const owner = await db.registryPerson.upsert({
      where: { docType_docNumber: other },
      update: {},
      create: { ...other, fullName: "Rahima Khatun", dob: "1988-07-21" },
    });
    // A SIM that belongs to Rahima: anyone else who enters it is refused.
    await db.registrySim.upsert({
      where: { msisdn: "8801700000002" },
      update: {},
      create: { msisdn: "8801700000002", ownerId: owner.id, operator: "Grameenphone" },
    });
  }

  console.log(`Seeded ${clients.length} partners${env().sandbox ? " and sandbox registry test records" : ""}.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
