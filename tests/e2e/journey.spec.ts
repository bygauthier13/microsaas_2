import { expect, test, type Page } from "@playwright/test";
import { samplePdf } from "./helpers";

const stamp = Date.now();
const email = `camille+${stamp}@riviera-test.example`;
const password = "Correct-Horse-42!";
const newPassword = "Battery-Staple-77!";
let dealUrl = "";

test.describe.configure({ mode: "serial" });

test("visitor: landing, pricing, guides and readiness check", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The AML file for every superyacht deal");
  await expect(page.getByText("days left").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Start 14-day trial/ }).first()).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByText("€490").first()).toBeVisible();
  await page.getByRole("radio", { name: /Yearly/ }).click();
  await expect(page.getByText("€4,900").first()).toBeVisible();

  await page.goto("/aml-for-yacht-brokers");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AML for yacht brokers");
  await page.goto("/amlr-article-74-threshold-reporting");
  await expect(page.getByText("EUR 7 500 000").first()).toBeVisible();

  await page.goto("/amlr-readiness");
  const groups = page.getByRole("radiogroup");
  const n = await groups.count();
  for (let i = 0; i < n; i++) await groups.nth(i).getByRole("radio", { name: i % 3 === 0 ? "yes" : "no", exact: true }).click();
  await page.getByRole("button", { name: "See my result" }).click();
  await expect(page.getByText("Your readiness score").first()).toBeVisible();
  await expect(page.getByText("What to fix").first()).toBeVisible();
  await page.getByLabel("Work email").fill(`lead+${stamp}@example.com`);
  await page.getByLabel("Firm").fill("Test Yachts");
  await page.getByRole("button", { name: "Send it" }).click();
  await expect(page.getByText(/we.ll send your gap list/).first()).toBeVisible();

  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/aml-for-yacht-brokers");
});

test("protected routes and APIs reject anonymous access", async ({ page, request }) => {
  await page.goto("/app/deals");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fdeals/);
  expect((await request.get("/api/documents/00000000-0000-0000-0000-000000000000")).status()).toBe(401);
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  const cron = await request.get("/api/cron/daily", { headers: { authorization: "Bearer test-cron-secret" } });
  expect(cron.status()).toBe(200);
  expect((await cron.json()).ok).toBe(true);
});

test("signup → onboarding → first deal file with live Article 74 check", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Camille Laurent");
  await page.getByLabel("Firm").fill("Riviera Test Brokers");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/app\/onboarding/);
  await page.getByLabel("Country of establishment").selectOption("FR");
  await page.getByLabel("Company registration number").fill("RCS Antibes 123 456 789");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/app\?welcome=1/);
  await expect(page.getByRole("heading", { name: "Open your first deal file" })).toBeVisible();
  await page.getByRole("link", { name: /Open a deal file/ }).first().click();

  await expect(page).toHaveURL(/\/app\/deals\/new/);
  await page.getByLabel("Asset name").fill("M/Y TEST AURORA — 48m Feadship (2018)");
  await page.getByRole("textbox", { name: "Price", exact: true }).fill("38500000");
  await expect(page.getByText("Article 74 threshold report required").first()).toBeVisible();
  await page.getByRole("textbox", { name: "Price", exact: true }).fill("7000000");
  await expect(page.getByText(/within 10%/).first()).toBeVisible();
  await page.getByRole("textbox", { name: "Price", exact: true }).fill("38500000");
  await page.getByRole("button", { name: "Open deal file" }).click();

  await expect(page).toHaveURL(/\/app\/deals\/[0-9a-f-]+\?created=1/);
  dealUrl = page.url().split("?")[0];
  await expect(page.getByRole("heading", { level: 1 })).toContainText("M/Y TEST AURORA");
  await expect(page.getByText("Deal file opened").first()).toBeVisible();
});

async function partyForm(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("button", { name: /Add & screen/ }) });
}

test("broker adds parties manually: BVI SPV needs a UBO, Monaco UBO triggers EDD", async ({ page }) => {
  await login(page, email, password);
  await page.goto(dealUrl);
  await page.getByRole("button", { name: "Add a party manually" }).click();
  let form = await partyForm(page);
  await form.getByLabel("Type").selectOption("entity");
  await form.getByLabel("Full legal name").fill("Lumen Maritime Holdings Ltd");
  await form.getByLabel("Jurisdiction").selectOption("VG");
  await form.getByRole("button", { name: /Add & screen/ }).click();
  await expect(page.getByText("Lumen Maritime Holdings Ltd added and screened.").first()).toBeVisible();
  await expect(page.getByText("Identify the beneficial owner(s) of Lumen Maritime Holdings Ltd").first()).toBeVisible();

  form = await partyForm(page);
  await form.getByLabel("Role").selectOption("beneficial_owner");
  await form.getByLabel("Full legal name").fill("Aleksander Varga");
  await form.getByLabel("Nationality").selectOption("HU");
  await form.getByLabel("Country of residence").selectOption("MC");
  await form.getByLabel("Ownership %").fill("100");
  await form.getByRole("button", { name: /Add & screen/ }).click();
  await expect(page.getByText("Aleksander Varga added and screened.").first()).toBeVisible();
  await expect(page.getByText("EU high-risk third country involved").first()).toBeVisible();
  await expect(page.getByText("Enhanced due diligence").first()).toBeVisible();
  await expect(page.getByText("Offshore holding vehicle").first()).toBeVisible();
});

test("client KYC link: the buyer's lawyer submits the file; screening flags a potential match", async ({ page, browser }) => {
  await login(page, email, password);
  await page.goto(dealUrl);
  await page.getByRole("button", { name: "Request client KYC" }).click();
  await page.getByLabel("Recipient").fill("Dmitri Orlanski");
  await page.getByLabel("Email the link now").uncheck();
  await page.getByRole("button", { name: "Create secure link" }).click();
  const linkInput = page.getByRole("textbox", { name: "Link" });
  await expect(linkInput).toBeVisible();
  const link = await linkInput.inputValue();
  expect(link).toMatch(/\/kyc\/[A-Za-z0-9_-]{40,}/);

  // The client has no account: use a fresh browser context.
  const ctx = await browser.newContext();
  const client = await ctx.newPage();
  await client.goto(link);
  await expect(client.getByRole("heading", { name: "Customer due-diligence file" })).toBeVisible();
  await expect(client.getByText("Riviera Test Brokers").first()).toBeVisible();
  await client.getByLabel("Your email").fill("d.orlanski@kanzlei.example");
  await client.getByLabel("Legal name", { exact: true }).fill("Marlin Bay Holdings Inc");
  await client.getByLabel("Jurisdiction of incorporation").selectOption("MH");
  await client.getByLabel("Full legal name (as in passport)").fill("Sofia Lindqvist");
  await client.getByLabel("Date of birth").fill("1969-02-14");
  await client.getByLabel("Nationality").selectOption("SE");
  await client.getByLabel("Country of residence").selectOption("CH");
  await client.getByLabel("Ownership %").fill("100");
  await client.getByLabel("Country the funds are sent from").selectOption("CH");
  await client.getByLabel("Source of funds").fill("Proceeds from the 2024 sale of a Nordic software company, held at a Zurich private bank.");
  await client.getByLabel("Source of wealth").fill("Founder and majority shareholder of a software group for 20 years; dividends and exit proceeds.");
  await client.getByRole("button", { name: "Submit securely" }).click();
  await expect(client.getByText("Please confirm.").first()).toBeVisible();
  await client.getByLabel(/I confirm the information provided is accurate/).check();
  await client.getByLabel(/I understand the information will be processed/).check();
  await client.getByLabel("File").first().setInputFiles(samplePdf("Passport Sofia Lindqvist"));
  await client.getByRole("button", { name: "Submit securely" }).click();
  await expect(client.getByRole("heading", { name: /Thank you/ })).toBeVisible();
  await client.goto(link);
  await expect(client.getByText(/already been submitted/).first()).toBeVisible();
  await ctx.close();

  await page.reload();
  await expect(page.getByText("Marlin Bay Holdings Inc").first()).toBeVisible();
  await expect(page.getByText("Potential matches to review").first()).toBeVisible();
  await expect(page.getByText("Dmitri Valerievich Orlansky").first()).toBeVisible();
});

test("compliance review: clear the false positive, approve with grounds, complete and file Article 74", async ({ page }) => {
  await login(page, email, password);
  await page.goto(dealUrl);
  await page.getByLabel(/Your conclusion/).fill("Different person: German lawyer born 1990, admitted to the Munich bar; no RU nexus.");
  await page.getByRole("button", { name: "Clear as false positive" }).click();
  await expect(page.getByText("Potential matches to review")).toBeHidden();

  await page.getByLabel("Grounds for the decision").fill("EDD completed: Monaco UBO identified, funds from a Swiss private bank evidenced. Approved by senior management.");
  await page.getByRole("button", { name: "Approve deal" }).click();
  await expect(page.getByText(/Approved by Camille Laurent/).first()).toBeVisible();

  await page.getByRole("button", { name: "Mark sale completed" }).click();
  await expect(page.getByText("Completed").first()).toBeVisible();
  await page.getByRole("button", { name: "Prepare report" }).click();
  await expect(page.getByText(/^prepared$/i).first()).toBeVisible();
  await page.getByLabel("FIU acknowledgement reference").fill("TRACFIN-2027-000123");
  await page.getByRole("button", { name: "Record submission" }).click();
  await expect(page.getByText("TRACFIN-2027-000123").first()).toBeVisible();

  const id = dealUrl.split("/").pop();
  await page.goto(`/app/deals/${id}/file`);
  await expect(page.getByText("Customer due-diligence file · Confidential").first()).toBeVisible();
  await expect(page.getByText("Screening log (sanctions, PEP, watchlists)").first()).toBeVisible();
  await expect(page.getByText(/Cleared as false positive by Camille Laurent/).first()).toBeVisible();

  const json = await page.request.get(`/api/deals/${id}/report`);
  expect(json.status()).toBe(200);
  const body = await json.json();
  expect(body.schema).toBe("ensign.article74.v1");
  expect(body.recipientFiu.name).toBe("TRACFIN");

  await page.goto(`/app/deals/${id}`);
  const href = await page.getByRole("link", { name: "Open", exact: true }).first().getAttribute("href");
  const doc = await page.request.get(href!);
  expect(doc.status()).toBe(200);
  expect(doc.headers()["content-type"]).toBe("application/pdf");
});

test("billing: simulated checkout, active subscription, cancellation", async ({ page }) => {
  await login(page, email, password);
  await page.goto("/app/billing");
  await expect(page.getByText("Free trial · Brokerage features").first()).toBeVisible();
  await page.getByRole("button", { name: "Subscribe to Brokerage" }).click();
  await expect(page).toHaveURL(/mock-checkout/);
  await page.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(page.getByText("Subscription active").first()).toBeVisible();
  await expect(page.getByText(/Renews on/).first()).toBeVisible();
  await page.getByRole("button", { name: "Cancel subscription" }).click();
  await expect(page.getByText(/Cancels on/).first()).toBeVisible();
});

test("settings, team invite, outbox and admin guard", async ({ page }) => {
  await login(page, email, password);
  await page.goto("/app/settings");
  await page.getByLabel("Additional high-risk countries (ISO codes)").fill("AE, TR");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.").first()).toBeVisible();
  // Two server actions fired within ~100 ms on one page can queue behind the first refresh; a real user navigates in between.
  await page.reload();
  await expect(page.getByLabel("Additional high-risk countries (ISO codes)")).toHaveValue("AE, TR");
  const invite = page.locator("form").filter({ has: page.getByRole("button", { name: "Invite teammate" }) });
  await invite.getByLabel("Name").fill("Hugo Martin");
  await invite.getByLabel("Email").fill(`hugo+${stamp}@riviera-test.example`);
  await invite.getByRole("button", { name: "Invite teammate" }).click();
  await expect(page.getByText(/Invitation sent/).first()).toBeVisible();
  await page.goto("/app/outbox");
  await expect(page.getByText(/invited you to Riviera Test Brokers/).first()).toBeVisible();
  // Non-admins get a real 404 and no data.
  const admin = await page.goto("/app/admin");
  expect(admin?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
  await expect(page.getByText("Activation funnel")).toHaveCount(0);
});

test("logout, password reset via email link, login with the new password", async ({ page }) => {
  await login(page, email, password);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login\?signed_out=1/);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/a reset link is on its way/).first()).toBeVisible();

  await page.goto("/dev/outbox");
  const mail = page.getByTestId("dev-email").filter({ hasText: email }).filter({ hasText: "Reset your Ensign password" }).first();
  const text = await mail.getByTestId("dev-email-text").innerText();
  const resetLink = text.match(/https?:\/\/\S+reset-password\?token=[\w-]+/)![0];
  await page.goto(resetLink.replace(/^https?:\/\/[^/]+/, ""));
  await page.getByLabel("New password").fill(newPassword);
  await page.getByLabel("Confirm password").fill(newPassword);
  await page.getByRole("button", { name: "Save password" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.").first()).toBeVisible();
  await login(page, email, newPassword);
  await expect(page.getByRole("heading", { name: /Good day, Camille/ })).toBeVisible();
});

test("demo mode: fictional workspace, seeded files and the buyer's view", async ({ page, browser }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Enter the demo workspace/ }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
  await expect(page.getByText("Demo workspace.").first()).toBeVisible();
  await expect(page.getByText("M/Y AURELIA — 52m Benetti (2019)").first()).toBeVisible();
  const clientLink = await page.getByRole("textbox", { name: "Link" }).inputValue();

  await page.goto("/app/deals");
  await expect(page.getByRole("row")).toHaveCount(7);
  await page.getByRole("link", { name: /M\/Y AURELIA/ }).click();
  await expect(page.getByText("Potential matches to review").first()).toBeVisible();
  await expect(page.getByText("Ownership chain").first()).toBeVisible();
  await page.goto("/app/deals");
  await page.getByRole("link", { name: /NORDIC STAR/ }).click();
  await expect(page.getByText("Do not proceed").first()).toBeVisible();

  const ctx = await browser.newContext();
  const client = await ctx.newPage();
  await client.goto(clientLink);
  await expect(client.getByRole("heading", { name: "Customer due-diligence file" })).toBeVisible();
  await ctx.close();
});

async function login(page: Page, mail: string, pw: string) {
  await page.goto("/login");
  if (!page.url().includes("/login")) return;
  await page.getByLabel("Work email").fill(mail);
  await page.getByLabel("Password").fill(pw);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app/);
}
