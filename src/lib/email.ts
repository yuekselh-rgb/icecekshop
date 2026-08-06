import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export async function sendMail(
  to: string,
  subject: string,
  html: string,
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

function renderEmailLayout({
  title,
  intro,
  code,
  note,
}: {
  title: string;
  intro: string;
  code: string;
  note: string;
}) {
  return `
    <div style="margin:0;padding:32px 16px;background-color:#f7f7f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr>
          <td style="background-color:#0f172a;padding:28px 32px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:0.5px;">
              Fluss <span style="color:#f97316;">Getränke</span>
            </span>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 32px 8px 32px;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;">
              ${title}
            </h1>

            <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#64748b;">
              ${intro}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;text-align:center;">
            <div style="display:inline-block;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:18px 32px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#f97316;">
                ${code}
              </span>
            </div>

            <p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;">
              Der Code ist 10 Minuten gültig.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 32px 32px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">
              ${note}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px;background-color:#f8fafc;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              © ${new Date().getFullYear()} Fluss Getränke
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendVerificationCode(
  to: string,
  code: string,
) {
  await sendMail(
    to,
    "Fluss Getränke - E-Mail Bestätigung",
    renderEmailLayout({
      title: "Willkommen bei Fluss Getränke",
      intro: "Bitte bestätigen Sie Ihre E-Mail-Adresse mit dem folgenden Code:",
      code,
      note: "Falls Sie sich nicht registriert haben, können Sie diese E-Mail einfach ignorieren.",
    }),
  );
}

export async function sendPasswordResetCode(
  to: string,
  code: string,
) {
  await sendMail(
    to,
    "Fluss Getränke - Passwort zurücksetzen",
    renderEmailLayout({
      title: "Passwort zurücksetzen",
      intro: "Verwenden Sie den folgenden Code, um Ihr Passwort zurückzusetzen:",
      code,
      note: "Falls Sie das nicht angefordert haben, können Sie diese E-Mail einfach ignorieren.",
    }),
  );
}
