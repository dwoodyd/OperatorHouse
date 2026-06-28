/**
 * Test script for Resend email integration
 * Usage: pnpm exec tsx scripts/test-resend.ts <email@example.com>
 */
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Operator House <ops@mail.operatorhouse.click>';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in environment');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function testResend(toEmail: string) {
  console.log(`\n🚀 Testing Resend integration...`);
  console.log(`   From: ${EMAIL_FROM}`);
  console.log(`   To: ${toEmail}\n`);

  try {
    // Test 1: Plain text email
    console.log('📧 Test 1: Sending plain text email...');
    const textResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: 'Operator House — Test 1 (Plain Text)',
      text: `Hi there,

This is a test email from Operator House's Resend integration.

If you're receiving this, email delivery is working correctly.

Test details:
- Type: Plain text
- Timestamp: ${new Date().toISOString()}
- API Key: ${RESEND_API_KEY.slice(0, 8)}...${RESEND_API_KEY.slice(-4)}

— Operator House / SoulOps`,
    });

    if (textResult.error) {
      throw new Error(`Plain text test failed: ${textResult.error.message}`);
    }
    console.log(`   ✅ Plain text sent! Message ID: ${textResult.data?.id}\n`);

    // Test 2: HTML email
    console.log('📧 Test 2: Sending HTML email...');
    const htmlResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: 'Operator House — Test 2 (HTML)',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resend Test</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #d4a853 0%, #b8923d 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
    <h1 style="margin: 0; color: #fff; font-size: 24px;">✓ Resend Integration Working</h1>
    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9);">Your email configuration is correct</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h2 style="margin-top: 0; color: #333;">Test Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Test Type</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">HTML Formatted</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Timestamp</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">From</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 500;">${EMAIL_FROM}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Status</td>
        <td style="padding: 8px 0; font-weight: 500; color: #10b981;">✓ Delivered</td>
      </tr>
    </table>
  </div>
  
  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
    — Operator House / SoulOps
  </p>
</body>
</html>`,
    });

    if (htmlResult.error) {
      throw new Error(`HTML test failed: ${htmlResult.error.message}`);
    }
    console.log(`   ✅ HTML sent! Message ID: ${htmlResult.data?.id}\n`);

    // Test 3: Soul Engineer template
    console.log('📧 Test 3: Sending Soul Engineer template...');
    const templateResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: "Your team's time — Test Recipient",
      text: `Hi Test Recipient,

I was looking at what your company is building and had a specific thought.

Most leaders I work with aren't short on talent. They're short on *time* — drowning in repetitive work that keeps smart people busy but doesn't move the business forward.

I help high-capacity leaders reclaim 10+ hours a week by building AI systems that handle the work nobody should be doing manually.

Not templates. Not chatbots. Actual systems that run your operations.

Worth a 15-minute conversation about where your team is losing the most time?

— DeWayne Woods
Soul Engineer

P.S. — If this isn't the right time, just reply "later" and I'll check back in a few months. No drip sequences, no automated follow-ups. I write every email myself.

---
This is a TEST EMAIL from the Soul Engineer template library.`,
    });

    if (templateResult.error) {
      throw new Error(`Template test failed: ${templateResult.error.message}`);
    }
    console.log(`   ✅ Template sent! Message ID: ${templateResult.data?.id}\n`);

    console.log('🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   • Plain text: ${textResult.data?.id}`);
    console.log(`   • HTML:       ${htmlResult.data?.id}`);
    console.log(`   • Template:   ${templateResult.data?.id}`);
    console.log(`\n📬 Check ${toEmail} for the test emails.`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
const toEmail = process.argv[2];
if (!toEmail) {
  console.error('Usage: pnpm exec tsx scripts/test-resend.ts <email@example.com>');
  process.exit(1);
}

testResend(toEmail);
