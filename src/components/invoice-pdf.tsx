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
  // Calculate total amount from line items with proper type safety
  const totalAmount = job?.line_items?.reduce(
    (sum: number, item: LineItemType) => {
      // Handle both quantity formats
      const quantity = item.quantity ?? item.unit_quantity ?? 0;
      return sum + (quantity * (item.unit_price || 0));
    },
    0
  ) || 0;
  
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
        </View>

        {/* Line Items Table */}
        <View style={styles.lineItemsTable}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Description</Text>
            <Text style={styles.tableColHeader}>Quantity</Text>
            <Text style={styles.tableColHeader}>Unit Price</Text>
            {/* Add more columns if needed */}
          </View>          {/* Table Body */}
          {job?.line_items?.map((item: LineItemType, index: number) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCol}>{item.description || item.item_name || 'N/A'}</Text>
              <Text style={styles.tableCol}>{item.quantity ?? item.unit_quantity ?? 0}</Text>
              <Text style={styles.tableCol}>{(item.unit_price || 0).toFixed(2)}</Text>
              {/* Add more columns if needed */}
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalText}>Total Amount: ${totalAmount.toFixed(2)}</Text>
        </View>

      </Page>
    </Document>
  );
};