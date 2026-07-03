type GuestEventApprovalEmailParams = {
  to: string;
  guestName?: string | null;
  eventTitle: string;
};

export async function sendGuestEventApprovalEmail({
  to,
  guestName,
  eventTitle,
}: GuestEventApprovalEmailParams) {
  console.log("Guest event approval email queued:", {
    to,
    subject: `Your event "${eventTitle}" has been approved`,
    message: `Hi ${guestName || "there"}, your event "${eventTitle}" has been approved and is now visible on Founders Edge.`,
  });

  return { success: true };
}

type GuestEventRejectionEmailParams = {
  to: string;
  guestName?: string | null;
  eventTitle: string;
};

export async function sendGuestEventRejectionEmail({
  to,
  guestName,
  eventTitle,
}: GuestEventRejectionEmailParams) {
  console.log("Guest event rejection email queued:", {
    to,
    subject: `Update on your event "${eventTitle}"`,
    message: `Hi ${guestName || "there"}, thank you for submitting "${eventTitle}" to Founders Edge. Unfortunately, it was not approved for publishing at this time.`,
  });

  return { success: true };
}