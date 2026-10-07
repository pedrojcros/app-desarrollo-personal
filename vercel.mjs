import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function getHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...getHtmlFiles(path));
      continue;
    }
    if (entry.name.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function getScriptHashes(files) {
  const hashes = new Set();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    )) {
      if (/\bsrc\s*=/i.test(match[1]) || !match[2]) {
        continue;
      }
      const digest = createHash('sha256').update(match[2]).digest('base64');
      hashes.add(`'sha256-${digest}'`);
    }
  }
  return [...hashes];
}

function getSupabaseOrigin() {
  const url = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL);
  if (
    url.protocol !== 'https:' ||
    !/^[a-z]{20}\.supabase\.co$/.test(url.hostname)
  ) {
    throw new Error('A hosted Supabase URL is required for deployment');
  }
  return url.origin;
}

const htmlFiles = getHtmlFiles('dist');
const scriptHashes = getScriptHashes(htmlFiles);
const supabaseOrigin = getSupabaseOrigin();
const rewrites = [];
for (const file of htmlFiles) {
  const relativePath = file.slice('dist/'.length);
  if (
    relativePath === 'index.html' ||
    relativePath.includes('(') ||
    relativePath.startsWith('+')
  ) {
    continue;
  }
  const routePath = relativePath.slice(0, -'.html'.length);
  const catchAllPath = routePath.replace(/\[\.\.\.([^\]]+)\]/g, ':$1*');
  const dynamicPath = catchAllPath.replace(/\[([^\]]+)\]/g, ':$1');
  rewrites.push({ source: `/${dynamicPath}`, destination: `/${relativePath}` });
}
// Las rutas que se crean después del export se resuelven al hidratar Expo Router.
rewrites.push({ source: '/:path*', destination: '/index.html' });
// Expo incluye scripts inline; sus hashes evitan autorizar cualquier script inline.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${scriptHashes.join(' ')}`,
  // React Native Web necesita estilos inline para sus componentes.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

// https://docs.expo.dev/guides/publishing-websites/#vercel
// Actions exporta primero para poder calcular los hashes antes de empaquetar.
export const config = {
  framework: null,
  buildCommand: 'test -f dist/index.html',
  installCommand: 'true',
  outputDirectory: 'dist',
  rewrites,
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};
