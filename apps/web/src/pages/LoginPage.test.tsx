import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders an accessible login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });
});
