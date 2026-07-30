import type { ReactNode } from 'react';
import { useContent } from '../lib/contentStore';
import { useMagnetic } from '../lib/useMagnetic';

/* --------------------------------------------------------------------------
 *  COVER SOCIAL BUTTONS
 *
 *  Circular icon buttons with a layered hover interaction:
 *    • magnetic follow — the button leans toward the cursor (useMagnetic)
 *    • fill sweep — the accent floods up from the bottom on a masked layer
 *    • icon swap — two stacked copies slide vertically so the icon appears
 *      to roll over rather than just recolour
 *    • label pop — the platform name rises above the button
 *
 *  The swap and fill are pure CSS (transform/opacity only, so GPU-composited
 *  and cheap). Magnetism is the one JS piece, on its own damped rAF loop.
 * ------------------------------------------------------------------------ */

type Social = {
  key: string;
  label: string;
  href: string;
  external: boolean;
  icon: ReactNode;
};

const ICONS = {
  github: (
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  ),
  linkedin: (
    <>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM10 9h3.8v1.64h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.75V21h-4v-5.66c0-1.35-.03-3.08-1.9-3.08-1.9 0-2.19 1.46-2.19 2.98V21h-4z" />
    </>
  ),
  whatsapp: (
    <path d="M12.04 2c-5.5 0-9.96 4.44-9.96 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a10 10 0 0 0 4.73 1.2h.01c5.5 0 9.96-4.45 9.96-9.9C22 6.44 17.54 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.24-3.3-.68-2.78-1.1-4.55-3.94-4.69-4.13-.14-.19-1.13-1.5-1.13-2.86s.71-2.03.97-2.31c.24-.28.53-.35.71-.35l.51.01c.16 0 .38-.06.6.46l.82 2c.07.14.11.3.02.48-.35.7-.72.67-.53.99.7 1.2 1.4 1.62 2.46 2.15.18.09.29.08.4-.05.14-.16.6-.7.76-.94.16-.24.32-.2.53-.12l1.9.9c.22.11.36.16.42.25.05.1.05.6-.19 1.28Z" />
  ),
  email: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </>
  ),
} as const;

function Btn({ social }: { social: Social }) {
  const ref = useMagnetic<HTMLAnchorElement>(0.4);

  return (
    <a
      ref={ref}
      href={social.href}
      target={social.external ? '_blank' : undefined}
      rel={social.external ? 'noreferrer noopener' : undefined}
      aria-label={social.label}
      className="group/social relative flex h-11 w-11 items-center justify-center rounded-full border border-ash-500/40 text-ash-200 transition-colors duration-300 hover:border-transparent"
    >
      {/* Fill sweep — floods up from the bottom on hover / focus. */}
      <span
        className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 rounded-full transition-transform duration-300 ease-out group-hover/social:scale-y-100 group-focus-visible/social:scale-y-100"
        style={{ background: 'rgb(var(--accent-ds))' }}
        aria-hidden
      />

      {/* Icon swap — two stacked copies; the wrapper slides up on hover so the
          second copy rolls in from below. */}
      <span className="relative z-10 block h-[18px] w-[18px] overflow-hidden">
        <span className="block transition-transform duration-300 ease-out group-hover/social:-translate-y-[18px] group-focus-visible/social:-translate-y-[18px]">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`flex h-[18px] w-[18px] items-center justify-center ${
                i === 1 ? 'text-white' : ''
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={social.key === 'email' || social.key === 'whatsapp' ? 'none' : 'currentColor'}
                stroke={
                  social.key === 'email' || social.key === 'whatsapp' ? 'currentColor' : 'none'
                }
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {social.icon}
              </svg>
            </span>
          ))}
        </span>
      </span>

      {/* Label pop — rises above the button on hover. */}
      <span
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-ash-600/50 bg-ash-900/95 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ash-100 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover/social:translate-y-0 group-hover/social:opacity-100 group-focus-visible/social:translate-y-0 group-focus-visible/social:opacity-100"
        aria-hidden
      >
        {social.label}
      </span>
    </a>
  );
}

export function SocialButtons({ className = '' }: { className?: string }) {
  const { links } = useContent();

  const socials: Social[] = [
    links.github && {
      key: 'github',
      label: 'GitHub',
      href: links.github,
      external: true,
      icon: ICONS.github,
    },
    links.linkedin && {
      key: 'linkedin',
      label: 'LinkedIn',
      href: links.linkedin,
      external: true,
      icon: ICONS.linkedin,
    },
    links.whatsapp && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${links.whatsapp.replace(/\D/g, '')}`,
      external: true,
      icon: ICONS.whatsapp,
    },
    links.email && {
      key: 'email',
      label: 'Email',
      href: `mailto:${links.email}`,
      external: false,
      icon: ICONS.email,
    },
  ].filter(Boolean) as Social[];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {socials.map((s) => (
        <span key={s.key} data-cover="social">
          <Btn social={s} />
        </span>
      ))}
    </div>
  );
}
