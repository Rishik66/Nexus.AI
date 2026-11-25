import { z } from 'zod';
import { ToolDefinition } from '../types.js';

export const CurrencyConversionInputSchema = z.object({
  amount: z.number().describe('The monetary amount to convert'),
  from: z.string().describe('Source 3-letter currency code (e.g. USD)'),
  to: z.string().describe('Target 3-letter currency code (e.g. EUR, GBP, CAD, JPY)'),
});

export const CurrencyConversionOutputSchema = z.object({
  amount: z.number(),
  from: z.string(),
  to: z.string(),
  convertedAmount: z.number(),
  rate: z.number(),
  source: z.string(),
  date: z.string(),
});

// Resilient fallback rates if internet is disconnected or Frankfurter API has hiccups
const FALLBACK_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  JPY: 154.5,
  AUD: 1.52,
  INR: 84.4,
  CHF: 0.88,
  CNY: 7.23,
  USD: 1.0,
};

export const currencyConversionTool: ToolDefinition<
  z.infer<typeof CurrencyConversionInputSchema>,
  z.infer<typeof CurrencyConversionOutputSchema>
> = {
  name: 'CURRENCY_CONVERSION',
  description: 'Convert monetary values between global fiat currencies using live exchange rates from the Frankfurter API with graceful fallback.',
  riskLevel: 'LOW',
  inputSchema: CurrencyConversionInputSchema,
  outputSchema: CurrencyConversionOutputSchema,
  geminiFunctionDeclaration: {
    name: 'CURRENCY_CONVERSION',
    description: 'Convert an amount from one currency to another (e.g. USD to EUR, GBP, JPY).',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Monetary amount.' },
        from: { type: 'STRING', description: 'Source currency code (e.g. USD).' },
        to: { type: 'STRING', description: 'Target currency code (e.g. EUR).' },
      },
      required: ['amount', 'from', 'to'],
    },
  },
  execute: async (input) => {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();
    const amount = Number(input.amount);

    if (from === to) {
      return {
        amount,
        from,
        to,
        convertedAmount: amount,
        rate: 1.0,
        source: 'DIRECT_IDENTITY',
        date: new Date().toISOString().split('T')[0],
      };
    }

    try {
      const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json() as any;
        const converted = data.rates[to];
        const rate = converted / amount;
        return {
          amount,
          from,
          to,
          convertedAmount: Math.round(converted * 100) / 100,
          rate: Math.round(rate * 10000) / 10000,
          source: 'LIVE_FRANKFURTER_API',
          date: data.date || new Date().toISOString().split('T')[0],
        };
      }
    } catch (err) {
      console.warn('[CURRENCY_CONVERSION] External API unreachable, using resilient offline exchange rates:', err);
    }

    // Fallback deterministic rates relative to USD
    const usdRateFrom = FALLBACK_RATES[from] || 1.0;
    const usdRateTo = FALLBACK_RATES[to] || 1.0;
    const effectiveRate = usdRateTo / usdRateFrom;
    const converted = amount * effectiveRate;

    return {
      amount,
      from,
      to,
      convertedAmount: Math.round(converted * 100) / 100,
      rate: Math.round(effectiveRate * 10000) / 10000,
      source: 'CACHED_FALLBACK_RATES (OFFLINE_MODE)',
      date: new Date().toISOString().split('T')[0],
    };
  },
};
