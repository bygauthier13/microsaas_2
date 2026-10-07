"use client";
import { useActionState, useMemo, useState } from "react";
import { Car, Plane, Ship } from "lucide-react";
import type { ActionResult } from "@/lib/actions-util";
import { assessArticle74, ASSET_TYPES, CURRENCIES, toEur } from "@/lib/risk/thresholds";
import { OUR_ROLE_LABELS, PAYMENT_LABELS, TX_LABELS, money } from "@/lib/format";
import { Field, FormError, Input, Notice, Select, cn } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CountrySelect } from "./country-select";

export type DealFormDefaults = {
  assetType: string;
  assetName: string;
  assetDetails: Record<string, string | undefined>;
  transactionType: string;
  ourRole: string;
  useType: string;
  priceAmount: number | null;
  currency: string;
  paymentMethod: string;
  thirdPartyPayer: boolean;
  fundsOriginCountry: string | null;
  expectedClosing: string | null;
  flags: { unusualUrgency?: boolean; priceAnomaly?: boolean; nomineeOrBearer?: boolean; cashComponentEur?: number };
};

export const EMPTY_DEAL: DealFormDefaults = {
  assetType: "watercraft",
  assetName: "",
  assetDetails: {},
  transactionType: "sale",
  ourRole: "seller_broker",
  useType: "non_commercial",
  priceAmount: null,
  currency: "EUR",
  paymentMethod: "unknown",
  thirdPartyPayer: false,
  fundsOriginCountry: null,
  expectedClosing: null,
  flags: {},
};

const ICONS = { watercraft: Ship, aircraft: Plane, motor_vehicle: Car } as const;

export function DealForm({
  action,
  defaults = EMPTY_DEAL,
  submitLabel,
  compact,
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  defaults?: DealFormDefaults;
  submitLabel: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const [assetType, setAssetType] = useState(defaults.assetType);
  const [tx, setTx] = useState(defaults.transactionType);
  const [useType, setUseType] = useState(defaults.useType);
  const [price, setPrice] = useState(defaults.priceAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(defaults.currency);
  const priceNum = Number(price.replace(/[^\d.]/g, "")) || null;
  const eur = toEur(priceNum, currency);
  const art74 = useMemo(() => assessArticle74({ assetType, transactionType: tx, useType, priceEur: eur }), [assetType, tx, useType, eur]);
  const d = defaults.assetDetails;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={state.error} />
      {state.ok && state.message ? <Notice tone="ok">{state.message}</Notice> : null}

      <section className="space-y-4">
        <p className="text-[13px] font-medium text-ink-2">Asset</p>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(ASSET_TYPES) as (keyof typeof ASSET_TYPES)[]).map((k) => {
            const Icon = ICONS[k];
            return (
              <label
                key={k}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-[14px]",
                  assetType === k ? "border-ink ring-2 ring-ink/10" : "border-line-strong hover:border-ink/40",
                )}
              >
                <input type="radio" name="assetType" value={k} checked={assetType === k} onChange={() => setAssetType(k)} className="sr-only" />
                <Icon className="size-5 text-brass" />
                <span>
                  <span className="block font-medium">{ASSET_TYPES[k].label}</span>
                  <span className="block text-[12px] text-muted">Art. 74 threshold {money(ASSET_TYPES[k].threshold)}</span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Asset name" htmlFor="assetName" error={fe.assetName} className="sm:col-span-2">
            <Input
              id="assetName"
              name="assetName"
              defaultValue={defaults.assetName}
              placeholder={assetType === "watercraft" ? "M/Y AURELIA — 52m Benetti (2019)" : assetType === "aircraft" ? "Gulfstream G650ER — MSN 6xxx" : "Ferrari Daytona SP3 (2023)"}
              required
            />
          </Field>
          <Field label={assetType === "motor_vehicle" ? "Make" : "Builder / manufacturer"} htmlFor="builder">
            <Input id="builder" name="builder" defaultValue={d.builder} />
          </Field>
          <Field label="Model" htmlFor="model">
            <Input id="model" name="model" defaultValue={d.model} />
          </Field>
          <Field label="Year" htmlFor="year">
            <Input id="year" name="year" inputMode="numeric" defaultValue={d.year} />
          </Field>
          {assetType === "watercraft" ? (
            <>
              <Field label="Length (m)" htmlFor="lengthM">
                <Input id="lengthM" name="lengthM" inputMode="decimal" defaultValue={d.lengthM} />
              </Field>
              <Field label="Flag" htmlFor="flag">
                <Input id="flag" name="flag" defaultValue={d.flag} placeholder="e.g. Malta, Cayman Islands" />
              </Field>
              <Field label="IMO / HIN" htmlFor="imo">
                <Input id="imo" name="imo" defaultValue={d.imo ?? d.hin} />
              </Field>
            </>
          ) : assetType === "aircraft" ? (
            <>
              <Field label="Registration" htmlFor="registration">
                <Input id="registration" name="registration" defaultValue={d.registration} placeholder="e.g. M-ABCD" />
              </Field>
              <Field label="Serial number (MSN)" htmlFor="msn">
                <Input id="msn" name="msn" defaultValue={d.msn} />
              </Field>
            </>
          ) : (
            <Field label="VIN" htmlFor="vin">
              <Input id="vin" name="vin" defaultValue={d.vin} />
            </Field>
          )}
        </div>
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <p className="text-[13px] font-medium text-ink-2">Transaction</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type" htmlFor="transactionType">
            <Select id="transactionType" name="transactionType" value={tx} onChange={(e) => setTx(e.target.value)}>
              {Object.entries(TX_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Your role" htmlFor="ourRole">
            <Select id="ourRole" name="ourRole" defaultValue={defaults.ourRole}>
              {Object.entries(OUR_ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Intended use" htmlFor="useType" hint="Private use of a company-owned asset counts as non-commercial.">
            <Select id="useType" name="useType" value={useType} onChange={(e) => setUseType(e.target.value)}>
              <option value="non_commercial">Non-commercial (private)</option>
              <option value="commercial">Commercial (e.g. charter fleet)</option>
              <option value="unknown">Not yet known</option>
            </Select>
          </Field>
          <Field label={tx === "charter" ? "Charter fee" : "Price"} htmlFor="priceAmount" error={fe.priceAmount} className="sm:col-span-2">
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2">
              <Input id="priceAmount" name="priceAmount" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="38500000" />
              <Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
          </Field>
          <Field label="Expected closing" htmlFor="expectedClosing">
            <Input id="expectedClosing" name="expectedClosing" type="date" defaultValue={defaults.expectedClosing ?? ""} />
          </Field>
        </div>
        {priceNum ? (
          <Notice tone={art74.applies ? "warn" : art74.nearThreshold ? "brass" : "sea"} title={art74.applies ? "Article 74 threshold report required" : "No Article 74 report"}>
            {currency !== "EUR" ? <span>≈ {money(eur)} at an indicative rate. </span> : null}
            {art74.reason}
          </Notice>
        ) : null}
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <p className="text-[13px] font-medium text-ink-2">Funds &amp; red flags {compact ? null : <span className="font-normal text-muted">— can be completed later or by the client</span>}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Payment method" htmlFor="paymentMethod">
            <Select id="paymentMethod" name="paymentMethod" defaultValue={defaults.paymentMethod}>
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Funds originate from" htmlFor="fundsOriginCountry">
            <CountrySelect id="fundsOriginCountry" name="fundsOriginCountry" defaultValue={defaults.fundsOriginCountry ?? ""} placeholder="Not yet known" />
          </Field>
          <Field label="Cash component (EUR)" htmlFor="cashComponentEur" hint="Above €10,000 is prohibited under the AMLR.">
            <Input id="cashComponentEur" name="cashComponentEur" inputMode="numeric" defaultValue={defaults.flags.cashComponentEur ?? ""} />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Check name="thirdPartyPayer" label="Funds come from a third party (not the buyer)" defaultChecked={defaults.thirdPartyPayer} />
          <Check name="unusualUrgency" label="Unusual urgency or secrecy requested" defaultChecked={!!defaults.flags.unusualUrgency} />
          <Check name="priceAnomaly" label="Price materially above or below market" defaultChecked={!!defaults.flags.priceAnomaly} />
          <Check name="nomineeOrBearer" label="Nominee shareholders/directors or bearer instruments" defaultChecked={!!defaults.flags.nomineeOrBearer} />
        </div>
      </section>

      <div className="flex justify-end border-t border-line pt-6">
        <SubmitButton size="lg" pendingText="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 text-[13.5px] hover:border-line-strong">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[#0b1b2b]" />
      {label}
    </label>
  );
}
