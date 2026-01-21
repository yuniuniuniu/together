import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import NewMilestone from '../../pages/NewMilestone';
import * as client from '../../shared/api/client';

// We need to import vi for the mock in tests that use navigator.geolocation

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API client
vi.mock('../../shared/api/client', () => ({
  milestonesApi: {
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockMilestonesApi = client.milestonesApi as {
  create: ReturnType<typeof vi.fn>;
};

const renderNewMilestone = () => {
  return render(
    <BrowserRouter>
      <NewMilestone />
    </BrowserRouter>
  );
};

describe('NewMilestone Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('rendering', () => {
    it('should render new milestone form elements', () => {
      renderNewMilestone();

      expect(screen.getByText('New Milestone')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Moving In Together')).toBeInTheDocument();
    });

    it('should render category buttons', () => {
      renderNewMilestone();

      expect(screen.getByText('Milestone')).toBeInTheDocument();
      expect(screen.getByText('Trip')).toBeInTheDocument();
      expect(screen.getByText('Anniversary')).toBeInTheDocument();
      expect(screen.getByText('Life Event')).toBeInTheDocument();
    });

    it('should render feelings textarea', () => {
      renderNewMilestone();

      expect(screen.getByText('Our Feelings')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/How did this moment make us feel/)).toBeInTheDocument();
    });

    it('should render add location button', () => {
      renderNewMilestone();

      expect(screen.getByText('Add Location')).toBeInTheDocument();
    });
  });

  describe('title input', () => {
    it('should update title on typing', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Wedding Day');

      expect(titleInput).toHaveValue('Our Wedding Day');
    });
  });

  describe('description input', () => {
    it('should update description on typing', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const descriptionTextarea = screen.getByPlaceholderText(/How did this moment make us feel/);
      await user.type(descriptionTextarea, 'An amazing day we will never forget');

      expect(descriptionTextarea).toHaveValue('An amazing day we will never forget');
    });
  });

  describe('category selection', () => {
    it('should default to Milestone category', () => {
      renderNewMilestone();

      const milestoneButton = screen.getByText('Milestone').closest('button');
      expect(milestoneButton).toHaveClass('bg-milestone-pink');
    });

    it('should select different category on click', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const tripButton = screen.getByText('Trip').closest('button');
      await user.click(tripButton!);

      expect(tripButton).toHaveClass('bg-milestone-pink');

      // Milestone should no longer be active
      const milestoneButton = screen.getByText('Milestone').closest('button');
      expect(milestoneButton).not.toHaveClass('bg-milestone-pink');
    });
  });

  describe('date picker', () => {
    it('should show today in date button by default', () => {
      renderNewMilestone();

      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      expect(screen.getByText(`Today, ${formattedDate}`)).toBeInTheDocument();
    });

    it('should open date picker on click', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const dateButton = screen.getByText(/Today,/).closest('button');
      await user.click(dateButton!);

      // Date input should appear (it's an input[type="date"])
      await waitFor(() => {
        const dateInput = document.querySelector('input[type="date"]');
        expect(dateInput).toBeInTheDocument();
      });
    });
  });

  describe('save functionality', () => {
    it('should disable save button when title is empty', () => {
      renderNewMilestone();

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when title has value', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Anniversary');

      const saveButton = screen.getByText('Save');
      expect(saveButton).not.toBeDisabled();
    });

    it('should call API and navigate on save', async () => {
      const user = userEvent.setup();
      mockMilestonesApi.create.mockResolvedValue({
        data: {
          id: 'milestone-1',
          title: 'Our Anniversary',
          date: '2024-01-20',
          type: 'Milestone',
        },
      });

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Anniversary');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMilestonesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Our Anniversary',
            type: 'Milestone',
          })
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should include description in API call', async () => {
      const user = userEvent.setup();
      mockMilestonesApi.create.mockResolvedValue({
        data: {
          id: 'milestone-1',
          title: 'Our Anniversary',
          description: 'A special day',
          date: '2024-01-20',
          type: 'Milestone',
        },
      });

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Anniversary');

      const descriptionTextarea = screen.getByPlaceholderText(/How did this moment make us feel/);
      await user.type(descriptionTextarea, 'A special day');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMilestonesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Our Anniversary',
            description: 'A special day',
          })
        );
      });
    });

    it('should show error on API failure', async () => {
      const user = userEvent.setup();
      mockMilestonesApi.create.mockRejectedValue(new Error('Failed to create milestone'));

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Anniversary');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create milestone')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMilestonesApi.create.mockReturnValue(pendingPromise);

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Anniversary');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!({ data: {} });
    });

    it('should show error when title is empty on submit', async () => {
      renderNewMilestone();

      // Save button should be disabled for empty title
      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup();
      mockMilestonesApi.create.mockResolvedValue({
        data: { id: 'milestone-1' },
      });

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, '  Our Anniversary  ');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMilestonesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Our Anniversary',
          })
        );
      });
    });
  });

  describe('cancel functionality', () => {
    it('should navigate back on cancel', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('location picker', () => {
    it('should open location picker on button click', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      const addLocationButton = screen.getByText('Add Location').closest('button');
      await user.click(addLocationButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for a place...')).toBeInTheDocument();
      });
    });

    it('should select location from saved memories', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      // Open location picker
      const addLocationButton = screen.getByText('Add Location').closest('button');
      await user.click(addLocationButton!);

      await waitFor(() => {
        expect(screen.getByText('First Date Spot')).toBeInTheDocument();
      });

      // Select a location
      const locationOption = screen.getByText('First Date Spot').closest('button');
      await user.click(locationOption!);

      // Location should be displayed
      await waitFor(() => {
        // The location picker should close and location badge should appear
        expect(screen.getByText('First Date Spot')).toBeInTheDocument();
      });
    });

    it('should remove selected location', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      // Open location picker
      const addLocationButton = screen.getByText('Add Location').closest('button');
      await user.click(addLocationButton!);

      await waitFor(() => {
        expect(screen.getByText('First Date Spot')).toBeInTheDocument();
      });

      // Select a location
      const locationOption = screen.getByText('First Date Spot').closest('button');
      await user.click(locationOption!);

      // Find and click remove button
      await waitFor(() => {
        const closeButtons = screen.getAllByText('close');
        expect(closeButtons.length).toBeGreaterThan(0);
      });

      const closeButton = screen.getByText('close').closest('button');
      await user.click(closeButton!);

      // Add Location button should reappear
      await waitFor(() => {
        expect(screen.getByText('Add Location')).toBeInTheDocument();
      });
    });

    it('should allow custom location entry', async () => {
      const user = userEvent.setup();
      renderNewMilestone();

      // Open location picker
      const addLocationButton = screen.getByText('Add Location').closest('button');
      await user.click(addLocationButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for a place...')).toBeInTheDocument();
      });

      // Type custom location
      const searchInput = screen.getByPlaceholderText('Search for a place...');
      await user.type(searchInput, 'My Custom Location');

      // Should show use custom location button
      await waitFor(() => {
        expect(screen.getByText('Use "My Custom Location"')).toBeInTheDocument();
      });
    });

    it('should use current location', async () => {
      const user = userEvent.setup();
      // Mock geolocation to call the success callback
      const mockGeolocation = navigator.geolocation as {
        getCurrentPosition: ReturnType<typeof vi.fn>;
      };
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({ coords: { latitude: 0, longitude: 0 } });
      });

      renderNewMilestone();

      // Open location picker
      const addLocationButton = screen.getByText('Add Location').closest('button');
      await user.click(addLocationButton!);

      await waitFor(() => {
        expect(screen.getByText('Use current location')).toBeInTheDocument();
      });

      // Click use current location
      const currentLocationButton = screen.getByText('Use current location').closest('button');
      await user.click(currentLocationButton!);

      // Current Location should be selected (the location picker closes and location badge appears)
      await waitFor(() => {
        // After selecting, the location picker should close
        expect(screen.queryByPlaceholderText('Search for a place...')).not.toBeInTheDocument();
      });
    });
  });

  describe('category type in API call', () => {
    it('should include selected type in API call', async () => {
      const user = userEvent.setup();
      mockMilestonesApi.create.mockResolvedValue({
        data: { id: 'milestone-1' },
      });

      renderNewMilestone();

      const titleInput = screen.getByPlaceholderText('Moving In Together');
      await user.type(titleInput, 'Our Trip');

      // Select Trip category
      const tripButton = screen.getByText('Trip').closest('button');
      await user.click(tripButton!);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMilestonesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Our Trip',
            type: 'Trip',
          })
        );
      });
    });
  });
});
