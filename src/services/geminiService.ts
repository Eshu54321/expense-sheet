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

export const parseExpenseNaturalLanguage = async (input: string): Promise<Omit<Expense, 'id'>[]> => {
  const ai = getClient();

  const prompt = `
    Parse the following natural language expense text into a structured JSON array.
    Context: The user is in India. Currency is INR (₹).
    Current Date: ${new Date().toISOString().split('T')[0]}.
    If the text implies income (e.g., "Salary", "Sold bike"), set the amount as a negative number.
    If no date is specified, use the current date.
    Common payment methods in India: UPI, Paytm, GPay, PhonePe, Credit Card, Cash.
    Input: "${input}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const parseExpenseImage = async (imageBase64: string): Promise<Omit<Expense, 'id'>[]> => {
  const ai = getClient();

  const prompt = `
    Analyze this receipt/bill image and extract the expense details into a structured JSON array.
    Context: The user is in India. Currency is INR (₹).
    Current Date: ${new Date().toISOString().split('T')[0]}.
    If the date is visible on the receipt, use it. Otherwise use current date.
    Extract the Merchant Name as 'description'.
    Extract the Total Amount as 'amount'.
    Guess the Category based on the merchant (e.g., 'Food & Dining', 'Shopping', 'Transportation').
    Guess the Payment Method if visible (e.g., 'Cash', 'Card', 'UPI'), otherwise default to 'Cash'.
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
        }
      }
    });

    const text = response.text;
    if (!text) return [];
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