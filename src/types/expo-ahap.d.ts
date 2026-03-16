// Type declaration for expo-ahap — the package ships .ts source that
// has type errors against newer expo-modules-core. This override
// provides just the Player API we use.
declare module 'expo-ahap' {
  interface AHAPEventParameter {
    ParameterID: string;
    ParameterValue: number;
  }

  interface AHAPEvent {
    Event: {
      Time: number;
      EventType: 'HapticContinuous' | 'HapticTransient';
      EventDuration?: number;
      EventParameters: AHAPEventParameter[];
    };
  }

  interface AHAPParameterCurveControlPoint {
    Time: number;
    ParameterValue: number;
  }

  interface AHAPParameterCurve {
    ParameterCurve: {
      ParameterID: string;
      Time: number;
      ParameterCurveControlPoints: AHAPParameterCurveControlPoint[];
    };
  }

  interface AHAPPattern {
    Pattern: (AHAPEvent | AHAPParameterCurve)[];
  }

  export class Player {
    constructor(pattern: AHAPPattern);
    start(): void;
    unregister(): void;
  }
}
