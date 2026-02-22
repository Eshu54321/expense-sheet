import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from '../types';

const getClient = () => {
  // Support both standard Node process.env (for dev) and Vite import.meta.env (for production)
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key is missing. Please check your .env file or deployment settings.");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseExpenseNaturalLanguage = async (input: string): Promise<{ expenses: Omit<Expense, 'id'>[], items: { name: string, quantity: string, rate: number, total: number, unit: string | null }[] }> => {
  const ai = getClient();

  const prompt = `
    Parse the following natural language expense text into a structured JSON array.
    Context: The user is in India. Currency is INR (₹).
    Current Date: ${new Date().toISOString().split('T')[0]}.
    
    CRITICAL INSTRUCTION: If the input lists multiple items (e.g., "Tomato 1kg 50rs, Onion 2kg 60rs"), you MUST split them into separate objects in the 'expenses' array.
    Also, extract detailed item information into a separate 'items' array.
    
    For the 'items' array:
    - name: Item name (e.g., "Tomato")
    - quantity: Quantity string (e.g., "1kg")
    - rate: Rate per unit if available (e.g., 50). If only total is given, calculate rate if quantity is known, else null.
    - unit: Unit string (e.g., "kg", "packet").
    - total: Total amount for this item.

    Example Output Structure:
    {
      "expenses": [ ...standard expenses... ],
      "items": [
        { "name": "Tomato", "quantity": "1kg", "rate": 50, "unit": "kg", "total": 50 }
      ]
    }
    
    Input: "${input}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  paymentMethod: { type: Type.STRING }
                },
                required: ["description", "amount", "category", "date", "paymentMethod"]
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  rate: { type: Type.NUMBER },
                  unit: { type: Type.STRING, nullable: true },
                  total: { type: Type.NUMBER }
                },
                required: ["name", "total"]
              }
            }
          },
          required: ["expenses", "items"]
        }
      }
    });

    const text = response.text;
    if (!text) return { expenses: [], items: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const parseExpenseImage = async (imageBase64: string): Promise<{ expenses: Omit<Expense, 'id'>[], items: { name: string, quantity: string, rate: number, total: number, unit: string | null }[] }> => {
  const ai = getClient();

  const prompt = `
    Analyze this receipt/bill image and extract the expense details into a structured JSON object.
    Context: The user is in India. Currency is INR (₹).
    Current Date: ${new Date().toISOString().split('T')[0]}.
    If the date is visible on the receipt, use it. Otherwise use current date.

    CRITICAL INSTRUCTION: You MUST list every single line item on the bill as a separate expense object in the 'expenses' array.
    Also, extract detailed item information into a separate 'items' array for any item that has a price/rate.
    
    For each expense item:
    - 'description': The item name followed by quantity/rate if visible (e.g., "Basmati Rice (5kg)", "Sugar (1kg @ 40/kg)").
    - 'amount': The price for that specific item line.
    - 'category': Guess the specific category for that item (e.g., 'Food & Dining' for vegetables, 'Health' for medicines).
    - 'paymentMethod': Guess the payment method if visible at the bottom, otherwise default to 'Cash'.
    - 'date': The date on the receipt (YYYY-MM-DD).

    For each item in the 'items' array (ESSENTIAL FOR RATE TRACKING):
    - name: Item name (e.g., "Tomato")
    - quantity: Quantity string (e.g., "1kg")
    - rate: Rate per unit (e.g., 50). You MUST find or calculate this from the receipt.
    - unit: Unit string (e.g., "kg", "packet", "unit").
    - total: Total amount for this item line.

    CRITICAL: For every line item in the 'expenses' array, there should be a corresponding entry in the 'items' array if a rate/price per unit can be determined.

    Example Output Structure:
    {
      "expenses": [ ...standard expenses... ],
      "items": [
        { "name": "Tomato", "quantity": "1kg", "rate": 50, "unit": "kg", "total": 50 }
      ]
    }

    If the image is not a clear bill with items (e.g., just a payment screenshot), extract the total amount as a single entry in 'expenses' and leave 'items' empty.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  paymentMethod: { type: Type.STRING }
                },
                required: ["description", "amount", "category", "date", "paymentMethod"]
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  rate: { type: Type.NUMBER },
                  unit: { type: Type.STRING, nullable: true },
                  total: { type: Type.NUMBER }
                },
                required: ["name", "total"]
              }
            }
          },
          required: ["expenses", "items"]
        }
      }
    });

    const text = response.text;
    if (!text) return { expenses: [], items: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Image Parse Error:", error);
    throw error;
  }
};

export const generateSpendingInsights = async (expenses: Expense[]): Promise<string> => {
  const ai = getClient();

  // Limit to last 50 expenses to avoid token limits in this demo, though 2.5 flash handles large context well.
  const dataSummary = JSON.stringify(expenses.slice(0, 50));

  const prompt = `
    Analyze this expense data and provide a brief, professional financial insight.
    The currency is Indian Rupee (₹).
    Highlight spending anomalies, largest categories, or saving opportunities.
    Keep it under 3 sentences.
    Data: ${dataSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Could not generate insights at this time.";
  }
};