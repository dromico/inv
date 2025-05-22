// React PDF components are meant for server-side rendering, no "use client" directive needed
import React from 'react'; // Required for JSX
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36, // Increased spacing
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 24, // Increased padding
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6, // Increased spacing
  },
  companyInfo: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 2, // Added spacing between info lines
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10, // Increased spacing
    color: '#2563eb', // Blue color for emphasis
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30, // Increased spacing
  },
  invoiceDetailColumn: {
    flexDirection: 'column',
    width: '48%',
  },
  invoiceDetailItem: {
    marginBottom: 6, // Increased spacing
  },
  invoiceDetailLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#555555',
    marginBottom: 4, // Added spacing after label
  },
  invoiceDetailValue: {
    fontSize: 10,
    marginBottom: 3, // Added spacing between values
  },
  recipientSection: {
    marginBottom: 24, // Increased spacing
    padding: 12, // Consistent padding
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  recipientText: {
    fontSize: 10,
  },
  jobDetails: {
    marginBottom: 24, // Increased spacing
    padding: 12, // Consistent padding
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10, // Increased spacing
    color: '#2563eb',
  },
  detailItem: {
    marginBottom: 5, // Increased spacing
    fontSize: 10,
  },
  lineItemsTable: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 24, // Increased spacing
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    backgroundColor: '#f3f4f6',
    padding: 10, // Consistent padding
    fontWeight: 'bold',
    fontSize: 10,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableColHeaderLast: {
    width: '25%',
    backgroundColor: '#f3f4f6',
    padding: 10, // Consistent padding
    fontWeight: 'bold',
    fontSize: 10,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCol: {
    width: '25%',
    padding: 10, // Consistent padding
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableColLast: {
    width: '25%',
    padding: 10, // Consistent padding
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowLast: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColLastRow: {
    width: '25%',
    padding: 10, // Consistent padding
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableColLastRowLast: {
    width: '25%',
    padding: 10, // Consistent padding
    fontSize: 10,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24, // Increased spacing
    paddingTop: 12, // Increased padding
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
    paddingRight: 10, // Added right padding to align with table
  },
  totalRow: {
    flexDirection: 'row',
    width: '25%', // Match the width of the last column
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 10,
    textAlign: 'right',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 12, // Increased padding
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 8,
    color: '#6b7280',
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

// Define the PDF Document Component
export const InvoiceDocument = ({
  job,
  subcontractor,
  recipientText
}: {
  job: any; // Using 'any' to avoid TypeScript errors with unknown properties
  subcontractor: any;
  recipientText: string
}) => {
  // Determine header info based on availability
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

  // Format date function
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Format job ID to max 7 characters
  const formatJobId = (id: any): string => {
    if (id === undefined || id === null) return 'N/A';
    const idStr = String(id);
    return idStr.length > 7 ? idStr.substring(0, 7) : idStr;
  };

  // Generate invoice number based on job ID (truncated)
  const jobIdFormatted = formatJobId(job.id);
  const invoiceNumber = `INV-${jobIdFormatted.padStart(5, '0')}`;
  const currentDate = format(new Date(), 'dd MMM yyyy');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{headerName}</Text>
            {headerAddress && <Text style={styles.companyInfo}>{headerAddress}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.companyInfo}>Date: {currentDate}</Text>
            <Text style={styles.companyInfo}>Invoice #: {invoiceNumber}</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.invoiceDetailColumn}>
            <View style={styles.invoiceDetailItem}>
              <Text style={styles.invoiceDetailLabel}>BILL TO:</Text>
              <Text style={styles.recipientText}>{recipientText}</Text>
            </View>
          </View>
          <View style={styles.invoiceDetailColumn}>
            <View style={styles.invoiceDetailItem}>
              <Text style={styles.invoiceDetailLabel}>JOB DETAILS:</Text>
              <Text style={styles.invoiceDetailValue}>Job ID: {jobIdFormatted}</Text>
              <Text style={styles.invoiceDetailValue}>Type: {job.description || 'N/A'}</Text>
              {job.location && <Text style={styles.invoiceDetailValue}>Location: {job.location}</Text>}
              {job.start_date && <Text style={styles.invoiceDetailValue}>Start Date: {formatDate(job.start_date)}</Text>}
              {job.end_date && <Text style={styles.invoiceDetailValue}>End Date: {formatDate(job.end_date)}</Text>}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.lineItemsTable}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Description</Text>
            <Text style={styles.tableColHeader}>Quantity</Text>
            <Text style={styles.tableColHeader}>Unit Price (RM)</Text>
            <Text style={styles.tableColHeaderLast}>Amount (RM)</Text>
          </View>

          {/* Table Body */}
          {safeLineItems.map((item: LineItemType, index: number) => {
            // Safely extract values with null/undefined checks
            const description = item?.description || item?.item_name || 'N/A';
            const quantity = typeof item?.quantity === 'number'
              ? item.quantity
              : (typeof item?.unit_quantity === 'number' ? item.unit_quantity : 0);
            const unitPrice = typeof item?.unit_price === 'number' ? item.unit_price : 0;
            const itemTotal = quantity * unitPrice;

            const isLastRow = index === safeLineItems.length - 1;

            if (isLastRow) {
              return (
                <View style={styles.tableRowLast} key={index}>
                  <Text style={styles.tableColLastRow}>{description}</Text>
                  <Text style={styles.tableColLastRow}>{quantity}</Text>
                  <Text style={styles.tableColLastRow}>{unitPrice.toFixed(2)}</Text>
                  <Text style={styles.tableColLastRowLast}>{itemTotal.toFixed(2)}</Text>
                </View>
              );
            }

            return (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.tableCol}>{description}</Text>
                <Text style={styles.tableCol}>{quantity}</Text>
                <Text style={styles.tableCol}>{unitPrice.toFixed(2)}</Text>
                <Text style={styles.tableColLast}>{itemTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Total - Aligned with the Amount column */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>RM {totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes or Terms */}
        {job.notes && (
          <View style={styles.jobDetails}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.detailItem}>{job.notes || ''}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business. This invoice was generated automatically.</Text>
        </View>
      </Page>
    </Document>
  );
};
