"use client";

import { useState, useTransition } from "react";
import { CircleCheck, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { submitKycAction } from "@/app/actions/kyc";
import { Button, Field, FormError, Input, Notice, Select, Textarea, cn } from "@/components/ui";

type Country = { code: string; name: string };
type Person = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  residenceCountry: string;
  address: string;
  idDocType: string;
  idDocNumber: string;
  idDocExpiry: string;
  pep: boolean;
  pepDetails: string;
};
type Owner = Person & { ownershipPct: string; controlType: string; ownsVia: number };
type Intermediate = { name: string; jurisdiction: string; entityType: string };
type DocRow = { id: number; category: string; party: string; file: File | null };

const emptyPerson = (): Person => ({ fullName: "", dateOfBirth: "", nationality: "", residenceCountry: "", address: "", idDocType: "Passport", idDocNumber: "", idDocExpiry: "", pep: false, pepDetails: "" });
const emptyOwner = (): Owner => ({ ...emptyPerson(), ownershipPct: "", controlType: "", ownsVia: -1 });

export function KycForm({
  token,
  countries,
  categories,
  defaultName,
  defaultEmail,
}: {
  token: string;
  countries: Country[];
  categories: Record<string, string>;
  defaultName: string;
  defaultEmail: string;
}) {
  const [submitter, setSubmitter] = useState({ name: defaultName, email: defaultEmail, role: "lawyer", organisation: "" });
  const [buyerKind, setBuyerKind] = useState<"person" | "entity">("entity");
  const [buyerPerson, setBuyerPerson] = useState<Person>(emptyPerson());
  const [buyerEntity, setBuyerEntity] = useState({ name: "", registrationNumber: "", jurisdiction: "", entityType: "company", address: "" });
  const [intermediates, setIntermediates] = useState<Intermediate[]>([]);
  const [owners, setOwners] = useState<Owner[]>([emptyOwner()]);
  const [funds, setFunds] = useState({ paymentMethod: "wire", payerIsBuyer: true, payerName: "", payerKind: "entity", payerCountry: "", fundsOriginCountry: "", sourceOfFunds: "", sourceOfWealth: "" });
  const [purpose, setPurpose] = useState({ purpose: "private_use", purposeDetails: "" });
  const [docs, setDocs] = useState<DocRow[]>([
    { id: 1, category: "passport", party: "owner:0", file: null },
    { id: 2, category: "source_of_funds", party: "deal", file: null },
  ]);
  const [declarations, setDeclarations] = useState({ accurate: false, consent: false });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const err = (k: string) => errors[k];
  const partyOptions = [
    { v: "deal", label: "The transaction" },
    { v: "buyer", label: buyerKind === "entity" ? buyerEntity.name || "Buyer entity" : buyerPerson.fullName || "Buyer" },
    ...(buyerKind === "entity" ? owners.map((o, i) => ({ v: `owner:${i}`, label: o.fullName || `Beneficial owner ${i + 1}` })) : []),
    ...(!funds.payerIsBuyer ? [{ v: "payer", label: funds.payerName || "Payer" }] : []),
  ];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    const clean = (p: Person) => ({ ...p, dateOfBirth: p.dateOfBirth || undefined, idDocExpiry: p.idDocExpiry || undefined });
    const payload = {
      submitter: { ...submitter, organisation: submitter.organisation || undefined },
      buyerKind,
      buyerPerson: buyerKind === "person" ? clean(buyerPerson) : undefined,
      buyerEntity: buyerKind === "entity" ? buyerEntity : undefined,
      intermediates: buyerKind === "entity" ? intermediates : [],
      owners:
        buyerKind === "entity"
          ? owners.map((o) => ({ ...clean(o), ownershipPct: o.ownershipPct ? Number(o.ownershipPct) : undefined, controlType: o.controlType || undefined }))
          : [],
      funds: { ...funds, payerName: funds.payerIsBuyer ? undefined : funds.payerName, payerKind: funds.payerIsBuyer ? undefined : funds.payerKind, payerCountry: funds.payerIsBuyer ? undefined : funds.payerCountry },
      purpose: purpose.purpose,
      purposeDetails: purpose.purposeDetails || undefined,
      declarations,
    };
    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));
    docs.forEach((d, i) => {
      if (!d.file) return;
      fd.set(`file_${i}`, d.file);
      fd.set(`fileCategory_${i}`, d.category);
      fd.set(`fileParty_${i}`, d.party);
    });
    start(async () => {
      const res = await submitKycAction(token, fd);
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors(res.fieldErrors ?? {});
      setFormError(res.error ?? "Please review the form.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-ok/30 bg-white p-10 text-center">
        <CircleCheck className="mx-auto size-10 text-ok" />
        <h2 className="display mt-4 text-[34px]">Thank you — the file is submitted</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-2">Your broker has been notified and will contact you if anything else is needed. You can close this page.</p>
      </div>
    );
  }

  const countrySelect = (id: string, value: string, onChange: (v: string) => void, error?: string) => (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
      <option value="">Select…</option>
      {countries.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </Select>
  );

  const personFields = (prefix: string, p: Person, set: (p: Person) => void) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full legal name (as in passport)" htmlFor={`${prefix}-name`} error={err(`${prefix}.fullName`)} className="sm:col-span-2">
        <Input id={`${prefix}-name`} value={p.fullName} onChange={(e) => set({ ...p, fullName: e.target.value })} />
      </Field>
      <Field label="Date of birth" htmlFor={`${prefix}-dob`} error={err(`${prefix}.dateOfBirth`)}>
        <Input id={`${prefix}-dob`} type="date" value={p.dateOfBirth} onChange={(e) => set({ ...p, dateOfBirth: e.target.value })} />
      </Field>
      <Field label="Nationality" htmlFor={`${prefix}-nat`} error={err(`${prefix}.nationality`)}>
        {countrySelect(`${prefix}-nat`, p.nationality, (v) => set({ ...p, nationality: v }), err(`${prefix}.nationality`))}
      </Field>
      <Field label="Country of residence" htmlFor={`${prefix}-res`} error={err(`${prefix}.residenceCountry`)}>
        {countrySelect(`${prefix}-res`, p.residenceCountry, (v) => set({ ...p, residenceCountry: v }), err(`${prefix}.residenceCountry`))}
      </Field>
      <Field label="Passport / ID number" htmlFor={`${prefix}-idn`}>
        <Input id={`${prefix}-idn`} value={p.idDocNumber} onChange={(e) => set({ ...p, idDocNumber: e.target.value })} />
      </Field>
      <Field label="Document expiry" htmlFor={`${prefix}-idx`} error={err(`${prefix}.idDocExpiry`)}>
        <Input id={`${prefix}-idx`} type="date" value={p.idDocExpiry} onChange={(e) => set({ ...p, idDocExpiry: e.target.value })} />
      </Field>
      <Field label="Residential address" htmlFor={`${prefix}-addr`} className="sm:col-span-2">
        <Input id={`${prefix}-addr`} value={p.address} onChange={(e) => set({ ...p, address: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-[13.5px] sm:col-span-2">
        <input type="checkbox" checked={p.pep} onChange={(e) => set({ ...p, pep: e.target.checked })} className="size-4 accent-[#0b1b2b]" />
        This person holds, or held in the last 12 months, a prominent public function — or is a family member or close associate of such a person.
      </label>
      {p.pep ? (
        <Field label="Public function" htmlFor={`${prefix}-pepd`} className="sm:col-span-2">
          <Input id={`${prefix}-pepd`} value={p.pepDetails} onChange={(e) => set({ ...p, pepDetails: e.target.value })} />
        </Field>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      {formError ? <FormError message={formError} /> : null}

      <Section n={1} title="About you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="s-name" error={err("submitter.name")}>
            <Input id="s-name" value={submitter.name} onChange={(e) => setSubmitter({ ...submitter, name: e.target.value })} />
          </Field>
          <Field label="Your email" htmlFor="s-email" error={err("submitter.email")}>
            <Input id="s-email" type="email" value={submitter.email} onChange={(e) => setSubmitter({ ...submitter, email: e.target.value })} />
          </Field>
          <Field label="You are" htmlFor="s-role">
            <Select id="s-role" value={submitter.role} onChange={(e) => setSubmitter({ ...submitter, role: e.target.value })}>
              <option value="lawyer">The buyer&apos;s lawyer</option>
              <option value="family_office">The buyer&apos;s family office</option>
              <option value="captain_or_manager">Captain / yacht or aircraft manager</option>
              <option value="principal">The buyer (principal)</option>
              <option value="other">Other representative</option>
            </Select>
          </Field>
          <Field label="Firm / organisation" htmlFor="s-org">
            <Input id="s-org" value={submitter.organisation} onChange={(e) => setSubmitter({ ...submitter, organisation: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section n={2} title="The buyer">
        <div role="radiogroup" className="mb-5 grid gap-3 sm:grid-cols-2">
          {[
            { v: "entity", label: "A company, trust or foundation", hint: "e.g. an SPV holding the asset" },
            { v: "person", label: "An individual", hint: "Buying in their own name" },
          ].map((o) => (
            <label key={o.v} className={cn("cursor-pointer rounded-xl border bg-white px-4 py-3", buyerKind === o.v ? "border-ink ring-2 ring-ink/10" : "border-line-strong")}>
              <input type="radio" name="buyerKind" className="sr-only" checked={buyerKind === o.v} onChange={() => setBuyerKind(o.v as "person" | "entity")} />
              <span className="block text-[14px] font-medium">{o.label}</span>
              <span className="block text-[12.5px] text-muted">{o.hint}</span>
            </label>
          ))}
        </div>
        {buyerKind === "person" ? (
          personFields("buyerPerson", buyerPerson, setBuyerPerson)
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal name" htmlFor="be-name" error={err("buyerEntity.name")} className="sm:col-span-2">
                <Input id="be-name" value={buyerEntity.name} onChange={(e) => setBuyerEntity({ ...buyerEntity, name: e.target.value })} />
              </Field>
              <Field label="Jurisdiction of incorporation" htmlFor="be-jur" error={err("buyerEntity.jurisdiction")}>
                {countrySelect("be-jur", buyerEntity.jurisdiction, (v) => setBuyerEntity({ ...buyerEntity, jurisdiction: v }))}
              </Field>
              <Field label="Registration number" htmlFor="be-reg">
                <Input id="be-reg" value={buyerEntity.registrationNumber} onChange={(e) => setBuyerEntity({ ...buyerEntity, registrationNumber: e.target.value })} />
              </Field>
              <Field label="Type" htmlFor="be-type">
                <Select id="be-type" value={buyerEntity.entityType} onChange={(e) => setBuyerEntity({ ...buyerEntity, entityType: e.target.value })}>
                  <option value="company">Company</option>
                  <option value="trust">Trust</option>
                  <option value="foundation">Foundation</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Registered address" htmlFor="be-addr">
                <Input id="be-addr" value={buyerEntity.address} onChange={(e) => setBuyerEntity({ ...buyerEntity, address: e.target.value })} />
              </Field>
            </div>

            <div>
              <p className="text-[14px] font-semibold">Intermediate holding entities</p>
              <p className="text-[12.5px] text-muted">Companies, trusts or foundations between the buyer and the individuals who ultimately own or control it, in order.</p>
              <div className="mt-3 space-y-3">
                {intermediates.map((im, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-line bg-paper/60 p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                    <Input aria-label="Name" placeholder="Name" value={im.name} onChange={(e) => setIntermediates(intermediates.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                    {countrySelect(`im-${i}`, im.jurisdiction, (v) => setIntermediates(intermediates.map((x, j) => (j === i ? { ...x, jurisdiction: v } : x))))}
                    <Select aria-label="Type" value={im.entityType} onChange={(e) => setIntermediates(intermediates.map((x, j) => (j === i ? { ...x, entityType: e.target.value } : x)))}>
                      <option value="company">Company</option>
                      <option value="trust">Trust</option>
                      <option value="foundation">Foundation</option>
                      <option value="partnership">Partnership</option>
                    </Select>
                    <Button type="button" variant="ghost" size="sm" aria-label="Remove" onClick={() => setIntermediates(intermediates.filter((_, j) => j !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                    {err(`intermediates.${i}.name`) || err(`intermediates.${i}.jurisdiction`) ? <p className="text-[12px] text-bad sm:col-span-4">Name and jurisdiction are required.</p> : null}
                  </div>
                ))}
                {intermediates.length < 6 ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIntermediates([...intermediates, { name: "", jurisdiction: "", entityType: "trust" }])}>
                    <Plus className="size-4" /> Add intermediate entity
                  </Button>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-[14px] font-semibold">Beneficial owners</p>
              <p className="text-[12.5px] text-muted">Every individual holding more than 25%, or controlling the buyer by other means (for trusts: settlor, trustees, protector, beneficiaries).</p>
              {err("owners") ? <p className="mt-1 text-[12px] text-bad">{err("owners")}</p> : null}
              <div className="mt-3 space-y-4">
                {owners.map((o, i) => (
                  <div key={i} className="rounded-xl border border-line bg-paper/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[13px] font-semibold">Beneficial owner {i + 1}</p>
                      {owners.length > 1 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setOwners(owners.filter((_, j) => j !== i))}>
                          <Trash2 className="size-4" /> Remove
                        </Button>
                      ) : null}
                    </div>
                    {personFields(`owners.${i}`, o, (p) => setOwners(owners.map((x, j) => (j === i ? { ...x, ...p } : x))))}
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Field label="Ownership %" htmlFor={`o-pct-${i}`} error={err(`owners.${i}.ownershipPct`)}>
                        <Input id={`o-pct-${i}`} inputMode="decimal" value={o.ownershipPct} onChange={(e) => setOwners(owners.map((x, j) => (j === i ? { ...x, ownershipPct: e.target.value } : x)))} />
                      </Field>
                      <Field label="Nature of control" htmlFor={`o-ctl-${i}`}>
                        <Input id={`o-ctl-${i}`} placeholder="e.g. Shareholder, settlor" value={o.controlType} onChange={(e) => setOwners(owners.map((x, j) => (j === i ? { ...x, controlType: e.target.value } : x)))} />
                      </Field>
                      <Field label="Owns / controls" htmlFor={`o-via-${i}`}>
                        <Select id={`o-via-${i}`} value={o.ownsVia} onChange={(e) => setOwners(owners.map((x, j) => (j === i ? { ...x, ownsVia: Number(e.target.value) } : x)))}>
                          <option value={-1}>{buyerEntity.name || "The buyer entity"}</option>
                          {intermediates.map((im, k) => (
                            <option key={k} value={k}>
                              {im.name || `Intermediate ${k + 1}`}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>
                  </div>
                ))}
                {owners.length < 12 ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => setOwners([...owners, emptyOwner()])}>
                    <Plus className="size-4" /> Add beneficial owner
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section n={3} title="Funds">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment method" htmlFor="f-method">
            <Select id="f-method" value={funds.paymentMethod} onChange={(e) => setFunds({ ...funds, paymentMethod: e.target.value })}>
              <option value="wire">Bank transfer</option>
              <option value="escrow">Escrow / stakeholder account</option>
              <option value="crypto">Crypto-assets</option>
              <option value="mixed">Mixed</option>
              <option value="cash">Cash</option>
            </Select>
          </Field>
          <Field label="Country the funds are sent from" htmlFor="f-origin" error={err("funds.fundsOriginCountry")}>
            {countrySelect("f-origin", funds.fundsOriginCountry, (v) => setFunds({ ...funds, fundsOriginCountry: v }))}
          </Field>
          <label className="flex items-center gap-2 text-[13.5px] sm:col-span-2">
            <input type="checkbox" checked={!funds.payerIsBuyer} onChange={(e) => setFunds({ ...funds, payerIsBuyer: !e.target.checked })} className="size-4 accent-[#0b1b2b]" />
            The funds will be paid by someone other than the buyer
          </label>
          {!funds.payerIsBuyer ? (
            <>
              <Field label="Paying party (name)" htmlFor="f-payer" error={err("funds.payerName")}>
                <Input id="f-payer" value={funds.payerName} onChange={(e) => setFunds({ ...funds, payerName: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" htmlFor="f-pkind">
                  <Select id="f-pkind" value={funds.payerKind} onChange={(e) => setFunds({ ...funds, payerKind: e.target.value })}>
                    <option value="entity">Entity</option>
                    <option value="person">Individual</option>
                  </Select>
                </Field>
                <Field label="Country" htmlFor="f-pcountry">
                  {countrySelect("f-pcountry", funds.payerCountry, (v) => setFunds({ ...funds, payerCountry: v }))}
                </Field>
              </div>
            </>
          ) : null}
          <Field label="Source of funds" htmlFor="f-sof" error={err("funds.sourceOfFunds")} hint="Where the money for this purchase comes from (e.g. sale of a company, dividends, bank facility)." className="sm:col-span-2">
            <Textarea id="f-sof" rows={3} value={funds.sourceOfFunds} onChange={(e) => setFunds({ ...funds, sourceOfFunds: e.target.value })} />
          </Field>
          <Field label="Source of wealth" htmlFor="f-sow" error={err("funds.sourceOfWealth")} hint="How the beneficial owner's overall wealth was generated." className="sm:col-span-2">
            <Textarea id="f-sow" rows={3} value={funds.sourceOfWealth} onChange={(e) => setFunds({ ...funds, sourceOfWealth: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section n={4} title="Purpose">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Intended use of the asset" htmlFor="p-purpose">
            <Select id="p-purpose" value={purpose.purpose} onChange={(e) => setPurpose({ ...purpose, purpose: e.target.value })}>
              <option value="private_use">Private use by the beneficial owner(s)</option>
              <option value="commercial_charter">Commercial charter / operation</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Details (optional)" htmlFor="p-details">
            <Input id="p-details" value={purpose.purposeDetails} onChange={(e) => setPurpose({ ...purpose, purposeDetails: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section n={5} title="Documents">
        <Notice tone="sea" className="mb-4">
          Usually requested: passport and proof of address for each beneficial owner; certificate of incorporation, registers of directors and members for each entity; a
          trust deed or trustee declaration; a bank or lawyer&apos;s letter evidencing the funds. PDF or photos, up to 10 MB each.
        </Notice>
        <div className="space-y-3">
          {docs.map((d, i) => (
            <div key={d.id} className="grid gap-3 rounded-xl border border-line bg-white p-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-center">
              <Select aria-label="Document type" value={d.category} onChange={(e) => setDocs(docs.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}>
                {Object.entries(categories)
                  .filter(([k]) => k !== "sale_agreement")
                  .map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
              </Select>
              <Select aria-label="Relates to" value={d.party} onChange={(e) => setDocs(docs.map((x, j) => (j === i ? { ...x, party: e.target.value } : x)))}>
                {partyOptions.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <input
                type="file"
                aria-label="File"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                onChange={(e) => setDocs(docs.map((x, j) => (j === i ? { ...x, file: e.target.files?.[0] ?? null } : x)))}
                className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium"
              />
              <Button type="button" variant="ghost" size="sm" aria-label="Remove document" onClick={() => setDocs(docs.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {docs.length < 20 ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setDocs([...docs, { id: Date.now(), category: "passport", party: "deal", file: null }])}>
              <Plus className="size-4" /> Add document
            </Button>
          ) : null}
        </div>
      </Section>

      <Section n={6} title="Declarations">
        <div className="space-y-3 text-[14px]">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={declarations.accurate} onChange={(e) => setDeclarations({ ...declarations, accurate: e.target.checked })} className="mt-0.5 size-4 accent-[#0b1b2b]" />
            <span>I confirm the information provided is accurate and complete, and I am authorised to provide it on behalf of the buyer.</span>
          </label>
          {err("declarations.accurate") ? <p className="text-[12px] text-bad">Please confirm.</p> : null}
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={declarations.consent} onChange={(e) => setDeclarations({ ...declarations, consent: e.target.checked })} className="mt-0.5 size-4 accent-[#0b1b2b]" />
            <span>I understand the information will be processed and retained for anti-money-laundering purposes as described below.</span>
          </label>
          {err("declarations.consent") ? <p className="text-[12px] text-bad">Please confirm.</p> : null}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {pending ? "Encrypting & submitting…" : "Submit securely"}
        </Button>
      </div>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-[17px] font-semibold">
        <span className="grid size-7 place-items-center rounded-full bg-ink font-mono text-[12px] text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
