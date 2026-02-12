const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
  '',
];

export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  for (const mimeType of AUDIO_MIME_CANDIDATES) {
    if (!mimeType || MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return '';
}

export function getAudioExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'webm';
}

export function buildAudioFilename(mimeType: string): string {
  const extension = getAudioExtensionFromMimeType(mimeType);
  return `voice-note-${Date.now()}.${extension}`;
}

export function getMicrophoneErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unable to access microphone';
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Microphone requires a secure connection (HTTPS or app context)';
  }

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Microphone permission denied. Please allow microphone access in system settings.';
    case 'SecurityError':
      return 'Microphone access blocked by browser/app security settings';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone found on this device';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Microphone is being used by another app';
    case 'OverconstrainedError':
      return 'Microphone does not meet recording requirements';
    default:
      return error.message || 'Unable to access microphone';
  }
}
