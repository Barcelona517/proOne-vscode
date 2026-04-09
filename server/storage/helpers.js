export const PUA_START = 0xe000;
export const PUA_END = 0xf8ff;

export function normalizeCodepoint(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return "";
  const hex = raw.startsWith("U+") ? raw.slice(2) : raw;
  if (!/^[0-9A-F]{4,6}$/.test(hex)) {
    throw new Error("编码格式错误，应为 U+XXXX 到 U+XXXXXX");
  }
  return `U+${hex}`;
}

export function cpToInt(cp) {
  return parseInt(cp.replace("U+", ""), 16);
}

export function intToCp(value) {
  return `U+${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function isPuaCodepoint(cp) {
  const value = cpToInt(cp);
  return value >= PUA_START && value <= PUA_END;
}

export function inferOfficialFromChar(charGlyph) {
  const text = String(charGlyph || "").trim();
  if (!text) return "";
  const chars = [...text];
  if (chars.length !== 1) return "";
  const cp = chars[0].codePointAt(0);
  if (!cp) return "";
  const cpText = `U+${cp.toString(16).toUpperCase()}`;
  if (isPuaCodepoint(cpText)) return "";
  return cpText;
}

export function allocatePuaFromSet(usedCodepoints) {
  for (let value = PUA_START; value <= PUA_END; value += 1) {
    const cp = intToCp(value);
    if (!usedCodepoints.has(cp)) return cp;
  }
  throw new Error("PUA 编码池已满，无法继续分配");
}

export function buildRecordPayload(input, usedCodepoints) {
  const charGlyph = String(input.charGlyph || "").trim();
  const ids = String(input.ids || "").trim();
  const note = String(input.note || "").trim();
  const imageDataUrl = String(input.imageDataUrl || "");

  const manual = normalizeCodepoint(input.manualCodepoint || "");
  const official = inferOfficialFromChar(charGlyph);

  let codepoint = "";
  let codepointType = "";

  if (manual) {
    codepoint = manual;
    codepointType = isPuaCodepoint(codepoint) ? "pua" : "unicode-official";
  } else if (official) {
    codepoint = official;
    codepointType = "unicode-official";
  } else {
    codepoint = allocatePuaFromSet(usedCodepoints);
    codepointType = "pua";
  }

  if (usedCodepoints.has(codepoint)) {
    throw new Error(`编码已存在：${codepoint}`);
  }

  return {
    id: `glyph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    charGlyph,
    codepoint,
    codepointType,
    ids,
    note,
    imageDataUrl,
    createdAt: new Date().toISOString()
  };
}
