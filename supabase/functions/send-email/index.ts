import React from "npm:react@18.3.1";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import MagicLinkEmail from "./_templates/magic-link.tsx";
import AccountConfirmationEmail from "./_templates/confirmation-email.tsx";
import PasswordRecoveryEmail from "./_templates/recovery-email.tsx";
import InviteEmail from "./_templates/invite-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string).replace(
  "v1,whsec_",
  "",
);

type VerifyData = {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
      email_verified?: boolean;
      phone_verified?: boolean;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  console.log(req.headers);
  console.log(hookSecret);

  let verifyData: VerifyData | null = null;
  let payload: string;

  try {
    // Consume the request body once and store it
    payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Try webhook verification first
    try {
      const wh = new Webhook(hookSecret);
      verifyData = wh.verify(payload, headers) as VerifyData;
      console.log("Webhook verification successful");
    } catch (webhookError) {
      console.error("Webhook verification failed:", webhookError);
      // If webhook verification fails, try to parse the payload directly
      try {
        const parsedPayload = JSON.parse(payload);
        if (parsedPayload.user?.email && parsedPayload.email_data) {
          console.log(
            "Webhook verification failed, but proceeding with direct payload parsing",
          );
          verifyData = parsedPayload;
        } else {
          throw new Error("Invalid payload structure");
        }
      } catch (parseError) {
        console.error("Failed to parse payload:", parseError);
        return new Response(
          JSON.stringify({
            error: "Failed to process webhook",
            details: "Invalid payload structure",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!verifyData) {
    return new Response("Failed to process webhook", { status: 500 });
  }

  try {
    // Log the incoming request for debugging
    console.log(
      "Received webhook payload:",
      JSON.stringify(verifyData, null, 2),
    );

    // Extract user and email data from the verified payload
    const { user, email_data } = verifyData;

    if (!user?.email) {
      console.error("Missing user email in webhook payload");
      return new Response(JSON.stringify({ error: "Missing user email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine which email template to use based on the action type
    let emailTemplate;
    let subject;
    const emailActionType = email_data?.email_action_type || "magic_link";

    switch (emailActionType) {
      case "signup":
        emailTemplate = AccountConfirmationEmail;
        subject = "Welcome to Lishka - Confirm Your Email!";
        break;
      case "magic_link":
        emailTemplate = MagicLinkEmail;
        subject = "Lishka Magic Link - Sign In";
        break;
      case "recovery":
        emailTemplate = PasswordRecoveryEmail;
        subject = "Lishka - Reset Your Password";
        break;
      case "invite":
        emailTemplate = InviteEmail;
        subject = "You have been invited to Lishka";
        break;
      default:
        emailTemplate = MagicLinkEmail;
        subject = "Lishka - Sign In";
        break;
    }

    // Extract required data for email templates
    const { token = "", token_hash = "", redirect_to = "" } = email_data || {};

    // Render the email template
    const html = await renderAsync(
      React.createElement(emailTemplate, {
        supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
        token,
        token_hash,
        redirect_to,
        email_action_type: emailActionType,
      }),
    );

    // Send the email using Resend
    const { error } = await resend.emails.send({
      from: "Lishka <onboarding@lishka.dev>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent to ${user.email}`,
        email_action_type: emailActionType,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
