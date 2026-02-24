import { ImageResponse } from '@vercel/og';
import { colors } from '@/data/config/colors';
import { metadata } from '@/data/config/metadata';
import { readFile } from 'fs/promises';
import sizeOf from 'image-size';
import path from 'path';
import mime from 'mime-types';

const OG_LOGO_FILENAME = 'Logo - White Outline - Drop Shadow - Non Transparent.jpg';

const MAX_LOGO_HEIGHT = 150;
const MAX_LOGO_WIDTH = 350;

const getLogoSize = (dimensions: { width: number; height: number }) => {
  // Calculate image size, with the height being maximum MAX_LOGO_HEIGHT or width being maximum MAX_LOGO_WIDTH
  const imageWidth = dimensions.width;
  const imageHeight = dimensions.height;

  let logoWidth = imageWidth;
  let logoHeight = imageHeight;

  if (imageWidth > MAX_LOGO_WIDTH) {
    logoWidth = MAX_LOGO_WIDTH;
    logoHeight = (imageHeight * MAX_LOGO_WIDTH) / imageWidth;
  }

  if (logoHeight > MAX_LOGO_HEIGHT) {
    logoHeight = MAX_LOGO_HEIGHT;
    logoWidth = (imageWidth * MAX_LOGO_HEIGHT) / imageHeight;
  }

  return {
    logoWidth,
    logoHeight,
  };
};

function renderOgImage(logoImage: string | null, logoWidth: number, logoHeight: number) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        backgroundColor: 'transparent',
      }}
    >
      <svg
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        style={{
          opacity: 1,
          width: '1000px',
          height: '1000px',
          position: 'absolute',
          top: '-500px',
        }}
      >
        <circle
          cx="512"
          cy="512"
          r="512"
          fill="url(#gradient)"
          fillOpacity="0.7"
        />
        <defs>
          <radialGradient
            id="gradient"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(512 512) rotate(90) scale(512)"
          >
            <stop stopColor={colors.primary.light} stopOpacity="0.5" />
            <stop offset="1" stopColor={colors.primary.lighter} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <div
        style={{
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {logoImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoImage}
            alt="Logo"
            style={{
              padding: 20,
              backgroundColor: 'white',
              borderRadius: '100%',
              width: logoWidth,
              height: logoHeight,
            }}
          />
        ) : null}
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'black',
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          {metadata.title}
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 26,
            color: 'black',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {metadata.description}
        </p>
      </div>
    </div>
  );
}

export async function GET() {
  let logoImage: string | null = null;
  let logoWidth = 120;
  let logoHeight = 120;

  try {
    const imagePath = path.join(process.cwd(), 'public', OG_LOGO_FILENAME);
    const file = await readFile(imagePath);
    const mimeType = mime.lookup(imagePath) || 'image/jpeg';
    const dimensions = sizeOf(file) as { width: number; height: number };
    const size = getLogoSize(dimensions);
    logoWidth = size.logoWidth;
    logoHeight = size.logoHeight;
    logoImage = `data:${mimeType};base64,${file.toString('base64')}`;
  } catch (_e) {
    // Logo file missing or unreadable; render OG image without logo
  }

  return new ImageResponse(
    renderOgImage(logoImage, logoWidth, logoHeight),
    {
      width: 1200,
      height: 600,
    },
  );
}
