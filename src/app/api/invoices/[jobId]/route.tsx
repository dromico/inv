// src/app/api/invoices/[jobId]/route.tsx
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as ReactPDF from '@react-pdf/renderer';
import React from 'react';
import { InvoiceDocument } from '@/components/invoice-pdf';
import { Database } from '@/types/database';

// Aligning with types from InvoiceDocument and admin route
type LineItem = {
  description?: string;
  item_name?: string;
  quantity?: number;
  unit_quantity?: number;
  unit_price: number;
  [key: string]: any;
};

type SubcontractorProfileForPdf = {
  id: string;
  company_name?: string | null;
  address?: string | null;
};

// Helper function to calculate total amount from line items
function calculateTotalAmount(lineItems: LineItem[] = []) { // Changed any[] to LineItem[]
  return lineItems.reduce((sum, item) => {
    const quantity = typeof item?.quantity === 'number'
      ? item.quantity
      : (typeof item?.unit_quantity === 'number' ? item.unit_quantity : 0);
    const unitPrice = typeof item?.unit_price === 'number' ? item.unit_price : 0;
    return sum + (quantity * unitPrice);
  }, 0);
}

export async function GET(
  request: Request, // request is unused, consider removing or using an underscore
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params; // Moved jobId declaration here for broader scope
  try {
    
    // Create the Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // 1. Fetch the job data and verify ownership
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id, job_type, location, start_date, end_date, status, notes, created_at, updated_at,
        line_items, subcontractor_id
      `)
      .eq('id', jobId)
      .eq('subcontractor_id', user.id)
      .single();

    if (jobError) {
      console.error(`Error fetching job ${jobId}:`, jobError);
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    if (!jobData) {
      return NextResponse.json(
        { error: 'Job not found or you do not have permission to access it' }, 
        { status: 404 }
      );
    }

    // 2. Fetch subcontractor profile
    const { data: subcontractorProfile, error: subError } = await supabase
      .from('profiles')
      .select('id, company_name, address')
      .eq('id', user.id)
      .single();

    if (subError || !subcontractorProfile) {
      console.error(`Error fetching subcontractor profile:`, subError);
      return NextResponse.json(
        { error: 'Subcontractor profile not found' }, 
        { status: 500 }
      );
    }

    // 3. Prepare data for PDF generation
    const lineItems: LineItem[] = Array.isArray(jobData.line_items) ? jobData.line_items as LineItem[] : [];
    const totalAmount = calculateTotalAmount(lineItems);

    // 4. Fetch invoice recipient text setting
    const { data: settingsData } = await supabase
      .from('invoice_settings')
      .select('setting_value')
      .eq('setting_key', 'invoice_recipient_text')
      .maybeSingle();

    const recipientText = settingsData?.setting_value || 'To Whom It May Concern,';

    // 5. Check if invoice already exists or create one
    try {
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
          status: 'generated',
          subcontractor_id: user.id,
          total_amount: totalAmount
        });
      }
    } catch (dbError) {
      console.error(`Database error during invoice check/insert for job ${jobId}:`, dbError);
      // Continue even if this fails - we still want to generate the PDF
    }

    // 6. Generate the PDF buffer
    try {
      // Prepare job data for PDF with proper typing
      const jobForPdf = {
        id: jobData.id,
        description: jobData.job_type || 'N/A',
        line_items: lineItems,
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
          subcontractor={subcontractorProfile as SubcontractorProfileForPdf}
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