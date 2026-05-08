import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"ThChat" <${process.env.SMTP_USER}>`,
    to,
    subject: "รีเซ็ตรหัสผ่าน ThChat",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fafafa;border-radius:12px">
        <h2 style="color:#7c3aed;margin:0 0 8px">รีเซ็ตรหัสผ่าน</h2>
        <p style="color:#555;margin:0 0 24px">คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี ThChat ของคุณ</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
          รีเซ็ตรหัสผ่าน
        </a>
        <p style="color:#999;font-size:13px;margin:24px 0 0">
          ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง<br>
          หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยอีเมลนี้ได้เลย
        </p>
      </div>
    `,
  });
}
