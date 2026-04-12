import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Input label="Nome" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="CPF" error="CPF invalido" />);
    expect(screen.getByText('CPF invalido')).toBeInTheDocument();
  });

  it('shows hint text', () => {
    render(<Input label="CEP" hint="Apenas numeros" />);
    expect(screen.getByText('Apenas numeros')).toBeInTheDocument();
  });

  it('sets aria-invalid on error', () => {
    render(<Input label="Test" error="Erro" />);
    expect(screen.getByLabelText('Test')).toHaveAttribute('aria-invalid', 'true');
  });
});
