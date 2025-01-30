import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient } from "@upstash/qstash";
import config from "@/lib/config";
import emailjs from "@emailjs/browser";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});
const qstashClient = new QStashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async (
  message: string,
  subject: string,
  email: string,
) => {
  try {
    // Queue email sending using QStash
    const qstashResponse = await qstashClient.publishJSON({
      url: `${config.env.prodApiEndpoint}/api/workflows/onboarding`, // Your API endpoint to process emails
      body: { message, subject, email },
    });
    const serviceId = process.env.EMAILJS_SERVICE_ID!;
    const templateId = process.env.EMAILJS_TEMPLATE_ID!;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY!;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error("Missing EmailJS environment variables");
    }

    const templateParams = { to_email: email, subject, message };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey,
    );

    console.log("Email sent successfully:", response);
    console.log("QStash request sent successfully:", qstashResponse);
    return qstashResponse;
  } catch (error) {
    console.error("Error queuing email via QStash:", error);
    console.error("Error sending email:", error);
    throw error;
  }
};
