import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }

  interface HTMLElementTagNameMap {
    'model-viewer': ModelViewerElement;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export interface ModelViewerElement extends HTMLElement {
  activateAR: () => Promise<void>;
  canActivateAR: boolean;
  dismissPoster: () => void;
  showPoster: () => void;
  resetTurntableRotation: () => void;
  cameraOrbit: string;
  cameraTarget?: string;
  fieldOfView: string;
  currentTime: number;
  paused: boolean;
  play: () => void;
  pause: () => void;
}
