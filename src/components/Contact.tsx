import { Section } from './Section';
import { Reveal } from './Reveal';
import { useContent } from '../lib/contentStore';
import { useFocusRef } from '../lib/useFocusBlur';
import { navigate } from '../lib/router';

type Link = { label: string; href: string; hint: string; external: boolean };

export function ContactSection() {
  const { links, profile, sectionCopy } = useContent();

  // Empty entries in the content store simply don't render.
  const items: Link[] = [
    links.email && {
      label: 'Email',
      href: `mailto:${links.email}`,
      hint: links.email,
      external: false,
    },
    links.emailAlt && {
      label: 'Email (alt)',
      href: `mailto:${links.emailAlt}`,
      hint: links.emailAlt,
      external: false,
    },
    links.whatsapp && {
      label: 'WhatsApp',
      href: `https://wa.me/${links.whatsapp.replace(/\D/g, '')}`,
      hint: links.phone || links.whatsapp,
      external: true,
    },
    links.linkedin && {
      label: 'LinkedIn',
      href: links.linkedin,
      hint: 'Professional profile',
      external: true,
    },
    links.github && { label: 'GitHub', href: links.github, hint: 'Code & projects', external: true },
    links.behance && {
      label: 'Design',
      href: links.behance,
      hint: 'Graphic design work',
      external: true,
    },
  ].filter(Boolean) as Link[];

  return (
    <Section
      id="contact"
      index={7}
      eyebrow="Contact"
      title={sectionCopy.contact.title}
      lede={sectionCopy.contact.lede || profile.seeking}
      accent="ds"
      ghost="CONTACT"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <Reveal key={item.label} weight="chip" delay={i * 0.06}>
            <ContactLink item={item} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <button
          type="button"
          onClick={() => navigate('cv')}
          className="glass-strong mt-6 flex w-full items-center justify-between rounded-xl p-5 text-left transition hover:bg-ash-800/70"
        >
          <span>
            <span className="block font-display text-base font-semibold text-ash-50">
              Full CV
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-ash-400">
              Education, projects, skills — printable to PDF
            </span>
          </span>
          <span className="text-ds" aria-hidden>
            →
          </span>
        </button>
      </Reveal>

      <Reveal delay={0.25}>
        <div className="mt-14 hairline" />
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-ash-500">
            © {new Date().getFullYear()} {profile.name} · {profile.location}
          </p>
          <p className="font-mono text-[11px] text-ash-600">
            Built with React Three Fiber, GSAP &amp; Lenis
          </p>
        </footer>
      </Reveal>
    </Section>
  );
}

function ContactLink({ item }: { item: Link }) {
  const ref = useFocusRef<HTMLAnchorElement>();

  return (
    <a
      ref={ref}
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noreferrer noopener' : undefined}
      className="focus-glass group flex items-center justify-between rounded-xl p-5 transition-colors hover:border-ds/30"
    >
      <span>
        <span className="block font-display text-base font-semibold text-ash-50">{item.label}</span>
        <span className="mt-0.5 block break-all font-mono text-[11px] text-ash-400">
          {item.hint}
        </span>
      </span>
      <span
        className="ml-3 shrink-0 text-ash-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ds"
        aria-hidden
      >
        →
      </span>
    </a>
  );
}
