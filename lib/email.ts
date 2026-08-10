// Email Utility Service
import { Resend } from 'resend';

export async function sendApplicationStatusEmail({
  to,
  name,
  status,
  notes,
}: {
  to: string;
  name: string;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n=================== [EMAIL LOG MOCK] ===================`);
    console.log(`STATUS: ${status}`);
    console.log(`TO: ${to} (${name})`);
    console.log(`NOTES: ${notes || 'N/A'}`);
    console.log(`========================================================\n`);
    return { success: true, mocked: true };
  }

  const isApproved = status === 'APPROVED';
  const subject = isApproved
    ? 'Welcome to Founders Edge — Your Membership Application is Approved!'
    : 'Update regarding your Founders Edge Membership Application';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
        <h2 style="color: #e7b605; margin-top: 0;">Congratulations ${name}!</h2>
        <p>Your membership application to <strong>Founders Edge</strong> has been reviewed and approved.</p>
        <p>Please click the link below to set up your account password and access your dashboard:</p>
        <div style="margin: 28px 0;">
          <a href="${appUrl}/setup-password?email=${encodeURIComponent(to)}" style="background: #e7b605; color: #000; padding: 14px 28px; font-weight: bold; text-decoration: none; display: inline-block;">Set Up Password & Activate Account</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
        <h2 style="color: #c0392b; margin-top: 0;">Update regarding your application</h2>
        <p>Hi ${name},</p>
        <p>Thank you for applying to <strong>Founders Edge</strong>. Our team reviewed your application and requested the following updates before we can complete your approval:</p>
        <div style="background: #fdf5f5; border-left: 4px solid #c0392b; padding: 16px; margin: 20px 0; color: #333; font-size: 14px; line-height: 1.6;">
          <strong>Feedback from Admin:</strong><br />
          ${notes || 'Please review your business details and resubmit.'}
        </div>
        <p>Please review and update your application details to proceed.</p>
        <div style="margin: 28px 0;">
          <a href="${appUrl}/apply?email=${encodeURIComponent(to)}" style="background: #000; color: #fff; padding: 14px 28px; font-weight: bold; text-decoration: none; display: inline-block;">Update Application</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
      </div>
    `;

  const resend = new Resend(apiKey);
  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Founders Edge <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send application status email via Resend:', err);
    return { error: err };
  }
}

export async function sendGuestEventApprovalEmail({
  to,
  guestName,
  eventTitle,
}: {
  to: string;
  guestName?: string;
  eventTitle: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n=================== [GUEST EVENT APPROVAL EMAIL MOCK] ===================`);
    console.log(`TO: ${to} (${guestName || 'Guest'})`);
    console.log(`EVENT: ${eventTitle}`);
    console.log(`========================================================================\n`);
    return { success: true, mocked: true };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const name = guestName || 'Event Host';

  const resend = new Resend(apiKey);
  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Founders Edge <onboarding@resend.dev>',
      to: [to],
      subject: `Your event "${eventTitle}" has been approved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
          <h2 style="color: #27ae60; margin-top: 0;">Event Listing Approved!</h2>
          <p>Hi ${name},</p>
          <p>Great news! Your event listing <strong>"${eventTitle}"</strong> has been reviewed and approved by the Founders Edge team.</p>
          <p>It is now live on our events calendar for community members and entrepreneurs to discover.</p>
          <div style="margin: 28px 0;">
            <a href="${appUrl}/events" style="background: #e7b605; color: #000; padding: 14px 28px; font-weight: bold; text-decoration: none; display: inline-block;">View Events Calendar</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send guest event approval email via Resend:', err);
    return { error: err };
  }
}

export async function sendGuestEventRejectionEmail({
  to,
  guestName,
  eventTitle,
}: {
  to: string;
  guestName?: string;
  eventTitle: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n=================== [GUEST EVENT REJECTION EMAIL MOCK] ===================`);
    console.log(`TO: ${to} (${guestName || 'Guest'})`);
    console.log(`EVENT: ${eventTitle}`);
    console.log(`=========================================================================\n`);
    return { success: true, mocked: true };
  }

  const name = guestName || 'Event Host';

  const resend = new Resend(apiKey);
  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Founders Edge <onboarding@resend.dev>',
      to: [to],
      subject: `Update regarding your event submission: "${eventTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
          <h2 style="color: #c0392b; margin-top: 0;">Event Submission Update</h2>
          <p>Hi ${name},</p>
          <p>Thank you for submitting your event <strong>"${eventTitle}"</strong> to Founders Edge.</p>
          <p>Unfortunately, your event listing could not be approved at this time as it did not meet our listing guidelines.</p>
          <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send guest event rejection email via Resend:', err);
    return { error: err };
  }
}

export async function sendOfferExpirationAlertEmail({
  to,
  name,
  offerTitle,
}: {
  to: string;
  name?: string;
  offerTitle: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n=================== [OFFER EXPIRATION EMAIL MOCK] ===================`);
    console.log(`TO: ${to} (${name || 'Member'})`);
    console.log(`OFFER: ${offerTitle}`);
    console.log(`======================================================================\n`);
    return { success: true, mocked: true };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const recipientName = name || 'Founders Edge Member';
  const resend = new Resend(apiKey);

  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Founders Edge <onboarding@resend.dev>',
      to: [to],
      subject: `Your offer "${offerTitle}" has expired`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
          <h2 style="color: #e7b605; margin-top: 0;">Offer Expiration Alert</h2>
          <p>Hi ${recipientName},</p>
          <p>Your exclusive offer <strong>"${offerTitle}"</strong> has reached its expiration date and has been moved out of live listings.</p>
          <p>Want to stay visible to other founders? You can submit a new offer anytime from your dashboard!</p>
          <div style="margin: 28px 0;">
            <a href="${appUrl}/offers/submit" style="background: #e7b605; color: #000; padding: 14px 28px; font-weight: bold; text-decoration: none; display: inline-block;">Submit New Offer</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send offer expiration email via Resend:', err);
    return { error: err };
  }
}

export async function sendEventArchivedAlertEmail({
  to,
  name,
  eventTitle,
}: {
  to: string;
  name?: string;
  eventTitle: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n=================== [EVENT ARCHIVED EMAIL MOCK] ===================`);
    console.log(`TO: ${to} (${name || 'Member'})`);
    console.log(`EVENT: ${eventTitle}`);
    console.log(`====================================================================\n`);
    return { success: true, mocked: true };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const recipientName = name || 'Event Host';
  const resend = new Resend(apiKey);

  try {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Founders Edge <onboarding@resend.dev>',
      to: [to],
      subject: `Your event "${eventTitle}" has concluded`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2a2820; border: 1px solid #e2e0d8;">
          <h2 style="color: #2a2820; margin-top: 0;">Event Concluded</h2>
          <p>Hi ${recipientName},</p>
          <p>Your event <strong>"${eventTitle}"</strong> has concluded and has been archived on the calendar.</p>
          <p>Got another event coming up? Share your next upcoming workshop or networking session with the community!</p>
          <div style="margin: 28px 0;">
            <a href="${appUrl}/events/submit" style="background: #e7b605; color: #000; padding: 14px 28px; font-weight: bold; text-decoration: none; display: inline-block;">Submit Upcoming Event</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e0d8; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px; margin: 0;">Founders Edge Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send event archived email via Resend:', err);
    return { error: err };
  }
}