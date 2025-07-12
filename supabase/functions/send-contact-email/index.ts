import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  authorName: string;
  resourceTitle: string;
  fromName: string;
  fromEmail: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, resourceTitle, fromName, fromEmail, message }: ContactEmailRequest = await req.json();

    // Send email to the author
    const emailResponse = await resend.emails.send({
      from: "Community Resources <onboarding@resend.dev>",
      to: [fromEmail], // In a real app, you'd get the author's email from the database
      subject: `Question about your resource: ${resourceTitle}`,
      html: `
        <h2>You have a question about your resource: "${resourceTitle}"</h2>
        <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          This message was sent through the Community Resources platform. 
          You can reply directly to this email to respond to ${fromName}.
        </p>
      `,
      replyTo: fromEmail,
    });

    // Send confirmation email to the sender
    await resend.emails.send({
      from: "Community Resources <onboarding@resend.dev>",
      to: [fromEmail],
      subject: `Your message to ${authorName} has been sent`,
      html: `
        <h2>Message Sent Successfully!</h2>
        <p>Hi ${fromName},</p>
        <p>Your message about the resource "<strong>${resourceTitle}</strong>" has been sent to ${authorName}.</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <p><strong>Your message:</strong></p>
          <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
        </div>
        
        <p>The author will receive your message and can reply directly to this email address.</p>
        <p>Thank you for engaging with our community resources!</p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The Community Resources Team
        </p>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);