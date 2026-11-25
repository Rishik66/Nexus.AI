import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import { Login } from '../pages/Login.js';

describe('Login Page Component Tests', () => {
  it('renders login screen with inputs and quick login buttons', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('NEXUS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@nexus.ai/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to NEXUS AI/i })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });
});
