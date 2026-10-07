import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { integrationStatus } from "@/lib/config";
import { planLimits } from "@/lib/billing/plans";
import { EU_HIGH_RISK, FATF_CALL_FOR_ACTION, FATF_GREY, LISTS_AS_OF } from "@/lib/risk/lists";
import { countryName } from "@/lib/countries";
import { date } from "@/lib/format";
import { Badge, Card, CardHeader } from "@/components/ui";
import { InviteForm, SettingsForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, org } = await requireUser();
  const db = await getDb();
  const team = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastLoginAt: users.lastLoginAt }).from(users).where(eq(users.orgId, org.id));
  const isAdmin = ["owner", "admin"].includes(user.role);
  const seats = planLimits(org.plan).seats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-[40px]">Settings</h1>
        <p className="mt-1 text-[14px] text-muted">Firm profile, risk configuration and team.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Firm & risk configuration" description="Used on every file, report and client link." />
          <div className="p-5">
            <SettingsForm
              disabled={!isAdmin}
              defaults={{
                name: org.name,
                country: org.country ?? "",
                businessType: org.businessType,
                registrationNumber: org.registrationNumber ?? "",
                complianceOfficerName: org.complianceOfficerName ?? "",
                complianceOfficerEmail: org.complianceOfficerEmail ?? "",
                reportDeadlineDays: org.settings?.reportDeadlineDays ?? 30,
                extraHighRiskCountries: (org.settings?.extraHighRiskCountries ?? []).join(", "),
                activities: org.activities ?? [],
              }}
            />
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Team" description={seats ? `${team.length} of ${seats} seat${seats > 1 ? "s" : ""} used` : `${team.length} members`} />
            <ul className="divide-y divide-line">
              {team.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{m.name}</span>
                    <span className="block truncate text-[12px] text-muted">{m.email}</span>
                  </span>
                  <span className="text-right">
                    <Badge tone={m.role === "owner" ? "brass" : "neutral"}>{m.role}</Badge>
                    <span className="mt-0.5 block text-[11px] text-faint">{m.lastLoginAt ? `seen ${date(m.lastLoginAt)}` : "invited"}</span>
                  </span>
                </li>
              ))}
            </ul>
            {isAdmin ? (
              <div className="border-t border-line p-5">
                <InviteForm />
                <p className="mt-2 text-[12px] text-muted">Owners and admins count as senior management for enhanced-due-diligence approvals.</p>
              </div>
            ) : null}
          </Card>
          <Card>
            <CardHeader title="Reference risk lists" description="Applied automatically; add your own countries on the left." />
            <div className="space-y-3 px-5 py-4 text-[12.5px]">
              <div>
                <p className="font-medium">EU high-risk third countries ({EU_HIGH_RISK.size})</p>
                <p className="text-muted">{[...EU_HIGH_RISK].map(countryName).join(", ")}</p>
                <p className="mt-0.5 text-[11.5px] text-faint">As of {LISTS_AS_OF.euHighRisk}</p>
              </div>
              <div>
                <p className="font-medium">FATF call for action</p>
                <p className="text-muted">{[...FATF_CALL_FOR_ACTION].map(countryName).join(", ")}</p>
              </div>
              <div>
                <p className="font-medium">FATF increased monitoring ({FATF_GREY.size})</p>
                <p className="text-muted">{[...FATF_GREY].map(countryName).join(", ")}</p>
                <p className="mt-0.5 text-[11.5px] text-faint">As of {LISTS_AS_OF.fatf}</p>
              </div>
            </div>
          </Card>
          {isAdmin ? (
            <Card>
              <CardHeader title="Integrations" description="Live services vs. built-in fallbacks." />
              <ul className="divide-y divide-line">
                {integrationStatus().map((i) => (
                  <li key={i.name} className="flex items-start justify-between gap-3 px-5 py-3 text-[13px]">
                    <span>
                      <span className="block font-medium">{i.name}</span>
                      <span className="block text-[12px] text-muted">{i.detail}</span>
                    </span>
                    <Badge tone={i.mode === "live" ? "ok" : "warn"}>{i.mode === "live" ? "Live" : "Fallback"}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
