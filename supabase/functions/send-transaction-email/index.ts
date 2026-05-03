import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'purchase_confirmation' | 'sale_confirmation' | 'sale_created';
  recipientEmail: string;
  recipientName?: string;
  caskName: string;
  caskNumber: string;
  distilleryName: string;
  volume: number;
  pricePerLiter: number;
  totalAmount: number;
  transactionId?: string;
  saleId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require service-role key — this function is intended to be called only
    // server-to-server from other edge functions, never from the public internet.
    const authHeader = req.headers.get("authorization") ?? "";
    const apiKeyHeader = req.headers.get("apikey") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const isAuthorized =
      serviceRoleKey.length > 0 &&
      (bearer === serviceRoleKey || apiKeyHeader === serviceRoleKey);

    if (!isAuthorized) {
      console.warn("Unauthorized send-transaction-email call");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const emailData: EmailRequest = await req.json();
    
    console.log("Sending transaction email:", emailData.type, "to:", emailData.recipientEmail);

    let subject = "";
    let htmlContent = "";

    switch (emailData.type) {
      case 'purchase_confirmation':
        subject = `Purchase Confirmed: ${emailData.caskName}`;
        htmlContent = generatePurchaseConfirmationEmail(emailData);
        break;
      
      case 'sale_confirmation':
        subject = `Sale Completed: ${emailData.caskName}`;
        htmlContent = generateSaleConfirmationEmail(emailData);
        break;
      
      case 'sale_created':
        subject = `Listing Created: ${emailData.caskName}`;
        htmlContent = generateSaleCreatedEmail(emailData);
        break;
      
      default:
        throw new Error('Invalid email type');
    }

    const { data, error } = await resend.emails.send({
      from: "ARIGI Platform <onboarding@resend.dev>",
      to: [emailData.recipientEmail],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending transaction email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

function generatePurchaseConfirmationEmail(data: EmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d5a4f 100%);
            color: #f5f1e8;
            padding: 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e5e5;
          }
          .cask-details {
            background: #f9f7f4;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .detail-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 1.1em;
            color: #d4a747;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #d4a747 0%, #c78a3f 100%);
            color: #1a1a1a;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🥃 Purchase Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your whisky cask investment is complete</p>
        </div>
        
        <div class="content">
          <p>Dear ${data.recipientName || 'Investor'},</p>
          
          <p>Congratulations! Your purchase of <strong>${data.caskName}</strong> has been successfully completed.</p>
          
          <div class="cask-details">
            <h2 style="margin-top: 0; color: #d4a747;">Cask Details</h2>
            <div class="detail-row">
              <span>Spirit Name:</span>
              <strong>${data.caskName}</strong>
            </div>
            <div class="detail-row">
              <span>Cask Number:</span>
              <strong>${data.caskNumber}</strong>
            </div>
            <div class="detail-row">
              <span>Distillery:</span>
              <strong>${data.distilleryName}</strong>
            </div>
            <div class="detail-row">
              <span>Volume:</span>
              <strong>${data.volume}L</strong>
            </div>
            <div class="detail-row">
              <span>Price per Liter:</span>
              <strong>$${data.pricePerLiter.toFixed(2)}</strong>
            </div>
            <div class="detail-row">
              <span>Total Amount:</span>
              <strong>$${data.totalAmount.toLocaleString()}</strong>
            </div>
          </div>
          
          ${data.transactionId ? `<p style="font-size: 0.9em; color: #666;">Transaction ID: ${data.transactionId}</p>` : ''}
          
          <p>Your cask ownership has been registered and you can now view it in your portfolio.</p>
          
          <center>
            <a href="https://vnmmjmxhtbplfkdughxu.supabase.co/portfolio" class="button">View Portfolio</a>
          </center>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 0.9em; color: #666;">
            Keep an eye on your investment as it matures. We'll keep you updated on important milestones.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 ARIGI Platform. Premium Whisky Cask Trading.</p>
          <p>This email was sent regarding your recent cask purchase.</p>
        </div>
      </body>
    </html>
  `;
}

function generateSaleConfirmationEmail(data: EmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2d5a4f 0%, #1a1a1a 100%);
            color: #f5f1e8;
            padding: 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e5e5;
          }
          .success-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">💰 Sale Completed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your cask has been sold successfully</p>
        </div>
        
        <div class="content">
          <center>
            <div class="success-badge">✓ Transaction Complete</div>
          </center>
          
          <p>Dear ${data.recipientName || 'Seller'},</p>
          
          <p>Great news! Your listing for <strong>${data.caskName}</strong> (Cask #${data.caskNumber}) has been sold.</p>
          
          <h3>Sale Details:</h3>
          <ul>
            <li><strong>Volume Sold:</strong> ${data.volume}L</li>
            <li><strong>Price per Liter:</strong> $${data.pricePerLiter.toFixed(2)}</li>
            <li><strong>Total Sale Amount:</strong> $${data.totalAmount.toLocaleString()}</li>
          </ul>
          
          <p>Your payout is being processed and will be transferred to your account shortly.</p>
          
          ${data.transactionId ? `<p style="font-size: 0.9em; color: #666;">Transaction ID: ${data.transactionId}</p>` : ''}
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 0.9em; color: #666;">
            Thank you for using ARIGI Platform for your whisky cask trading.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 ARIGI Platform. Premium Whisky Cask Trading.</p>
        </div>
      </body>
    </html>
  `;
}

function generateSaleCreatedEmail(data: EmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #d4a747 0%, #c78a3f 100%);
            color: #1a1a1a;
            padding: 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e5e5;
          }
          .listing-badge {
            background: #f59e0b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">📝 Listing Created!</h1>
          <p style="margin: 10px 0 0 0;">Your cask is now on the marketplace</p>
        </div>
        
        <div class="content">
          <center>
            <div class="listing-badge">🏷️ Now Listed</div>
          </center>
          
          <p>Dear ${data.recipientName || 'Seller'},</p>
          
          <p>Your cask <strong>${data.caskName}</strong> (Cask #${data.caskNumber}) has been successfully listed on the ARIGI marketplace.</p>
          
          <h3>Listing Details:</h3>
          <ul>
            <li><strong>Distillery:</strong> ${data.distilleryName}</li>
            <li><strong>Volume for Sale:</strong> ${data.volume}L</li>
            <li><strong>Asking Price per Liter:</strong> $${data.pricePerLiter.toFixed(2)}</li>
            <li><strong>Total Asking Price:</strong> $${data.totalAmount.toLocaleString()}</li>
          </ul>
          
          ${data.saleId ? `<p style="font-size: 0.9em; color: #666;">Listing ID: ${data.saleId}</p>` : ''}
          
          <p>Your listing is now visible to potential buyers. We'll notify you immediately when someone makes a purchase.</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 0.9em; color: #666;">
            You can manage your active listings from your portfolio page.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 ARIGI Platform. Premium Whisky Cask Trading.</p>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
