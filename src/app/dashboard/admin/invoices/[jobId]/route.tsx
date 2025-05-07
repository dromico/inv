// src/app/dashboard/admin/invoices/[jobId]/route.tsx
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { InvoiceDocument } from '@/components/invoice-pdf';
import { Database } from '@/types/database'; // Import Database type

// Define types based on the expected query result
// Import JSON type from Database
import type { Json } from '@/types/database';

// Type definitions for line items
type LineItem = {
  description?: string;
  item_name?: string; // Support both formats
  quantity?: number;
  unit_quantity?: number; // Support both formats
  unit_price: number;
  // id is optional since it might not be present in all line items
  id?: string;
};

// Helper function to calculate total amount from line items
const calculateTotalAmount = (lineItems: LineItem[] | null): number => {
  if (!lineItems || lineItems.length === 0) {
    return 0;
  }
  // Ensure quantity and unit_price are numbers before multiplying
  return lineItems.reduce((sum, item) => {
    // Handle both quantity formats
    const quantity = Number(item.quantity ?? item.unit_quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return sum + (quantity * unitPrice);
  }, 0);
};

export async function GET(
  request: Request,
  context: { params: { jobId: string } }
) {
  const { params } = context;
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  const jobId = params.jobId;

  try {
    // 1. Fetch Job Data
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*, subcontractor_id')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return NextResponse.json(
        { error: `Error fetching job: ${jobError.message}` }, 
        { status: 500 }
      );
    }

    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found' }, 
        { status: 404 }
      );
    }

    // 2. Fetch Line Items
    const { data: lineItems = [], error: lineItemsError } = await supabase
      .from('jobs')
      .select('line_items')
      .eq('id', jobId)
      .single();

    if (lineItemsError) {
      console.error(`Error fetching line items for job ${jobId}:`, lineItemsError);
    }    // 3. Fetch Subcontractor Profile
    const { data: subcontractorProfile, error: subError } = await supabase
      .from('profiles')
      .select('id, company_name, address')
      .eq('id', jobData.subcontractor_id)
      .single();

    if (subError) {
      console.error(`Error fetching subcontractor profile for job ${jobId}:`, subError);
      return NextResponse.json(
        { error: `Error fetching subcontractor: ${subError.message}` }, 
        { status: 500 }
      );
    }

    if (!subcontractorProfile) {
      return NextResponse.json(
        { error: 'Subcontractor profile not found' }, 
        { status: 404 }
      );
    }

    // 4. Fetch Invoice Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('invoice_settings')
      .select('setting_value')
      .eq('setting_key', 'invoice_recipient_text')
      .single();

    if (settingsError) {
      console.warn(`Error fetching invoice settings for job ${jobId}:`, settingsError);
    }    const recipientText = settingsData?.setting_value || 'To Whom It May Concern,';    // Safely handle line items data with improved type handling
    let processedLineItems: LineItem[] = [];
    
    try {
      // Check if lineItems exists and has the expected structure
      if (lineItems && typeof lineItems === 'object' && 'line_items' in lineItems) {
        const items = lineItems.line_items;
        
        // Handle array case
        if (Array.isArray(items)) {
          processedLineItems = items.map(item => {
            if (!item || typeof item !== 'object') {
              return { unit_price: 0 };
            }
            
            // Safely extract values
            const itemObj = item as { [key: string]: any };
            return {
              description: typeof itemObj.description === 'string' ? itemObj.description : 
                          (typeof itemObj.item_name === 'string' ? itemObj.item_name : 'Item'),
              quantity: typeof itemObj.quantity === 'number' ? itemObj.quantity : 
                       (typeof itemObj.unit_quantity === 'number' ? itemObj.unit_quantity : 1),
              unit_price: typeof itemObj.unit_price === 'number' ? itemObj.unit_price : 0,
              id: typeof itemObj.id === 'string' ? itemObj.id : undefined
            };
          });
        } 
        // Handle object case (single item)
        else if (items && typeof items === 'object' && !Array.isArray(items)) {
          const itemObj = items as { [key: string]: any };
          processedLineItems = [{
            description: typeof itemObj.description === 'string' ? itemObj.description : 
                        (typeof itemObj.item_name === 'string' ? itemObj.item_name : 'Item'),
            quantity: typeof itemObj.quantity === 'number' ? itemObj.quantity : 
                     (typeof itemObj.unit_quantity === 'number' ? itemObj.unit_quantity : 1),
            unit_price: typeof itemObj.unit_price === 'number' ? itemObj.unit_price : 0
          }];
        }
      }
    } catch (error) {
      console.error('Error processing line items:', error);
      // Fallback to empty array if there's an error
      processedLineItems = [];
    }
    
    const totalAmount = calculateTotalAmount(processedLineItems);

    // 5. Insert/Update Invoice Record
    try {
      const { data: existingInvoice, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking for existing invoice for job ${jobId}:`, checkError);
      }

      if (!existingInvoice) {
        const { error: insertError } = await supabase
          .from('invoices')
          .insert({
            job_id: jobId,
            subcontractor_id: subcontractorProfile.id,
            total_amount: totalAmount,
            // Other fields will use database defaults
          });

        if (insertError) {
          console.error(`Error inserting invoice record for job ${jobId}:`, insertError);
        } else {
          console.log(`Invoice record created successfully for job ${jobId}`);
        }
      } else {
        console.log(`Invoice record already exists for job ${jobId}. Skipping insertion.`);
      }
    } catch (dbError) {
      console.error(`Database error during invoice check/insert for job ${jobId}:`, dbError);
    }    // 6. Generate PDF
    try {
      // Prepare job data for PDF with proper typing
      const jobForPdf = {
        id: jobData.id,
        description: jobData.job_type || 'N/A', // Use job_type as description
        line_items: processedLineItems,
        // Include any other required fields from jobData
        start_date: jobData.start_date,
        end_date: jobData.end_date,
        status: jobData.status,
        location: jobData.location,
        notes: jobData.notes
      };

      // Generate PDF buffer
      const pdfBuffer = await ReactPDF.renderToBuffer(
        <InvoiceDocument 
          job={jobForPdf} 
          subcontractor={subcontractorProfile} 
          recipientText={recipientText}
        />
      );
      
      // Return with appropriate headers
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${jobId}.pdf"`,
          'Content-Length': `${pdfBuffer.length}`,
          'Cache-Control': 'no-store'
        },
      });
    } catch (pdfError) {
      console.error(`Error generating PDF for job ${jobId}:`, pdfError);
      return NextResponse.json(
        { error: `Error generating PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error processing invoice for job ${jobId}:`, error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}