// client/tests/allPerksPage.test.jsx
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';

import AllPerks from '../src/pages/AllPerks.jsx';
import { renderWithRouter } from './utils/renderWithRouter.js';

describe('AllPerks page (Directory)', () => {
  test('lists public perks and responds to name filtering', async () => {
    const seededPerk = global.__TEST_CONTEXT__.seededPerk;

    renderWithRouter(
      <Routes>
        <Route path="/explore" element={<AllPerks />} />
      </Routes>,
      { initialEntries: ['/explore'] }
    );

    // Wait for initial fetch and baseline card.
    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // Filter by name using the seeded title.
    const nameFilter = screen.getByPlaceholderText('Enter perk name...');
    fireEvent.change(nameFilter, { target: { value: seededPerk.title } });

    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // Summary reflects visible results.
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing');
  });

  test('lists public perks and responds to merchant filtering', async () => {
    const seededPerk = global.__TEST_CONTEXT__.seededPerk;

    renderWithRouter(
      <Routes>
        <Route path="/explore" element={<AllPerks />} />
      </Routes>,
      { initialEntries: ['/explore'] }
    );

    // Wait for initial fetch and baseline card.
    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // Resolve a merchant display name from the seeded fixture.
    const merchantName =
      seededPerk.merchant?.name ??
      seededPerk.merchant ??
      seededPerk.merchantName ??
      seededPerk.merchantTitle ??
      '';

    // Find the merchant select (role=combobox).
    const comboboxes = screen.queryAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
    const merchantSelect = comboboxes[0];

    // Choose the option by visible text if present, else set value directly.
    const option = Array.from(merchantSelect.querySelectorAll('option')).find(
      (o) => o.textContent.trim() === merchantName
    );

    if (option) {
      fireEvent.change(merchantSelect, { target: { value: option.value } });
    } else {
      fireEvent.change(merchantSelect, { target: { value: merchantName } });
    }

    // Seeded perk should remain visible after filtering.
    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // Summary reflects visible results.
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing');
  });
});
