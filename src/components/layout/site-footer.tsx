import {
  Newsletter,
  type NewsletterSubscribeResult,
} from "@/components/shared/newsletter";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { footerNav, siteConfig } from "@/config/site";
import type {
  SanityNavigation,
  SanitySiteSettings,
} from "@/types/sanity-content";

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

/**
 * Content comes from the Sanity `navigation`/`siteSettings` singletons,
 * falling back to the static config when empty or unreachable.
 */
export function SiteFooter({
  nav,
  settings,
  onNewsletterSubscribe,
}: {
  nav?: SanityNavigation | null;
  settings?: SanitySiteSettings | null;
  onNewsletterSubscribe: (email: string) => Promise<NewsletterSubscribeResult>;
}) {
  const year = new Date().getFullYear();
  const siteName = settings?.siteName ?? siteConfig.name;
  const legalName = settings?.legalName ?? siteConfig.legalName;
  const description = settings?.description ?? siteConfig.description;
  const email = settings?.email ?? siteConfig.email;

  const columns: FooterColumn[] = nav?.footerColumns?.length
    ? nav.footerColumns.map((col) => ({ title: col.title, links: col.links }))
    : footerNav.map((group) => ({
        title: group.label,
        links: group.children ?? [],
      }));

  return (
    <footer className="bg-basalt-deep text-canvas mt-auto">
      <Container className="py-20 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="flex max-w-sm flex-col gap-6">
            <AppLink
              href="/"
              className="text-brass font-display text-2xl leading-none font-medium tracking-[0.34em] uppercase"
            >
              {siteName}
            </AppLink>
            <p className="text-canvas/65 text-sm leading-relaxed">
              {description}
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-canvas/45 text-[12px] tracking-[0.18em] uppercase">
                Considered writing, occasionally
              </p>
              <Newsletter tone="dark" onSubscribe={onNewsletterSubscribe} />
            </div>
          </div>

          {columns.map((group) => (
            <nav key={group.title} className="flex flex-col gap-4">
              <p className="text-canvas/45 text-[12px] tracking-[0.18em] uppercase">
                {group.title}
              </p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <AppLink
                      href={link.href}
                      className="text-canvas/75 hover:text-canvas text-sm transition-colors"
                    >
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      <div className="border-canvas/12 border-t">
        <Container className="text-canvas/50 flex flex-col items-start justify-between gap-3 py-6 text-[13px] sm:flex-row sm:items-center">
          <p>
            © {year} {legalName}. Premium home improvement, curated.
          </p>
          <AppLink
            href={`mailto:${email}`}
            className="hover:text-canvas transition-colors"
          >
            {email}
          </AppLink>
        </Container>
      </div>
    </footer>
  );
}
