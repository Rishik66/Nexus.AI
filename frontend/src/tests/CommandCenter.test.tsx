import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import { CommandCenter } from '../pages/CommandCenter.js';

describe('AI Command Center Component Tests', () => {
  it('renders the Command Center title and input elements', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CommandCenter />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('AI Command Center')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type or speak an enterprise goal/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Execution Plan/i)).toBeInTheDocument();
  });

  it('renders suggested autonomous business commands', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CommandCenter />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Infrastructure & Asset Procurement')).toBeInTheDocument();
    expect(screen.getByText('Expense Anomaly & Cloud Audit')).toBeInTheDocument();
    expect(screen.getByText('Client Invoices & Receivables')).toBeInTheDocument();
  });
});
