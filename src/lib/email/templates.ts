import { config } from "@/lib/config";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0b1b2b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2d8;border-radius:12px">
<tr><td style="padding:28px 32px 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8a6d3b">Ensign</td></tr>
<tr><td style="padding:0 32px 8px;font-size:22px;line-height:1.3;font-family:Georgia,serif">${esc(title)}</td></tr>
<tr><td style="padding:8px 32px 28px;font-size:15px;line-height:1.6;color:#22313f">${bodyHtml}</td></tr>
</table>
<p style="font-size:12px;color:#7a8794;margin-top:16px">Ensign · AML files for high-value transactions</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#0b1b2b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">${esc(label)}</a></p>`;
}

export function passwordResetEmail(name: string, link: string) {
  const subject = "Reset your Ensign password";
  const text = `Hello ${name},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`;
  const html = layout(
    "Reset your password",
    `<p>Hello ${esc(name)},</p><p>Use the button below to choose a new password. The link is valid for one hour.</p>${button(link, "Choose a new password")}<p style="color:#7a8794;font-size:13px">If you didn't ask for this, you can ignore this email.</p>`,
  );
  return { subject, text, html };
}

export function inviteEmail(name: string, orgName: string, inviter: string, link: string) {
  const subject = `${inviter} invited you to ${orgName} on Ensign`;
  const text = `Hello ${name},\n\n${inviter} added you to ${orgName}'s compliance workspace on Ensign.\nSet your password here (valid for 7 days):\n${link}`;
  const html = layout(
    `Join ${orgName} on Ensign`,
    `<p>Hello ${esc(name)},</p><p>${esc(inviter)} added you to <strong>${esc(orgName)}</strong>'s compliance workspace.</p>${button(link, "Set your password")}<p style="color:#7a8794;font-size:13px">This link is valid for 7 days.</p>`,
  );
  return { subject, text, html };
}

export function welcomeEmail(name: string) {
  const link = `${config.appUrl}/app`;
  const subject = "Your Ensign workspace is ready";
  const text = `Hello ${name},\n\nYour 14-day trial has started. Open your first deal file: ${link}\n\nThe fastest path: create a deal, send the buyer's lawyer a secure KYC link, and let Ensign screen and score the file.`;
  const html = layout(
    "Your workspace is ready",
    `<p>Hello ${esc(name)},</p><p>Your 14-day trial has started. The fastest path to value:</p><ol><li>Open a deal file (asset, price, parties).</li><li>Send the buyer's representative a secure KYC link.</li><li>Ensign screens everyone in the ownership chain and scores the deal.</li></ol>${button(link, "Open your workspace")}`,
  );
  return { subject, text, html };
}

export function kycInviteEmail(p: {
  recipientName: string;
  orgName: string;
  reference: string;
  message?: string | null;
  link: string;
  expires: Date;
}) {
  const subject = `${p.orgName} — secure due-diligence request (${p.reference})`;
  const text = `Dear ${p.recipientName},\n\n${p.orgName} asks you to complete the customer due-diligence file for transaction ${p.reference}.\n${p.message ? `\n${p.message}\n` : ""}\nSecure link (expires ${p.expires.toDateString()}):\n${p.link}\n\nThe information is required under applicable anti-money-laundering legislation and is handled confidentially.`;
  const html = layout(
    "Secure due-diligence request",
    `<p>Dear ${esc(p.recipientName)},</p><p><strong>${esc(p.orgName)}</strong> asks you to complete the customer due-diligence file for transaction <strong>${esc(p.reference)}</strong>.</p>${
      p.message ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f6f4ef;border-radius:8px">${esc(p.message)}</blockquote>` : ""
    }${button(p.link, "Open secure form")}<p style="color:#7a8794;font-size:13px">Link expires ${esc(p.expires.toDateString())}. The information is required under applicable anti-money-laundering legislation and is handled confidentially.</p>`,
  );
  return { subject, text, html };
}

export function kycSubmittedEmail(p: { orgName: string; reference: string; assetName: string; submitter: string; link: string }) {
  const subject = `KYC received for ${p.reference} — ${p.assetName}`;
  const text = `${p.submitter} submitted the due-diligence file for ${p.reference} (${p.assetName}).\nScreening and risk scoring have run automatically. Review: ${p.link}`;
  const html = layout(
    "Client KYC received",
    `<p><strong>${esc(p.submitter)}</strong> submitted the due-diligence file for <strong>${esc(p.reference)}</strong> (${esc(p.assetName)}).</p><p>Screening and risk scoring have run automatically.</p>${button(p.link, "Review the file")}`,
  );
  return { subject, text, html };
}

export function monitoringAlertEmail(p: { orgName: string; partyName: string; reference: string; link: string }) {
  const subject = `Monitoring alert: new potential match for ${p.partyName}`;
  const text = `Daily re-screening found a new potential sanctions/PEP match for ${p.partyName} (deal ${p.reference}).\nReview: ${p.link}`;
  const html = layout(
    "New potential match",
    `<p>Daily re-screening found a <strong>new potential sanctions/PEP match</strong> for <strong>${esc(p.partyName)}</strong> (deal ${esc(p.reference)}).</p>${button(p.link, "Review the match")}`,
  );
  return { subject, text, html };
}

export function trialEndingEmail(name: string, days: number) {
  const link = `${config.appUrl}/app/billing`;
  const subject = `Your Ensign trial ends in ${days} day${days === 1 ? "" : "s"}`;
  const text = `Hello ${name},\n\nYour trial ends in ${days} day(s). Your files stay accessible either way (you must retain them for 5 years); a plan keeps screening, monitoring and new deal files running: ${link}`;
  const html = layout(
    `Your trial ends in ${days} day${days === 1 ? "" : "s"}`,
    `<p>Hello ${esc(name)},</p><p>Your files stay accessible either way — you must retain them for five years. A plan keeps screening, daily monitoring and new deal files running.</p>${button(link, "Choose a plan")}`,
  );
  return { subject, text, html };
}
