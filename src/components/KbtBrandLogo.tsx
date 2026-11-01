import React from 'react';

export type LogoUseCase = 'desktop-titlebar' | 'mobile-appbar' | 'web-header' | 'standalone-icon' | 'large';

interface KbtBrandLogoProps {
  useCase?: LogoUseCase;
  className?: string;
  showGlow?: boolean;
  altText?: string;
  onClick?: () => void;
}

/**
 * KBT App Logo Component
 *
 * Implements the official KBT tech-styled green/yellow spider icon and
 * Tailwind squircle mask geometry defined in kbt-integration-guide.txt.
 * Resized and optimized for:
 * 1. Application Icon in Desktop (Windows/macOS) Title Bars (20px - 24px)
 * 2. Brand Logo of Mobile App Bars (iOS/Android) (32px)
 * 3. Brand (App) Logo of Web Header Bars (32px - 36px)
 * 4. Large Showcase Asset (64px - 96px)
 */
export const KbtBrandLogo: React.FC<KbtBrandLogoProps> = ({
  useCase = 'web-header',
  className = '',
  showGlow = true,
  altText = 'KBT App Logo',
  onClick
}) => {
  const logoSrc = '/assets/kbt-logo-transparent.png';

  switch (useCase) {
    case 'desktop-titlebar':
      // 20px - 22px ultra-crisp icon for Windows / macOS native window title bars
      return (
        <div
          onClick={onClick}
          className={`relative w-5 h-5 flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
          title="KBT_Recorder Desktop Title Bar App Icon"
        >
          <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-zinc-900 to-black p-0.5 border border-lime-400/30 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              src={logoSrc}
              alt={altText}
              className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(163,230,53,0.6)]"
              loading="eager"
            />
          </div>
        </div>
      );

    case 'mobile-appbar':
      // 32px squircle masked mobile app bar icon for iOS / Android navigation bars
      return (
        <div
          onClick={onClick}
          className={`relative w-8 h-8 flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
          title="KBT_Recorder Mobile App Bar Brand Logo"
        >
          <div className="relative w-8 h-8 bg-gradient-to-br from-zinc-900 via-slate-950 to-black p-1 mask-squircle flex items-center justify-center border border-lime-400/40 shadow-sm">
            <img
              src={logoSrc}
              alt={altText}
              className={`w-full h-full object-contain ${
                showGlow ? 'filter drop-shadow-[0_0_6px_rgba(163,230,53,0.65)]' : ''
              }`}
              loading="eager"
            />
          </div>
          <div className="absolute inset-0 rounded-full border border-lime-400/20 pointer-events-none" />
        </div>
      );

    case 'large':
      // 80px - 96px high-res hero icon with squircle mask for Modals & Install views
      return (
        <div
          onClick={onClick}
          className={`relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-zinc-900 via-neutral-950 to-black p-3.5 mask-squircle flex items-center justify-center border border-yellow-400/30 shadow-xl ${
            onClick ? 'cursor-pointer' : ''
          } ${className}`}
          title="KBT High-Resolution Brand Icon"
        >
          <img
            src={logoSrc}
            alt={altText}
            className={`w-full h-full object-contain ${
              showGlow ? 'filter drop-shadow-[0_0_12px_rgba(163,230,53,0.6)]' : ''
            }`}
            loading="eager"
          />
        </div>
      );

    case 'standalone-icon':
      return (
        <img
          src={logoSrc}
          alt={altText}
          onClick={onClick}
          className={`object-contain ${showGlow ? 'filter drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]' : ''} ${className}`}
          loading="eager"
        />
      );

    case 'web-header':
    default:
      // 32px - 36px header logo with tech border and subtle cybernetic ring
      return (
        <div
          onClick={onClick}
          className={`relative w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-zinc-900 to-black p-1.5 mask-squircle flex items-center justify-center border border-lime-400/30 shadow-md shadow-lime-950/20 shrink-0 ${
            onClick ? 'cursor-pointer hover:border-lime-400/60 transition-colors' : ''
          } ${className}`}
          title="KBT_Recorder Web Header Brand Logo"
        >
          <img
            src={logoSrc}
            alt={altText}
            className={`w-full h-full object-contain ${
              showGlow ? 'filter drop-shadow-[0_0_8px_rgba(163,230,53,0.55)]' : ''
            }`}
            loading="eager"
          />
        </div>
      );
  }
};
