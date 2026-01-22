import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceRecorder } from '@/features/memory/components/VoiceRecorder';

// Note: MediaRecorder and getUserMedia are non-configurable in JSDOM,
// so we focus on testing UI behavior that doesn't require actual recording.

describe('VoiceRecorder', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<VoiceRecorder {...defaultProps} />);
      expect(screen.getByText('Voice Note')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<VoiceRecorder {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Voice Note')).not.toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('should show timer at 00:00 initially', () => {
      render(<VoiceRecorder {...defaultProps} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should show mic icon on record button', () => {
      render(<VoiceRecorder {...defaultProps} />);
      expect(screen.getByText('mic')).toBeInTheDocument();
    });

    it('should show Cancel button', () => {
      render(<VoiceRecorder {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show Done button', () => {
      render(<VoiceRecorder {...defaultProps} />);
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('preview mode', () => {
    it('should show preview controls when initialVoiceNote is provided', () => {
      render(<VoiceRecorder {...defaultProps} initialVoiceNote="data:audio/webm;base64,test" />);
      expect(screen.getByText('Preview Recording')).toBeInTheDocument();
    });

    it('should show Play and Delete buttons in preview mode', () => {
      render(<VoiceRecorder {...defaultProps} initialVoiceNote="data:audio/webm;base64,test" />);
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should delete voice note when delete is clicked', async () => {
      const user = userEvent.setup();
      render(<VoiceRecorder {...defaultProps} initialVoiceNote="data:audio/webm;base64,test" />);

      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.queryByText('Preview Recording')).not.toBeInTheDocument();
        expect(screen.getByText('Voice Note')).toBeInTheDocument();
      });
    });

    it('should show check icon when voice note exists', () => {
      render(<VoiceRecorder {...defaultProps} initialVoiceNote="data:audio/webm;base64,test" />);
      expect(screen.getByText('check')).toBeInTheDocument();
    });
  });

  describe('cancel', () => {
    it('should call onClose when cancel is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<VoiceRecorder {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<VoiceRecorder {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.absolute.inset-0.z-0');
      await user.click(backdrop!);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should call onSave and onClose when done is clicked with recording', async () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <VoiceRecorder
          {...defaultProps}
          onSave={onSave}
          onClose={onClose}
          initialVoiceNote="data:audio/webm;base64,test"
        />
      );

      await user.click(screen.getByText('Done'));

      expect(onSave).toHaveBeenCalledWith('data:audio/webm;base64,test', 0);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('waveform visualization', () => {
    it('should show static waveform when no voice note', () => {
      const { container } = render(<VoiceRecorder {...defaultProps} />);
      // Check for inactive waveform bars
      const waveBars = container.querySelectorAll('.bg-ink\\/10');
      expect(waveBars.length).toBeGreaterThan(0);
    });

    it('should show green waveform when voice note exists', () => {
      const { container } = render(
        <VoiceRecorder {...defaultProps} initialVoiceNote="data:audio/webm;base64,test" />
      );
      // Check for green waveform bars
      const greenBars = container.querySelectorAll('[class*="green"]');
      expect(greenBars.length).toBeGreaterThan(0);
    });
  });
});
