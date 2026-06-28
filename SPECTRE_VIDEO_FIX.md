# Spectre Video Issue - Root Cause & Fix

## Problem
All in-app Spectre videos were showing the same clip instead of displaying different videos based on their assigned state (e.g., "thinking", "celebration", "idle", etc.).

## Root Cause
The `SpectreVideoPlayer` component had two issues:

### Issue 1: Missing `key` prop on video element
When the video source changed, React reused the same DOM video element and only updated the `src` attribute. Browsers don't always properly load new videos when just the `src` attribute changes on an existing video element.

**OnboardingFlow** (which worked correctly) used:
```tsx
<video key={currentSlide.clip} ... />
```

**SpectreVideoPlayer** (broken) used:
```tsx
<video src={currentSrc} ... />  // No key prop!
```

### Issue 2: Stale closure in state comparison
The effect that handles state changes referenced `currentSrc` but it wasn't in the dependency array, causing potential stale closure issues.

## Fix Applied

### 1. Added `key` prop to force element remount
```tsx
<video
  key={currentSrc}  // Forces new element when src changes
  ref={videoRef}
  src={currentSrc}
  ...
/>
```

### 2. Fixed stale closure with functional update
Changed from direct state comparison to functional update pattern:
```tsx
setCurrentSrc(prevSrc => {
  if (newSrc === prevSrc) {
    // Same clip — just restart it
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    return prevSrc;
  }

  // Reset error state on state change
  setHasError(false);
  setIsLoading(false);
  setRetryCount(0);
  setVisible(true);
  return newSrc;
});
```

## Files Modified
- `/client/src/components/SpectreVideoPlayer.tsx`

## Testing
After this fix:
1. Navigate to different pages with different Spectre states (e.g., Lead Intelligence with "thinking", Pipeline with "celebration")
2. Each page should now display the correct unique video for that state
3. The chatbot widget should also display the correct video based on its current state
