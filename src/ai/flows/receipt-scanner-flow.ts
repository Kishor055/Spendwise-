'use server';
/**
 * @fileOverview SpendWise 3.0 Vision Engine.
 * Multi-modal AI flow for high-precision financial extraction from receipts/bills.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReceiptScannerInputSchema = z.object({
  imageUri: z.string().describe("A data URI of the receipt image (base64 encoded). Must include mime type."),
});

const ReceiptScannerOutputSchema = z.object({
  merchant: z.string().describe('Name of the merchant found on the receipt.'),
  amount: z.number().describe('The final total amount paid (inclusive of taxes).'),
  taxAmount: z.number().optional().describe('Total tax amount (GST/VAT) extracted from the receipt.'),
  date: z.string().describe('Transaction date in ISO 8601 format.'),
  category: z.enum(['Food', 'Shopping', 'Travel', 'Recharge', 'Electricity', 'Fuel', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Other']),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  currency: z.string().default('INR'),
  confidence: z.number().describe('AI confidence score from 0 to 1.')
});

export async function scanReceipt(input: z.infer<typeof ReceiptScannerInputSchema>) {
  return receiptScannerFlow(input);
}

const receiptPrompt = ai.definePrompt({
  name: 'receiptScannerPrompt',
  input: { schema: ReceiptScannerInputSchema },
  output: { schema: ReceiptScannerOutputSchema },
  prompt: `You are the SpendWise Vision Intelligence, a state-of-the-art financial OCR agent. 
Analyze the provided receipt image and extract the following parameters with surgical precision:

1. MERCHANT: Identify the business name. If it's a logo, name the brand.
2. TOTAL AMOUNT: The final amount paid. Ensure no currency symbols are included in the number.
3. TAX/GST: Look for Tax, GST, CGST+SGST, or VAT fields. Provide the combined tax total.
4. DATE: Identify the transaction date. Convert it to YYYY-MM-DD.
5. CATEGORY: Map the merchant to the most appropriate financial sector.
6. LINE ITEMS: List the individual items, their prices, and quantities if visible.

Photo Data: {{media url=imageUri}}

Rules:
- If a value is unclear, use your best logical inference based on the receipt context.
- Default currency is INR (₹) unless clearly specified otherwise.
- Set the confidence score based on the clarity of the image.`,
});

const receiptScannerFlow = ai.defineFlow(
  {
    name: 'receiptScannerFlow',
    inputSchema: ReceiptScannerInputSchema,
    outputSchema: ReceiptScannerOutputSchema,
  },
  async (input) => {
    const { output } = await receiptPrompt(input);
    return output!;
  }
);
