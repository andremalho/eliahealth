import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('handles click', () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop', () => {
    render(<Button disabled>Nope</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-red-600');
  });

  it('applies fullWidth', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.firstChild).toHaveClass('w-full');
  });
});
