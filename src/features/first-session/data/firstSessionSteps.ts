export interface FirstSessionStep {
  id: string;
  icon: string; // Ionicons name
  title: string;
  body: string;
  ctaLabel: string;
  ctaAction: 'logRide' | 'choosePark' | 'playCoastle' | 'importRides';
}

export const FIRST_SESSION_STEPS: FirstSessionStep[] = [
  {
    id: 'log-ride',
    icon: 'add-circle-outline',
    title: 'Log your first ride',
    body: 'Track every coaster you ride and build your personal collection.',
    ctaLabel: 'Log a Ride',
    ctaAction: 'logRide',
  },
  {
    id: 'home-park',
    icon: 'location-outline',
    title: 'Set your home park',
    body: 'Get personalized wait times and recommendations for your favorite park.',
    ctaLabel: 'Choose Park',
    ctaAction: 'choosePark',
  },
  {
    id: 'coastle',
    icon: 'game-controller-outline',
    title: 'Try Coastle',
    body: 'Can you guess the coaster from just a few clues? Test your knowledge.',
    ctaLabel: 'Play Now',
    ctaAction: 'playCoastle',
  },
  {
    id: 'import',
    icon: 'cloud-download-outline',
    title: 'Import your rides',
    body: 'Already have a ride history? Bring it into TrackR in seconds.',
    ctaLabel: 'Import',
    ctaAction: 'importRides',
  },
];
