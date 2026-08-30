import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav } from './BottomNav';

const mockSetCurrentView = vi.fn();

vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    currentView: 'dashboard',
    setCurrentView: mockSetCurrentView,
  }),
}));

beforeEach(() => {
  mockSetCurrentView.mockClear();
});

describe('BottomNav', () => {
  it('renders all 4 nav labels', () => {
    render(<BottomNav />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Análise')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });

  it('calls setCurrentView with "history" when clicking Análise', async () => {
    const user = userEvent.setup();
    render(<BottomNav />);

    await user.click(screen.getByText('Análise'));

    expect(mockSetCurrentView).toHaveBeenCalledWith('history');
  });
});
