import { fromByteArray } from "base64-js";
import { encode } from "jpeg-js";

type CardInput = {
  brand: string;
  place: string;
  tagline: string;
  title: string;
  visitedLabel: string;
};

type Rgb = [number, number, number];

const cardWidth = 1200;
const cardHeight = 630;
const charGap = 1;

const font: Record<string, string[]> = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "'": ["00100", "00100", "00000", "00000", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00000", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"]
};

function ensureJpegBufferShim() {
  const globalScope = globalThis as unknown as {
    Buffer?: { from: (value: ArrayLike<number>) => Uint8Array };
  };

  if (!globalScope.Buffer) {
    globalScope.Buffer = {
      from: (value: ArrayLike<number>) => Uint8Array.from(value)
    };
  }
}

function rgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/œ/gi, "OE")
    .replace(/[^a-zA-Z0-9 ,.'\\/:?-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function fillRect(
  data: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb
) {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(cardWidth, Math.ceil(x + width));
  const endY = Math.min(cardHeight, Math.ceil(y + height));

  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      const index = (py * cardWidth + px) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = 255;
    }
  }
}

function measureChar(char: string, scale: number) {
  if (char === " ") return 4 * scale;
  return (5 + charGap) * scale;
}

function measureText(value: string, scale: number) {
  return [...value].reduce((total, char) => total + measureChar(char, scale), 0);
}

function drawChar(data: Uint8Array, char: string, x: number, y: number, scale: number, color: Rgb) {
  const glyph = font[char] ?? font["?"];
  if (!glyph) return;

  glyph.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === "1") {
        fillRect(data, x + columnIndex * scale, y + rowIndex * scale, scale, scale, color);
      }
    });
  });
}

function fitLine(value: string, scale: number, maxWidth: number) {
  if (measureText(value, scale) <= maxWidth) return value;

  let next = value;
  while (next.length > 1 && measureText(`${next}.`, scale) > maxWidth) {
    next = next.slice(0, -1).trimEnd();
  }
  return `${next}.`;
}

function wrapText(value: string, scale: number, maxWidth: number, maxLines: number) {
  const words = normalizeText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, scale) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    lines[lines.length - 1] = fitLine(lines[lines.length - 1], scale, maxWidth);
  }

  return lines.length > 0 ? lines : [""];
}

function drawText(
  data: Uint8Array,
  value: string,
  x: number,
  y: number,
  options: { color: Rgb; maxLines?: number; maxWidth: number; scale: number }
) {
  const lines = wrapText(value, options.scale, options.maxWidth, options.maxLines ?? 1);
  const lineHeight = 9 * options.scale;

  lines.forEach((line, lineIndex) => {
    let cursorX = x;
    for (const char of line) {
      drawChar(data, char, cursorX, y + lineIndex * lineHeight, options.scale, options.color);
      cursorX += measureChar(char, options.scale);
    }
  });

  return y + lines.length * lineHeight;
}

export function createShareCardJpegBase64(input: CardInput) {
  ensureJpegBufferShim();

  const colors = {
    canvas: rgb("#F7F1E5"),
    copper: rgb("#C85B36"),
    ink: rgb("#263322"),
    line: rgb("#DED3BF"),
    muted: rgb("#766D5A"),
    paper: rgb("#FFFDF8"),
    teal: rgb("#6E8F4A")
  };
  const data = new Uint8Array(cardWidth * cardHeight * 4);

  fillRect(data, 0, 0, cardWidth, cardHeight, colors.canvas);
  fillRect(data, 48, 48, 1104, 534, colors.paper);
  fillRect(data, 48, 48, 1104, 12, colors.teal);
  fillRect(data, 48, 570, 1104, 12, colors.line);

  drawText(data, input.brand, 88, 96, {
    color: colors.teal,
    maxWidth: 300,
    scale: 6
  });
  drawText(data, input.visitedLabel, 710, 100, {
    color: colors.copper,
    maxWidth: 390,
    scale: 3
  });

  const afterTitle = drawText(data, input.title, 88, 198, {
    color: colors.ink,
    maxLines: 2,
    maxWidth: 1024,
    scale: 9
  });

  const placeY = Math.min(afterTitle + 18, 372);
  drawText(data, input.place, 88, placeY, {
    color: colors.muted,
    maxLines: 1,
    maxWidth: 1024,
    scale: 5
  });

  fillRect(data, 88, 452, 1024, 4, colors.line);
  drawText(data, input.tagline, 88, 498, {
    color: colors.ink,
    maxLines: 2,
    maxWidth: 1024,
    scale: 4
  });

  const encoded = encode({ data, width: cardWidth, height: cardHeight }, 92);
  return fromByteArray(encoded.data);
}
