// React PDF components are meant for server-side rendering, no "use client" directive needed
import React from 'react'; // Required for JSX
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica', // Using a standard font
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  companyInfo: {
    fontSize: 10,
    textAlign: 'right',
    color: '#333333',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  recipientText: {
    marginBottom: 20,
  },
  jobDetails: {
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 5,
  },
  lineItemsTable: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },  tableColHeader: {
    width: '25%', // Adjusted for 4 columns
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2',
    padding: 5,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%', // Adjusted for 4 columns
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  totalSection: {
    textAlign: 'right',
    marginTop: 20,
  },
  totalText: {
    fontWeight: 'bold',
  },
});

// Define proper types for the component props
type LineItemType = {
  description?: string;
  item_name?: string; // Support both formats
  quantity?: number;
  unit_quantity?: number; // Support both formats
  unit_price: number;
};

type JobType = {
  id: string;
  description?: string;
  line_items?: LineItemType[] | null;
  [key: string]: unknown; // Allow other job properties
};

type SubcontractorType = {
  company_name?: string | null;
  address?: string | null;
  [key: string]: unknown; // Allow other subcontractor properties
};

// Define the PDF Document Component
export const InvoiceDocument = ({
  job,
  subcontractor,
  recipientText
}: {
  job: JobType;
  subcontractor: SubcontractorType;
  recipientText: string
}) => {  // Determine header info based on availability
  const headerName = subcontractor?.company_name || 'Subcontractor';
  const headerAddress = subcontractor?.address || ''; // Assuming an 'address' field
  
  // Safely handle line_items which might be null, undefined, or not an array
  const safeLineItems = Array.isArray(job?.line_items) 
    ? job.line_items 
    : (typeof job?.line_items === 'object' && job?.line_items !== null)
      ? [job.line_items]
      : [];

  // Calculate total amount from line items with proper type safety
  const totalAmount = safeLineItems.reduce(
    (sum: number, item: LineItemType) => {
      // Handle both quantity formats and ensure we have numbers
      const quantity = typeof item?.quantity === 'number' 
        ? item.quantity 
        : (typeof item?.unit_quantity === 'number' ? item.unit_quantity : 0);
      const unitPrice = typeof item?.unit_price === 'number' ? item.unit_price : 0;
      return sum + (quantity * unitPrice);
    },
    0
  );
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyInfo}>{headerName}</Text>
          {headerAddress && <Text style={styles.companyInfo}>{headerAddress}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.invoiceTitle}>Invoice</Text>

        {/* Recipient Text */}
        <Text style={styles.recipientText}>{recipientText}</Text>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <Text style={styles.detailItem}>Job ID: {job.id}</Text>
          <Text style={styles.detailItem}>Job Description: {job.description}</Text>
          {/* Add other relevant job details */}
        </View>        {/* Line Items Table */}
        <View style={styles.lineItemsTable}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Description</Text>
            <Text style={styles.tableColHeader}>Quantity</Text>
            <Text style={styles.tableColHeader}>Unit Price</Text>
            <Text style={styles.tableColHeader}>Amount</Text>
          </View>          {/* Table Body */}
          {safeLineItems.map((item: LineItemType, index: number) => {
            // Safely extract values with null/undefined checks
            const description = item?.description || item?.item_name || 'N/A';
            const quantity = typeof item?.quantity === 'number' 
              ? item.quantity 
              : (typeof item?.unit_quantity === 'number' ? item.unit_quantity : 0);
            const unitPrice = typeof item?.unit_price === 'number' ? item.unit_price : 0;
            const itemTotal = quantity * unitPrice;
            
            return (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCol}>{description}</Text>
                <Text style={styles.tableCol}>{quantity}</Text>
                <Text style={styles.tableCol}>{unitPrice.toFixed(2)}</Text>
                <Text style={styles.tableCol}>{itemTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalText}>Total Amount: RM {totalAmount.toFixed(2)}</Text>
        </View>

      </Page>
    </Document>
  );
};