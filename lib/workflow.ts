import { Client as WorkflowClient } from "@upstash/workflow";
import config from "@/lib/config";
import emailjs from "@emailjs/browser";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!);

export const sendEmail = async (
  message: string,
  subject: string,
  email: string,
) => {
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error("Missing EmailJS environment variables");
    }

    const templateParams = { to_email: email, subject, message };

    const response = await emailjs.send(serviceId, templateId, templateParams);

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
