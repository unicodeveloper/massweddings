import dataset from "@/data/weddings.json";
import {
  siteCreator,
  siteDescription,
  siteDescriptionLong,
  siteKeywords,
  siteName,
  siteRepository,
  siteUrl,
} from "@/lib/site";

/**
 * schema.org payload, emitted as one @graph so the three entities can reference
 * each other by id rather than repeating themselves.
 *
 * The Dataset node is the one that earns its keep: this is a compiled,
 * sourced dataset, which makes it eligible for Google Dataset Search — a
 * surface that matters far more for a project like this than a general web
 * result does. The declared variables mirror the layers the map can actually
 * fill states by.
 */
export function StructuredData() {
  const stats = (dataset as { stats?: { editions?: number; statesCovered?: number } }).stats ?? {};
  const builtAt = (dataset as { builtAt?: string }).builtAt;
  const events = (dataset as { events?: { year?: number }[] }).events ?? [];
  const years = events
    .map((event) => event.year)
    .filter((year): year is number => typeof year === "number");
  const temporalCoverage = years.length
    ? `${Math.min(...years)}/${Math.max(...years)}`
    : undefined;

  const graph = [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      inLanguage: "en-NG",
      publisher: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: siteCreator.name,
      url: siteCreator.url,
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: siteName,
      url: siteUrl,
      applicationCategory: "BrowserApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and WebGL",
      description: siteDescription,
      isPartOf: { "@id": `${siteUrl}/#website` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "Dataset",
      "@id": `${siteUrl}/#dataset`,
      name: "Government-sponsored mass weddings in Nigeria",
      description: siteDescriptionLong,
      url: siteUrl,
      license: "https://opensource.org/licenses/ISC",
      isAccessibleForFree: true,
      creator: { "@id": `${siteUrl}/#person` },
      keywords: siteKeywords,
      inLanguage: "en-NG",
      ...(builtAt ? { dateModified: builtAt } : {}),
      ...(temporalCoverage ? { temporalCoverage } : {}),
      spatialCoverage: {
        "@type": "Place",
        name: "Nigeria",
        geo: {
          // Bounding box for Nigeria: south-west corner, then north-east.
          "@type": "GeoShape",
          box: "4.2 2.7 13.9 14.7",
        },
      },
      variableMeasured: [
        "Mass wedding ceremonies held",
        "Couples married",
        "Ceremony sponsor",
        "Multidimensional poverty rate",
        "Median age at first marriage",
        "Household electricity access",
        "Population",
        "FAAC allocation",
      ],
      measurementTechnique:
        "Compiled from Nigerian and international news reporting via structured extraction, deduplicated per state-year, with a source URL retained for every figure",
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${siteUrl}/api/weddings`,
        },
      ],
      isBasedOn: [
        "https://data.humdata.org/dataset/cod-ps-nga",
        "https://data.humdata.org/dataset/nigeria-mpi",
        "https://data.humdata.org/dataset/dhs-subnational-data-for-nigeria",
        "https://www.geoboundaries.org/",
      ],
      codeRepository: siteRepository,
      ...(stats.editions ? { size: `${stats.editions} ceremonies across ${stats.statesCovered} states` } : {}),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is built from local constants and the committed dataset, so
      // there is no untrusted input to escape here.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
