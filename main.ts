import { cpSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Package existing game files and maker screenshots without launching a browser.
const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || 'out');

function jpegDimensions(bytes, name) {
  const invalid = () => new Error(`${name}: invalid JPEG headers`);
  if (bytes.length < 4 || bytes.readUInt16BE(0) !== 0xffd8 ||
      bytes.readUInt16BE(bytes.length - 2) !== 0xffd9) throw invalid();
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) throw invalid();
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) throw invalid();
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9 || marker === 0x00) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) throw invalid();
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) throw invalid();
    // Start-of-frame markers contain precision, height, width and components.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (length < 8) throw invalid();
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      const components = bytes[offset + 7];
      if (!width || !height || !components || length !== 8 + 3 * components) throw invalid();
      return [width, height];
    }
    offset += length;
  }
  throw invalid();
}

function packageEntry() {
  // Never remove a source directory if an output override overlaps the inputs.
  for (const name of ['game', 'screenshots']) {
    const source = join(root, name);
    if (source === output || source.startsWith(output + '/') || output.startsWith(source + '/')) {
      throw new Error('MAKEFUN_OUTPUT_DIR must not overlap game/ or screenshots/');
    }
  }
  const screenshotDir = join(root, 'screenshots');
  const names = readdirSync(screenshotDir).filter(name => !name.startsWith('.')).sort();
  if (names.length < 3 || names.length > 4) throw new Error('screenshots/ must contain 3 or 4 JPEGs');
  for (const name of names) {
    const path = join(screenshotDir, name);
    if (!/^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/.test(name) || !lstatSync(path).isFile()) {
      throw new Error(`screenshots/${name}: expected a regular file with a valid name`);
    }
    const bytes = readFileSync(path);
    if (bytes.length > 262144) throw new Error(`screenshots/${name}: exceeds 262144 bytes`);
    const [width, height] = jpegDimensions(bytes, `screenshots/${name}`);
    if (Math.max(width, height) > 1280 || Math.min(width, height) < 480) {
      throw new Error(`screenshots/${name}: ${width}x${height} is outside the screenshot limits`);
    }
  }
  mkdirSync(output, { recursive: true });
  for (const name of ['game', 'screenshots']) {
    rmSync(join(output, name), { recursive: true, force: true });
    cpSync(join(root, name), join(output, name), { recursive: true });
  }
  writeFileSync(join(output, 'dossier.json'), buildDossier(output, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }));
  console.log(`Packaged Low Tide Runner: game/, ${names.length} JPEG screenshots, dossier.json`);
}

packageEntry();
