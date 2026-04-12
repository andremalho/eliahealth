import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>Alto Risco</Badge>);
    expect(screen.getByText('Alto Risco')).toBeInTheDocument();
  });

  it('applies variant', () => {
    const { container } = render(<Badge variant="danger">Urgente</Badge>);
    expect(container.firstChild).toHaveClass('bg-red-50');
  });

  it('renders dot indicator', () => {
    const { container } = render(<Badge dot>Status</Badge>);
    const dot = container.querySelector('.rounded-full.w-1\\.5');
    expect(dot).toBeInTheDocument();
  });
});
