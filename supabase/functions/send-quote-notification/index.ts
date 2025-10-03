import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface QuoteNotificationPayload {
  ownerEmail: string;
  ownerName: string;
  templateName: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerNotes?: string;
  requestedDate?: string;
  requestedTime?: string;
  estimatedTotal: number;
  submittedAt: string;
  submissionId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment variables");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const payload: QuoteNotificationPayload = await req.json();

    console.log("Sending quote notification email to:", payload.ownerEmail);

    // Format the date and time if provided
    const dateTimeStr =
      payload.requestedDate || payload.requestedTime
        ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <strong>Requested Date/Time:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            ${payload.requestedDate || "Not specified"} ${
            payload.requestedTime ? `at ${payload.requestedTime}` : ""
          }
          </td>
        </tr>
      `
        : "";

    const notesSection = payload.customerNotes
      ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <strong>Customer Notes:</strong>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            ${payload.customerNotes}
          </td>
        </tr>
      `
      : "";

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Quote Submission!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${payload.ownerName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! You have received a new quote submission for your template <strong>${
                payload.templateName
              }</strong>.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                Quote Details
              </h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Business:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    ${payload.businessName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Template:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    ${payload.templateName}
                  </td>
                </tr>
                <tr style="background-color: #f3f4f6;">
                  <td colspan="2" style="padding: 12px; font-weight: bold; color: #667eea;">
                    Customer Information
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Name:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    ${payload.customerName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Email:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${
                      payload.customerEmail
                    }" style="color: #667eea; text-decoration: none;">
                      ${payload.customerEmail}
                    </a>
                  </td>
                </tr>
                ${
                  payload.customerPhone
                    ? `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Phone:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <a href="tel:${payload.customerPhone}" style="color: #667eea; text-decoration: none;">
                      ${payload.customerPhone}
                    </a>
                  </td>
                </tr>
                `
                    : ""
                }
                ${dateTimeStr}
                ${notesSection}
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>Estimated Total:</strong>
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 18px; color: #10b981; font-weight: bold;">
                    $${payload.estimatedTotal.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                Deno.env.get("APP_URL") || "https://lushquote.com"
              }/quote-management" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View Quote in Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Submitted on ${new Date(payload.submittedAt).toLocaleString(
                "en-US",
                {
                  dateStyle: "full",
                  timeStyle: "short",
                }
              )}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              You're receiving this email because you have email notifications enabled for your LushQuote account. 
              You can manage your notification preferences in your settings.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} LushQuote. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="${
                Deno.env.get("APP_URL") || "https://lushquote.com"
              }/settings" style="color: #667eea; text-decoration: none;">
                Manage Preferences
              </a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from:
        Deno.env.get("RESEND_FROM_EMAIL") ||
        "LushQuote <notifications@lushquote.com>",
      to: payload.ownerEmail,
      subject: `New Quote Submission - ${payload.customerName} (${payload.templateName})`,
      html: emailHtml,
      replyTo: payload.customerEmail,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data?.id,
        message: "Quote notification email sent successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending quote notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send notification email",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
