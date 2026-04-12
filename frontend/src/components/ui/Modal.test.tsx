import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal open onClose={() => {}} title="Teste">Conteudo</Modal>);
    expect(screen.getByText('Teste')).toBeInTheDocument();
    expect(screen.getByText('Conteudo')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal open={false} onClose={() => {}} title="Teste">Conteudo</Modal>);
    expect(screen.queryByText('Teste')).not.toBeInTheDocument();
  });

  it('calls onClose on X button click', () => {
    const fn = vi.fn();
    render(<Modal open onClose={fn} title="Teste">Conteudo</Modal>);
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const fn = vi.fn();
    render(<Modal open onClose={fn} title="Teste">Conteudo</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('has aria-modal attribute', () => {
    render(<Modal open onClose={() => {}} title="Teste">Conteudo</Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders footer', () => {
    render(<Modal open onClose={() => {}} title="Teste" footer={<button>Salvar</button>}>Conteudo</Modal>);
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });
});
