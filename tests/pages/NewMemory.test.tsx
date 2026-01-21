import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import NewMemory from '../../pages/NewMemory';
import * as client from '../../shared/api/client';

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
  memoriesApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockMemoriesApi = client.memoriesApi as {
  create: ReturnType<typeof vi.fn>;
};

const renderNewMemory = () => {
  return render(
    <BrowserRouter>
      <NewMemory />
    </BrowserRouter>
  );
};

describe('NewMemory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('rendering', () => {
    it('should render new memory form elements', () => {
      renderNewMemory();

      expect(screen.getByText('New Memory')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Dear You/)).toBeInTheDocument();
    });

    it('should render mood selector', () => {
      renderNewMemory();

      expect(screen.getByText('Happy')).toBeInTheDocument();
      expect(screen.getByText('Calm')).toBeInTheDocument();
      expect(screen.getByText('Together')).toBeInTheDocument();
      expect(screen.getByText('Excited')).toBeInTheDocument();
      expect(screen.getByText('Moody')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderNewMemory();

      // Word count display
      expect(screen.getByText('0 words')).toBeInTheDocument();
    });
  });

  describe('content input', () => {
    it('should update content on typing', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'This is my memory');

      expect(textarea).toHaveValue('This is my memory');
    });

    it('should update word count', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'One two three');

      expect(screen.getByText('3 words')).toBeInTheDocument();
    });
  });

  describe('mood selection', () => {
    it('should select mood on click', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      const calmButton = screen.getByText('Calm').closest('button');
      await user.click(calmButton!);

      // The Calm button should now be active (visual change)
      expect(calmButton).toHaveClass('opacity-100');
    });
  });

  describe('save functionality', () => {
    it('should disable save button when content is empty', () => {
      renderNewMemory();

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when content has value', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'Test content');

      const saveButton = screen.getByText('Save');
      expect(saveButton).not.toBeDisabled();
    });

    it('should call API and navigate on save', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.create.mockResolvedValue({
        data: {
          id: 'new-memory-id',
          content: 'Test memory content',
          mood: 'Happy',
          photos: [],
          stickers: [],
          createdAt: new Date().toISOString(),
          createdBy: 'user-1',
        },
      });

      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'Test memory content');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMemoriesApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Test memory content',
            mood: 'Happy',
          })
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error on API failure', async () => {
      const user = userEvent.setup();
      mockMemoriesApi.create.mockRejectedValue(new Error('Failed to save'));

      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'Test content');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state while saving', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMemoriesApi.create.mockReturnValue(pendingPromise);

      renderNewMemory();

      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, 'Test content');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Cleanup
      resolvePromise!({ data: {} });
    });
  });

  describe('cancel functionality', () => {
    it('should navigate back on cancel', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('location picker', () => {
    it('should open location picker on button click', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Find the location button in the action bar
      const locationButtons = screen.getAllByText('location_on');
      // Click the one in the action bar (first one)
      await user.click(locationButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('Add Location')).toBeInTheDocument();
      });
    });

    it('should open location modal when button clicked', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Open location picker
      const locationButtons = screen.getAllByText('location_on');
      await user.click(locationButtons[0].closest('button')!);

      // Location modal should appear with search functionality
      await waitFor(() => {
        expect(screen.getByText('Add Location')).toBeInTheDocument();
      });
    });
  });

  describe('voice recorder', () => {
    it('should open voice recorder on button click', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Find and click mic button
      const micButtons = screen.getAllByText('mic');
      await user.click(micButtons[0].closest('button')!);

      // Recorder overlay should appear
      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeInTheDocument(); // Timer
      });
    });

    it('should close voice recorder on cancel', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Open voice recorder
      const micButtons = screen.getAllByText('mic');
      await user.click(micButtons[0].closest('button')!);

      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeInTheDocument();
      });

      // Click cancel (there are multiple, get all and find the one in the voice recorder)
      const cancelButtons = screen.getAllByText('Cancel');
      // The voice recorder cancel button is typically the last one
      const voiceRecorderCancel = cancelButtons[cancelButtons.length - 1];
      await user.click(voiceRecorderCancel);

      // Timer should be gone (recorder closed)
      await waitFor(() => {
        expect(screen.queryByText('00:00')).not.toBeInTheDocument();
      });
    });
  });

  describe('sticker picker', () => {
    it('should open sticker picker on button click', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Find sentiment button
      const stickerButton = screen.getByText('sentiment_satisfied').closest('button');
      await user.click(stickerButton!);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search stickers...')).toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('should show error when trying to save empty content', async () => {
      const user = userEvent.setup();
      renderNewMemory();

      // Type and clear to make button enabled then submit with whitespace
      const textarea = screen.getByPlaceholderText(/Dear You/);
      await user.type(textarea, '   '); // Just whitespace

      // Button should still be disabled for whitespace-only
      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });
  });
});
