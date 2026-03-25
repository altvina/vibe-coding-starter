/**
 * Main logo asset paths (files in public/).
 * Use these three variants where appropriate:
 * - svg: Transparent, scalable – header, footer, in-app.
 * - png: Transparent – fallback where SVG isn’t suitable.
 * - jpg: Non-transparent – OG/social cards, solid backgrounds.
 *
 * Favicon: generated from public/static/favicons/2759DDB3-C476-465E-AD84-D2C0BB46A917_1_105_c.jpeg
 * via `npm run favicons` (light + dark variants). See scripts/generateFavicons.mjs.
 */
const siteLogos = {
  /** Primary transparent brand mark */
  svg: '/Logo - White Outline - Drop Shadow - Transparent.svg',
  png: '/Logo - White Outline - Drop Shadow - Transparent.png',
  jpg: '/Logo - White Outline - Drop Shadow - Non Transparent.jpg',
};

module.exports = { siteLogos };
