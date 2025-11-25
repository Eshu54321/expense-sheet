import { gapi } from 'gapi-script';
import { Expense, RecurringExpense, SheetMetadata, Category } from '../types';

const SPREADSHEET_NAME = "ExpenseSheet Data";
const EXPENSES_SHEET_TITLE = "Expenses";
const RECURRING_SHEET_TITLE = "Recurring";

class GoogleSheetsService {
    private metadata: SheetMetadata | null = null;

    async ensureSpreadsheetExists(): Promise<SheetMetadata> {
        if (this.metadata) return this.metadata;

        // 1. Search for existing file
        const query = `name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
        const response = await (gapi.client as any).drive.files.list({
            q: query,
            spaces: 'drive',
            fields: 'files(id, name)',
        });

        const files = response.result.files;

        if (files && files.length > 0) {
            // Found it, load details
            const spreadsheetId = files[0].id;
            return await this.loadSheetMetadata(spreadsheetId);
        } else {
            // Create new
            return await this.createSpreadsheet();
        }
    }

    private async createSpreadsheet(): Promise<SheetMetadata> {
        const resource = {
            properties: {
                title: SPREADSHEET_NAME,
            },
            sheets: [
                { properties: { title: EXPENSES_SHEET_TITLE } },
                { properties: { title: RECURRING_SHEET_TITLE } }
            ]
        };

        const response = await (gapi.client as any).sheets.spreadsheets.create({
            resource,
        });

        const spreadsheetId = response.result.spreadsheetId;

        // Initialize Headers
        await this.writeHeaders(spreadsheetId);

        return await this.loadSheetMetadata(spreadsheetId);
    }

    private async writeHeaders(spreadsheetId: string) {
        const values = [
            ['ID', 'Date', 'Description', 'Category', 'Amount', 'Payment Method']
        ];

        const recurringValues = [
            ['ID', 'Description', 'Amount', 'Category', 'Frequency', 'Next Due Date', 'Active']
        ];

        await (gapi.client as any).sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${EXPENSES_SHEET_TITLE}!A1:F1`,
            valueInputOption: 'RAW',
            resource: { values }
        });

        await (gapi.client as any).sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${RECURRING_SHEET_TITLE}!A1:G1`,
            valueInputOption: 'RAW',
            resource: { values: recurringValues }
        });
    }

    private async loadSheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
        const response = await (gapi.client as any).sheets.spreadsheets.get({
            spreadsheetId,
        });

        const sheets = response.result.sheets;
        const expenseSheet = sheets.find((s: any) => s.properties.title === EXPENSES_SHEET_TITLE);
        const recurringSheet = sheets.find((s: any) => s.properties.title === RECURRING_SHEET_TITLE);

        this.metadata = {
            spreadsheetId,
            spreadsheetUrl: response.result.spreadsheetUrl,
            expenseSheetId: expenseSheet?.properties.sheetId || 0,
            recurringSheetId: recurringSheet?.properties.sheetId || 1,
        };

        return this.metadata;
    }

    // --- Expenses CRUD ---

    async getAllExpenses(): Promise<Expense[]> {
        const meta = await this.ensureSpreadsheetExists();
        const response = await (gapi.client as any).sheets.spreadsheets.values.get({
            spreadsheetId: meta.spreadsheetId,
            range: `${EXPENSES_SHEET_TITLE}!A2:F`, // Skip header
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) return [];

        return rows.map((row: any[]) => ({
            id: row[0],
            date: row[1],
            description: row[2],
            category: row[3] as Category,
            amount: parseFloat(row[4]),
            paymentMethod: row[5]
        }));
    }

    async addExpenses(expenses: Expense[]): Promise<void> {
        const meta = await this.ensureSpreadsheetExists();

        const values = expenses.map(e => [
            e.id, e.date, e.description, e.category, e.amount, e.paymentMethod
        ]);

        await (gapi.client as any).sheets.spreadsheets.values.append({
            spreadsheetId: meta.spreadsheetId,
            range: `${EXPENSES_SHEET_TITLE}!A1`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });
    }

    async updateExpense(expense: Expense): Promise<void> {
        // This is inefficient (find row then update), but works for now.
        // A better way is to maintain a local cache of ID -> Row Number
        const all = await this.getAllExpenses();
        const index = all.findIndex(e => e.id === expense.id);

        if (index === -1) return; // Not found

        const rowNumber = index + 2; // +1 for 0-index, +1 for header
        const meta = await this.ensureSpreadsheetExists();

        const values = [[
            expense.id, expense.date, expense.description, expense.category, expense.amount, expense.paymentMethod
        ]];

        await (gapi.client as any).sheets.spreadsheets.values.update({
            spreadsheetId: meta.spreadsheetId,
            range: `${EXPENSES_SHEET_TITLE}!A${rowNumber}:F${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });
    }

    async deleteExpense(id: string): Promise<void> {
        const all = await this.getAllExpenses();
        const index = all.findIndex(e => e.id === id);

        if (index === -1) return;

        const meta = await this.ensureSpreadsheetExists();
        const rowNumber = index + 1; // 0-indexed for batchUpdate deleteDimension

        // We use batchUpdate to delete the row
        await (gapi.client as any).sheets.spreadsheets.batchUpdate({
            spreadsheetId: meta.spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: meta.expenseSheetId,
                            dimension: 'ROWS',
                            startIndex: rowNumber,
                            endIndex: rowNumber + 1
                        }
                    }
                }]
            }
        });
    }

    // --- Recurring CRUD ---
    // Similar logic for recurring...

    async getAllRecurring(): Promise<RecurringExpense[]> {
        const meta = await this.ensureSpreadsheetExists();
        const response = await (gapi.client as any).sheets.spreadsheets.values.get({
            spreadsheetId: meta.spreadsheetId,
            range: `${RECURRING_SHEET_TITLE}!A2:G`,
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) return [];

        return rows.map((row: any[]) => ({
            id: row[0],
            description: row[1],
            amount: parseFloat(row[2]),
            category: row[3] as Category,
            frequency: row[4],
            nextDueDate: row[5],
            active: row[6] === 'TRUE'
        }));
    }

    async addRecurring(rule: RecurringExpense): Promise<void> {
        const meta = await this.ensureSpreadsheetExists();
        const values = [[
            rule.id, rule.description, rule.amount, rule.category, rule.frequency, rule.nextDueDate, rule.active
        ]];

        await (gapi.client as any).sheets.spreadsheets.values.append({
            spreadsheetId: meta.spreadsheetId,
            range: `${RECURRING_SHEET_TITLE}!A1`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });
    }

    async updateRecurring(rule: RecurringExpense): Promise<void> {
        const all = await this.getAllRecurring();
        const index = all.findIndex(r => r.id === rule.id);
        if (index === -1) return;

        const rowNumber = index + 2;
        const meta = await this.ensureSpreadsheetExists();

        const values = [[
            rule.id, rule.description, rule.amount, rule.category, rule.frequency, rule.nextDueDate, rule.active
        ]];

        await (gapi.client as any).sheets.spreadsheets.values.update({
            spreadsheetId: meta.spreadsheetId,
            range: `${RECURRING_SHEET_TITLE}!A${rowNumber}:G${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });
    }

    async deleteRecurring(id: string): Promise<void> {
        const all = await this.getAllRecurring();
        const index = all.findIndex(r => r.id === id);
        if (index === -1) return;

        const meta = await this.ensureSpreadsheetExists();
        const rowNumber = index + 1; // 0-indexed for batchUpdate

        await (gapi.client as any).sheets.spreadsheets.batchUpdate({
            spreadsheetId: meta.spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: meta.recurringSheetId,
                            dimension: 'ROWS',
                            startIndex: rowNumber,
                            endIndex: rowNumber + 1
                        }
                    }
                }]
            }
        });
    }

    async clearAllData(): Promise<void> {
        // Dangerous!
        const meta = await this.ensureSpreadsheetExists();

        // Clear Expenses (keep header)
        await (gapi.client as any).sheets.spreadsheets.values.clear({
            spreadsheetId: meta.spreadsheetId,
            range: `${EXPENSES_SHEET_TITLE}!A2:Z`
        });

        // Clear Recurring (keep header)
        await (gapi.client as any).sheets.spreadsheets.values.clear({
            spreadsheetId: meta.spreadsheetId,
            range: `${RECURRING_SHEET_TITLE}!A2:Z`
        });
    }
}

export const googleSheetsService = new GoogleSheetsService();
