export function getImageCandidates(value) {
  if (!value) return [];
  const cleanValue = extractUrl(value);

  if (!cleanValue || getUnsupportedImageReason(cleanValue)) {
    return [];
  }

  const driveMatch = cleanValue.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (driveMatch?.[1]) return googleDriveCandidates(driveMatch[1]);

  const openDriveMatch = cleanValue.match(/drive\.google\.com\/open\?id=([^&#]+)/);
  if (openDriveMatch?.[1]) return googleDriveCandidates(openDriveMatch[1]);

  const idParamMatch = cleanValue.match(/[?&]id=([^&#]+)/);
  if (cleanValue.includes('drive.google.com') && idParamMatch?.[1]) {
    return googleDriveCandidates(idParamMatch[1]);
  }

  return [cleanValue];
}

export function extractUrl(value) {
  const trimmed = String(value || '').trim();
  const markdownMatch = trimmed.match(/\((https?:\/\/[^)]+)\)/);
  if (markdownMatch?.[1]) return markdownMatch[1];

  const plainMatch = trimmed.match(/https?:\/\/\S+/);
  return plainMatch?.[0]?.replace(/[)\]]$/, '') || trimmed;
}

export function getUnsupportedImageReason(value) {
  if (!value) return '';
  const cleanValue = extractUrl(value);
  const isInstagramPage = /instagram\.com\/(p|reel|stories|[^/?#]+)\/?/i.test(cleanValue)
    && !isLikelyImageCdnUrl(cleanValue)
    && !isDirectImageUrl(cleanValue);

  if (isInstagramPage) return 'Use a URL direta da imagem do Instagram, não o link do post.';

  const isFacebookPage = /facebook\.com\/|fb\.watch\//i.test(cleanValue)
    && !isLikelyImageCdnUrl(cleanValue)
    && !isDirectImageUrl(cleanValue);

  if (isFacebookPage) return 'Use a URL direta da imagem do Facebook, não o link da publicação.';

  return '';
}

function googleDriveCandidates(id) {
  return [
    `https://lh3.googleusercontent.com/d/${id}=w1600`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1600`,
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ];
}

function isDirectImageUrl(value) {
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(value);
}

function isLikelyImageCdnUrl(value) {
  return [
    'images.unsplash.com',
    'plus.unsplash.com',
    'cdn.pixabay.com',
    'images.pexels.com',
    'res.cloudinary.com',
    'supabase.co/storage/v1/object/public',
    'scontent.',
    'fbcdn.net',
    'cdninstagram.com',
  ].some((hostPart) => value.includes(hostPart));
}
