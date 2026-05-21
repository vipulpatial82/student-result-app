import { render, screen } from '@testing-library/react';
import App from './App';

test('renders student result card heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Student Result Card/i);
  expect(headingElement).toBeInTheDocument();
});
