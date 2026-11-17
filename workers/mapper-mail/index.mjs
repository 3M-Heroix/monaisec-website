const origin = 'https://monaisec.com';
const path = '/mapper-report';
const sender = 'contact@monaisec.com';
const filename = 'monaisec-regulatory-scoping-brief.pdf';
const security = {
  'cache-control': 'no-store',
  'referrer-policy': 'same-origin',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; script-src https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src https://challenges.cloudflare.com; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors https://monaisec.com",
};

function page(siteKey, message = '', status = 200, sent = false) {
  const challenge = siteKey && !sent ? `
    <form method="post" action="${path}">
      <label for="email">Your email address</label>
      <div class="field">
        <input id="email" name="email" type="email" required maxlength="254" autocomplete="email" placeholder="you@example.com">
        <button>Send PDF</button>
      </div>
      <p>MONAISEC uses this address to send the PDF via Brevo.</p>
      <div class="cf-turnstile" data-sitekey="${siteKey}" data-action="mapper_report" data-size="compact" data-theme="light"></div>
    </form>` : '';
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><title>Email the MONAISEC brief</title>
    <style>
    *{box-sizing:border-box}body{margin:0;background:#eaf3ec;color:#15372a;font:15px system-ui;padding:16px;border-radius:12px}
    label{display:block;font-weight:700;margin-bottom:8px}p{margin:.65rem 0;font-size:.92rem}
    .field{display:flex;flex-wrap:wrap;gap:8px}input,button{border-radius:8px;padding:.7rem;font:inherit}
    input{flex:1;min-width:150px;border:1px solid #547460;color:#15372a}button{background:#15372a;color:white;border:0;cursor:pointer}
    </style>
    ${challenge ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>' : ''}
    ${message ? `<p role="status">${message}</p>` : ''}${challenge}</html>`,
  {status, headers: {...security, 'content-type': 'text/html; charset=utf-8'}});
}

function available(env) {
  return Boolean(env.BREVO_API_KEY && env.TURNSTILE_SECRET &&
    /^[A-Za-z0-9_-]+$/.test(env.TURNSTILE_SITE_KEY || '') && env.REPORT_LIMIT);
}

function base64(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

async function send(request, env, hostname) {
  const siteKey = env.TURNSTILE_SITE_KEY;
  const type = request.headers.get('content-type') || '';
  if (type.split(';')[0] !== 'application/x-www-form-urlencoded') {
    return page(siteKey, 'Use the report email form.', 415);
  }
  if (request.headers.get('origin') !== `https://${hostname}`) {
    return page('', 'Open the email form again to submit this request.', 403);
  }
  const size = Number(request.headers.get('content-length'));
  if (!size || size > 4096) return page(siteKey, 'This request is too large or incomplete.', 400);
  const fields = new URLSearchParams(await request.text());
  if (fields.size !== 2 || fields.getAll('email').length !== 1 ||
      fields.getAll('cf-turnstile-response').length !== 1) {
    return page(siteKey, 'Use one email address and complete the verification.', 400);
  }
  const email = fields.get('email').trim();
  const token = fields.get('cf-turnstile-response');
  if (email.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) ||
      !token || token.length > 2048) {
    return page(siteKey, 'Enter a valid email address and complete the verification.', 400);
  }
  const ip = request.headers.get('cf-connecting-ip') || 'missing';
  if (!(await env.REPORT_LIMIT.limit({key: `ip:${ip}`})).success) {
    return page(siteKey, 'Too many requests. Try again in a minute or download the PDF.', 429);
  }
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({secret: env.TURNSTILE_SECRET, response: token}),
    signal: AbortSignal.timeout(6000),
  });
  const verified = response.ok ? await response.json() : null;
  if (!verified?.success || verified.hostname !== hostname || verified.action !== 'mapper_report') {
    return page(siteKey, 'Verification did not complete. Please try again.', 403);
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
  const recipientKey = [...new Uint8Array(digest)].map(part => part.toString(16).padStart(2, '0')).join('');
  if (!(await env.REPORT_LIMIT.limit({key: `recipient:${recipientKey}`})).success) {
    return page(siteKey, 'Too many requests. Try again in a minute or download the PDF.', 429);
  }
  const report = await fetch(`${origin}/assets/reports/${filename}`, {
    redirect: 'error',
    signal: AbortSignal.timeout(6000),
  });
  if (!report.ok || Number(report.headers.get('content-length')) > 150_000) throw new Error('Report asset unavailable');
  const bytes = await report.bytes();
  if (bytes.length < 5 || bytes.length > 150_000 ||
      new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('Invalid report asset');
  }
  const mail = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {'content-type': 'application/json', 'api-key': env.BREVO_API_KEY},
    body: JSON.stringify({
      sender: {name: 'MONAISEC', email: sender},
      replyTo: {email: sender},
      to: [{email}],
      subject: 'Your MONAISEC regulatory scoping brief',
      textContent: 'Here is the MONAISEC Regulatory Scoping Brief you requested. The PDF includes review questions, evidence to gather and official sources.',
      attachment: [{name: filename, content: base64(bytes)}],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!mail.ok) throw new Error('Mail provider declined the request');
  return page('', 'Your PDF has been submitted for delivery. Check your inbox or spam folder.', 200, true);
}

export default {
  async fetch(request, env) {
    const {pathname, hostname} = new URL(request.url);
    const ready = available(env);
    if (request.method === 'GET' && pathname === `${path}/status`) {
      return Response.json({available: ready}, {
        headers: {'access-control-allow-origin': origin, 'cache-control': 'no-store'},
      });
    }
    if (pathname !== path) return new Response('Not found', {status: 404});
    if (!ready) return page('', 'Email delivery is unavailable. Download the PDF on the Mapper page.', 503);
    if (request.method === 'GET') return page(env.TURNSTILE_SITE_KEY);
    if (request.method !== 'POST') return new Response('Method not allowed', {status: 405, headers: {allow: 'GET, POST'}});
    try {
      return await send(request, env, hostname);
    } catch {
      return page(env.TURNSTILE_SITE_KEY, 'We could not confirm email delivery. Download the PDF on the Mapper page.', 502);
    }
  },
};
