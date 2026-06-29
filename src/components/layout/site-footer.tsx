import { Newsletter } from "@/components/shared/newsletter";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { footerNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-canvas mt-auto">
      <Container className="py-20 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex max-w-sm flex-col gap-6">
            <AppLink
              href="/"
              className="font-display text-3xl leading-none tracking-tight"
            >
              {siteConfig.name}
            </AppLink>
            <p className="text-canvas/65 text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-canvas/45 text-[12px] tracking-[0.18em] uppercase">
                Considered writing, occasionally
              </p>
              <Newsletter tone="dark" />
            </div>
          </div>

          {footerNav.map((group) => (
            <nav key={group.label} className="flex flex-col gap-4">
              <p className="text-canvas/45 text-[12px] tracking-[0.18em] uppercase">
                {group.label}
              </p>
              <ul className="flex flex-col gap-3">
                {group.children?.map((link) => (
                  <li key={`${group.label}-${link.label}`}>
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
            © {year} {siteConfig.legalName}. A garden wellness platform in
            development.
          </p>
          <AppLink
            href={`mailto:${siteConfig.email}`}
            className="hover:text-canvas transition-colors"
          >
            {siteConfig.email}
          </AppLink>
        </Container>
      </div>
    </footer>
  );
}
