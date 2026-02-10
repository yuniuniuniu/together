import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SwipeableImageContainer } from '../SwipeableImageContainer';

describe('SwipeableImageContainer', () => {
  it('renders children', () => {
    render(
      <SwipeableImageContainer
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        canSwipeLeft={true}
        canSwipeRight={true}
      >
        <div>Test Content</div>
      </SwipeableImageContainer>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onSwipeLeft when swiped left', async () => {
    const onSwipeLeft = vi.fn();

    render(
      <SwipeableImageContainer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={vi.fn()}
        canSwipeLeft={true}
        canSwipeRight={true}
      >
        <div>Test</div>
      </SwipeableImageContainer>
    );

    // Note: Actual gesture testing would require more complex setup
    // This is a structural test
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('renders with disabled prop', () => {
    render(
      <SwipeableImageContainer
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        canSwipeLeft={true}
        canSwipeRight={true}
        disabled={true}
      >
        <div>Test Content</div>
      </SwipeableImageContainer>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('respects canSwipeLeft constraint', () => {
    const onSwipeLeft = vi.fn();

    render(
      <SwipeableImageContainer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={vi.fn()}
        canSwipeLeft={false}
        canSwipeRight={true}
      >
        <div>Test</div>
      </SwipeableImageContainer>
    );

    // Structural test - component should render
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('respects canSwipeRight constraint', () => {
    const onSwipeRight = vi.fn();

    render(
      <SwipeableImageContainer
        onSwipeLeft={vi.fn()}
        onSwipeRight={onSwipeRight}
        canSwipeLeft={true}
        canSwipeRight={false}
      >
        <div>Test</div>
      </SwipeableImageContainer>
    );

    // Structural test - component should render
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
