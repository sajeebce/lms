export interface YouTubePauseOverlaySettings {
  topLabel: string;
  titleText: string;
  bottomLeftText: string;
  bottomRightText: string;
  topBackgroundClass: string;
  bottomBackgroundClass: string;
  // Solid color controls (no gradient)
  topGradientColor?: string;
  bottomGradientColor?: string;
}

export interface VdoCipherSettings {
  enabled: boolean;
  apiKey?: string | null;
  secretKey?: string | null;
}

export interface TenantVideoSettings {
  youtube: {
    pauseOverlay: YouTubePauseOverlaySettings;
  };
  vdocipher: VdoCipherSettings;
}
