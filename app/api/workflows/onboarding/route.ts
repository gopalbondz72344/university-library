import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow"; // Import sendEmail to queue emails

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

type UserState = "non-active" | "active";
type InitialData = {
  email: string;
  fullName: string;
};

const getUserState = async (email: string): Promise<UserState> => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) return "non-active";

  const lastActivityDate = new Date(user[0].lastActivityDate!);
  const now = new Date();
  const timeDifference = now.getTime() - lastActivityDate.getTime();

  return timeDifference > THREE_DAYS_IN_MS &&
    timeDifference <= THIRTY_DAYS_IN_MS
    ? "non-active"
    : "active";
};

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload;

  // Send Welcome Email
  await context.run("new-signup", async () => {
    await sendEmail(`Welcome ${fullName}!`, "Welcome to the platform", email);
  });

  // Wait for 3 days before checking user state
  await context.sleep("wait-for-3-days", THREE_DAYS_IN_MS / 1000);

  while (true) {
    const state = await context.run("check-user-state", async () => {
      return await getUserState(email);
    });

    if (state === "non-active") {
      await context.run("send-email-non-active", async () => {
        await sendEmail(
          `Hey ${fullName}, we miss you!`,
          "Are you still there?",
          email,
        );
      });
    } else if (state === "active") {
      await context.run("send-email-active", async () => {
        await sendEmail(`Welcome back ${fullName}!`, "Welcome back", email);
      });
    }

    // Wait for 1 month before checking again
    await context.sleep("wait-for-1-month", THIRTY_DAYS_IN_MS / 1000);
  }
});
