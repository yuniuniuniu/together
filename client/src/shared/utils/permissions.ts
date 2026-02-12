export type PermissionType = 'photo' | 'camera' | 'location' | 'microphone';

export function getPermissionDeniedMessage(permission: PermissionType): string {
  switch (permission) {
    case 'photo':
      return 'Photo access denied. Please enable Photos permission in system settings and try again.';
    case 'camera':
      return 'Camera access denied. Please enable Camera permission in system settings and try again.';
    case 'location':
      return 'Location access denied. Please enable Location permission in system settings and try again.';
    case 'microphone':
      return 'Microphone access denied. Please enable Microphone permission in system settings and try again.';
    default:
      return 'Permission denied. Please check system settings and try again.';
  }
}
