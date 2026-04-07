//! Email sender — renders reply into HTML and sends via SMTP.
//! Uses `lettre` for SMTP (async, rustls-tls, no OpenSSL).

use anyhow::Result;
use super::Case;
use crate::config::MaildeskConfig;

/// Send a reply email for a case.
pub async fn send_reply(
    case: &Case,
    draft: &str,
    smtp_user: &str,
    smtp_pass: &str,
    config: &MaildeskConfig,
) -> Result<()> {
    use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
    use lettre::transport::smtp::authentication::Credentials;
    use lettre::message::{Message, SinglePart, header::ContentType};

    let html_body = render_html(case, draft, config);

    let email = Message::builder()
        .from(format!("{} <{}>", config.reply_name, smtp_user).parse()?)
        .to(case.from_email.parse()?)
        .subject(format!("Re: {}", case.subject))
        .singlepart(
            SinglePart::builder()
                .header(ContentType::TEXT_HTML)
                .body(html_body)
        )?;

    let creds = Credentials::new(smtp_user.to_string(), smtp_pass.to_string());
    let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)?
        .credentials(creds)
        .build();

    mailer.send(email).await?;
    tracing::info!("[sender] Reply sent to {}", case.from_email);
    Ok(())
}

/// Render draft text into a professional HTML email.
fn render_html(case: &Case, draft: &str, config: &MaildeskConfig) -> String {
    // Convert plain text to HTML paragraphs
    let body_html: String = draft.lines()
        .collect::<Vec<_>>()
        .split(|l| l.trim().is_empty())
        .map(|group| {
            let para: String = group.iter()
                .map(|l| html_escape(l))
                .collect::<Vec<_>>()
                .join("<br>");
            format!("<p style=\"margin:0 0 16px 0;\">{}</p>", para)
        })
        .collect::<Vec<_>>()
        .join("\n");

    let from_email = html_escape(&case.from_email);

    format!(
        r#"<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f4f5;color:#0f172a;font-family:'Segoe UI',system-ui,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0f4f5;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.08);">
<tr><td style="background:linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%);padding:24px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td><span style="font-size:18px;font-weight:700;color:#fff;">{reply_name}</span></td>
<td style="text-align:right;"><span style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:0.1em;text-transform:uppercase;">nano-zyrkel maildesk</span></td>
</tr></table>
</td></tr>
<tr><td style="padding:32px 32px 24px;">
<div style="font-size:15px;line-height:1.75;color:#1e293b;">{body}</div>
</td></tr>
<tr><td style="padding:0 32px 8px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
<tr><td style="padding:14px 20px;">
<div style="font-size:11px;color:#166534;margin-bottom:8px;font-weight:600;">Quick Response:</div>
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding-right:8px;"><a href="mailto:{from_email}?subject=Re: {subject}&amp;body=Danke, erledigt." style="display:inline-block;padding:6px 14px;background:#16a34a;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;font-weight:600;">&#10003; Erledigt</a></td>
<td style="padding-right:8px;"><a href="mailto:{from_email}?subject=Re: {subject}&amp;body=Bitte um Rueckruf." style="display:inline-block;padding:6px 14px;background:#2563eb;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;font-weight:600;">&#9742; Rueckruf</a></td>
<td><a href="mailto:{from_email}?subject=Re: {subject}" style="display:inline-block;padding:6px 14px;background:#64748b;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;font-weight:600;">&#9993; Antworten</a></td>
</tr></table>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 32px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:12px;">
<tr><td style="padding:16px 20px;">
<div style="font-size:14px;line-height:1.6;color:#334155;">{sig_name}<br>{sig_role}</div>
<div style="margin-top:8px;font-size:12px;color:#64748b;">Institute of Human Genetics<br>University Medical Center Hamburg-Eppendorf (UKE)</div>
</td></tr></table>
</td></tr>
</table>
<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;">
<tr><td style="padding:16px 32px;text-align:center;">
<p style="font-size:10px;color:#94a3b8;line-height:1.6;margin:0;">
This reply was autonomously drafted by an AI agent and reviewed &amp; approved by the group lead before dispatch.<br>
Generated by <a href="https://zyrkel.com" style="color:#64748b;text-decoration:none;">zyrkel.com</a> &middot; noticed &amp; approved by C. Schlein<br>
<a href="https://www.uke.de/kliniken-institute/institute/<group>/" style="color:#64748b;text-decoration:none;">Institute of Human Genetics, UKE Hamburg</a>
</p></td></tr></table>
</td></tr></table>
</body></html>"#,
        reply_name = html_escape(&config.reply_name),
        body = body_html,
        from_email = from_email,
        subject = html_escape(&case.subject),
        sig_name = html_escape(&config.sig_name),
        sig_role = html_escape(&config.sig_role),
    )
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
