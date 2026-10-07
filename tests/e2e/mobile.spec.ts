import { expect, test } from "@playwright/test";
import { horizontalOverflow } from "./helpers";

for (const path of ["/", "/pricing", "/amlr-readiness", "/aml-for-yacht-brokers", "/login", "/signup", "/demo"]) {
  test(`mobile layout has no horizontal scroll: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
}

test("mobile navigation opens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Pricing" }).last()).toBeVisible();
});

test("mobile demo workspace and client portal fit the screen", async ({ page, browser }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Enter the demo workspace/ }).click();
  await expect(page).toHaveURL(/\/app$/, { timeout: 60_000 });
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  const link = await page.getByRole("textbox", { name: "Link" }).inputValue();
  await page.goto("/app/deals");
  await page.getByRole("link", { name: /M\/Y AURELIA/ }).click();
  await expect(page.getByText("Risk assessment")).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Customer due-diligence file" })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});
