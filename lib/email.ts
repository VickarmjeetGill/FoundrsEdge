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