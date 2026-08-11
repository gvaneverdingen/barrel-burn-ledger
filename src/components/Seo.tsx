import { Helmet } from 'react-helmet-async';

export const SITE_NAME = 'ARIGI';
export const DEFAULT_OG_IMAGE = '/og-image.jpg';

export const siteOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : 'https://barrel-burn-ledger.lovable.app';

const absolute = (path?: string | null) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};

interface SeoProps {
  title: string;
  description: string;
  /** Absolute or root-relative canonical path. Defaults to the current pathname. */
  canonical?: string;
  image?: string | null;
  noIndex?: boolean;
  type?: string;
  /** Optional JSON-LD objects rendered as application/ld+json scripts. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const Seo = ({
  title,
  description,
  canonical,
  image,
  noIndex = false,
  type = 'website',
  jsonLd,
}: SeoProps) => {
  const path =
    canonical ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const url = absolute(path)!;
  const ogImage = absolute(image || DEFAULT_OG_IMAGE)!;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;