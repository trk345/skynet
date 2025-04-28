// frontend/__tests__/testUtils.jsx

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock modules
vi.mock('axios');

// Create a custom render function that includes router
export function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

// Common navigation mocks
export const navigationMocks = {
  useNavigateMock: vi.fn(),
  useLocationMock: (pathname = '/') => ({ pathname }),
  setupNavigationMocks: () => {
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => navigationMocks.useNavigateMock,
        useLocation: () => navigationMocks.useLocationMock()
      };
    });
    return navigationMocks.useNavigateMock;
  }
};