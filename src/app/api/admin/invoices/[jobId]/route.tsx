// src/app/api/admin/invoices/[jobId]/route.tsx
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { InvoiceDocument } from '@/components/invoice-pdf';
import { Database } from '@/types/database';

// Define types based on the expected query result
// Aligning more closely with LineItemType from invoice-pdf.tsx
type LineItem = {
  description?: string;
  item_name?: string;
  quantity?: number;
  unit_quantity?: number;
  unit_price: number; // unit_price is required by InvoiceDocument
  // Add other potential fields if necessary, or use 'any' if structure is very dynamic
  [key: string]: any; // Allows for other properties if they exist on the Json object
};

type SubcontractorProfile = {
  id: string;
  company_name?: string | null;
  address?: string | null; // Added address based on InvoiceDocument props
};

// Helper function to calculate total amount from line items
const calculateTotalAmount = (lineItems: LineItem[] | null): number => {
  if (!lineItems || lineItems.length === 0) {
    return 0;
  }
  
  return lineItems.reduce((sum, item) => {
    // Use the same logic as InvoiceDocument for quantity
    const quantity = typeof item?.quantity === 'number'
      ? item.quantity
      : (typeof item?.unit_quantity === 'number' ? item.unit_quantity : 0);
    const unitPrice = typeof item?.unit_price === 'number' ? item.unit_price : 0;
    return sum + (quantity * unitPrice);
  }, 0);
};

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Get the jobId from params
    const { jobId } = params;
    
    // Create the Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // 1. Fetch the job data with line items and profile
    // Admin route, so we don't filter by user.id for job ownership
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id, job_type, location, start_date, end_date, status, notes, created_at, updated_at,
        line_items,
        profiles:subcontractor_id (id, company_name, address)
      `)
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    if (!jobData) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 2. Prepare data for PDF generation
    // 2. Prepare data for PDF generation
    // Cast to LineItem[] after checking it's an array.
    // This assumes each object in jobData.line_items conforms to LineItem structure.
    const lineItems: LineItem[] = Array.isArray(jobData.line_items) ? jobData.line_items as LineItem[] : [];
    const totalAmount = calculateTotalAmount(lineItems);
    
    // Get the subcontractor profile from the job data
    const subcontractor = jobData.profiles as SubcontractorProfile | null; // Cast for type safety
    
    if (!subcontractor || !subcontractor.id) {
      return NextResponse.json({ error: 'Subcontractor profile not found for this job' }, { status: 500 });
    }

    // 3. Fetch invoice recipient text setting
    const { data: settingsData } = await supabase
      .from('invoice_settings')
      .select('setting_value')
      .eq('setting_key', 'invoice_recipient_text')
      .maybeSingle();

    const recipientText = settingsData?.setting_value || 'To Whom It May Concern,';

    // 4. Check if invoice already exists or create one
    // This step might be redundant if the invoice is always created when the job is,
    // but it's good for robustness.
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (!existingInvoice) {
      // Create new invoice record
      await supabase.from('invoices').insert({
        job_id: jobId,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'generated', // Or another appropriate status
        subcontractor_id: subcontractor.id,
        total_amount: totalAmount
      });
    }

    // 5. Generate the PDF buffer
    try {
      // Create the job object for PDF generation
      const jobForPdf = {
        id: jobData.id,
        description: jobData.job_type || 'N/A', // Ensure description is a string
        line_items: lineItems,
        start_date: jobData.start_date,
        end_date: jobData.end_date,
        status: jobData.status,
        location: jobData.location,
        notes: jobData.notes
      };
    
      // Generate PDF using buffer for better browser compatibility
      const pdfBuffer = await ReactPDF.renderToBuffer(
        <InvoiceDocument 
          job={jobForPdf} 
          subcontractor={subcontractor} 
          recipientText={recipientText} 
        />
      );
      
      // Return the PDF as a downloadable file
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${jobId}.pdf"`,
          'Content-Length': `${pdfBuffer.length}`,
          'Cache-Control': 'no-store' // Ensure fresh PDF generation
        },
      });
    } catch (pdfError: any) {
      console.error(`Error generating PDF for job ${jobId}:`, pdfError);
      return NextResponse.json({ 
        error: `PDF generation failed: ${pdfError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in admin invoice generation for job ${params.jobId}:`, error); // Use params.jobId here
    return NextResponse.json({ 
      error: `Internal server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}