import path from "path";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { ArkRuntimeClient } from "@volcengine/ark-runtime";
import { JsonStore } from "./storage/jsonStore.js";
import { PostgresStore } from "./storage/postgresStore.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const storageMode = (process.env.STORAGE_MODE || "json").toLowerCase();
const doubaoApiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY || "";
const doubaoModel = process.env.DOUBAO_MODEL || "doubao-seed-1-8-251228";

const arkClient = doubaoApiKey
  ? new ArkRuntimeClient({ apiKey: doubaoApiKey })
  : null;

const store = storageMode === "postgres"
  ? new PostgresStore(process.env.DATABASE_URL)
  : new JsonStore(path.resolve(__dirname, "data", "glyph-records.json"));

if (storageMode === "postgres" && !process.env.DATABASE_URL) {
  throw new Error("STORAGE_MODE=postgres 时必须设置 DATABASE_URL");
}

await store.init();

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: storageMode, time: new Date().toISOString() });
});

app.get("/api/glyphs", async (_req, res) => {
  try {
    const records = await store.list();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message || "查询失败" });
  }
});

app.post("/api/glyphs", async (req, res) => {
  try {
    const record = await store.create(req.body || {});
    res.status(201).json({ record });
  } catch (err) {
    res.status(400).json({ error: err.message || "创建失败" });
  }
});

app.delete("/api/glyphs/:id", async (req, res) => {
  try {
    const ok = await store.remove(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "记录不存在" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message || "删除失败" });
  }
});

app.post("/api/glyphs/import", async (req, res) => {
  try {
    const count = await store.replaceAll(req.body?.records || []);
    res.json({ ok: true, count });
  } catch (err) {
    res.status(400).json({ error: err.message || "导入失败" });
  }
});

app.post("/api/glyphs/suggest", async (req, res) => {
  try {
    const imageDataUrl = String(req.body?.imageDataUrl || "");
    if (!imageDataUrl) {
      res.status(400).send("缺少 imageDataUrl");
      return;
    }

    const records = await store.list();
    const sameImageHit = records.find((r) => r.imageDataUrl && r.imageDataUrl === imageDataUrl) || null;
    if (sameImageHit) {
      res.json({
        suggestion: {
          exists: true,
          existsReason: "same-image",
          existingRecordId: sameImageHit.id || "",
          glyphChar: sameImageHit.charGlyph || "",
          codepoint: sameImageHit.codepoint,
          ids: sameImageHit.ids || "",
          confidence: 0.99
        }
      });
      return;
    }

    if (!arkClient) {
      res.status(501).send("未配置 DOUBAO_API_KEY，暂无法调用 AI 识别。可先手动填写 unicode 和 IDS。");
      return;
    }

    const prompt = [
      "你是古籍异体字识别助手。",
      "请根据给定单字截图，返回一个严格 JSON，不要输出任何额外文本。",
      "JSON 字段：glyphChar, codepoint, ids, exists, confidence。",
      "要求：",
      "1) codepoint 用 U+XXXX 格式；若无法判断则空字符串。",
      "2) ids 给出 IDS 表达式；无法判断则空字符串。",
      "3) exists 表示该字是否已经在已有记录中出现（若无法判断给 false）。",
      "4) confidence 为 0 到 1 的小数。",
      "5) 不要编造。"
    ].join("\n");

    const response = await arkClient.createResponses({
      model: doubaoModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl }
          ]
        }
      ]
    });

    const raw = extractResponseText(response) || "{}";
    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch (_) {
      const fallback = String(raw).match(/\{[\s\S]*\}/);
      parsed = fallback ? JSON.parse(fallback[0]) : {};
    }

    const suggestion = {
      exists: Boolean(parsed?.exists),
      glyphChar: String(parsed?.glyphChar || "").trim(),
      codepoint: String(parsed?.codepoint || "").trim().toUpperCase(),
      ids: String(parsed?.ids || "").trim(),
      confidence: Number.isFinite(Number(parsed?.confidence)) ? Number(parsed.confidence) : 0
    };

    const byCodepoint = suggestion.codepoint
      ? records.find((r) => String(r.codepoint || "").toUpperCase() === suggestion.codepoint)
      : null;
    if (byCodepoint) {
      suggestion.exists = true;
      suggestion.existsReason = "same-codepoint";
      suggestion.existingRecordId = byCodepoint.id || "";
      suggestion.codepoint = byCodepoint.codepoint || suggestion.codepoint;
      suggestion.ids = byCodepoint.ids || suggestion.ids || "";
      suggestion.glyphChar = byCodepoint.charGlyph || suggestion.glyphChar || "";
    }

    res.json({ suggestion });
  } catch (err) {
    const modelTip = `当前模型配置: ${doubaoModel}`;
    const detail = [
      err?.message || "识别失败",
      err?.code ? `code=${err.code}` : "",
      err?.requestId ? `requestId=${err.requestId}` : "",
      modelTip
    ].filter(Boolean).join(" | ");
    res.status(400).send(detail);
  }
});

app.post("/api/transcription/suggest", async (req, res) => {
  try {
    const imageDataUrl = String(req.body?.imageDataUrl || "");
    if (!imageDataUrl) {
      res.status(400).send("缺少 imageDataUrl");
      return;
    }

    if (!arkClient) {
      res.status(501).send("未配置 DOUBAO_API_KEY，暂无法调用 AI 识别。请手动填写简体转写。");
      return;
    }

    const prompt = [
      "你是古籍文字识别助手。",
      "请识别图片中的文字，并输出标准简体中文。",
      "只返回严格 JSON，不要输出任何额外文本。",
      "JSON 字段：transcription, confidence。",
      "要求：",
      "1) transcription 仅保留识别结果，不要解释。",
      "2) confidence 为 0 到 1 的小数。",
      "3) 无法识别时 transcription 置空字符串。"
    ].join("\\n");

    const response = await arkClient.createResponses({
      model: doubaoModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl }
          ]
        }
      ]
    });

    const raw = extractResponseText(response) || "{}";
    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch (_) {
      const fallback = String(raw).match(/\{[\s\S]*\}/);
      parsed = fallback ? JSON.parse(fallback[0]) : {};
    }

    const suggestion = {
      transcription: String(parsed?.transcription || "").trim(),
      confidence: Number.isFinite(Number(parsed?.confidence)) ? Number(parsed.confidence) : 0
    };

    res.json({ suggestion });
  } catch (err) {
    const modelTip = `当前模型配置: ${doubaoModel}`;
    const detail = [
      err?.message || "识别失败",
      err?.code ? `code=${err.code}` : "",
      err?.requestId ? `requestId=${err.requestId}` : "",
      modelTip
    ].filter(Boolean).join(" | ");
    res.status(400).send(detail);
  }
});

app.post("/api/attrs/meaning", async (req, res) => {
  try {
    const attrName = String(req.body?.attrName || "").trim();
    const attrValue = String(req.body?.attrValue || "").trim();
    const tagPath = String(req.body?.tagPath || "").trim();
    const transcription = String(req.body?.transcription || "").trim();

    if (!attrName) {
      res.status(400).send("缺少 attrName");
      return;
    }
    if (!attrValue && !transcription) {
      res.status(400).send("缺少可用于释义的内容");
      return;
    }
    if (!arkClient) {
      res.status(501).send("未配置 DOUBAO_API_KEY，暂无法调用 AI 释义。请手动填写释义。");
      return;
    }

    const prompt = [
      "你是古籍标注释义助手。",
      "请根据给定字段生成简短、准确的中文释义。",
      "只返回严格 JSON，不要输出任何额外文本。",
      "JSON 字段：meaning, confidence。",
      "要求：",
      "1) meaning 用现代中文解释该字段含义，尽量 8 到 40 字；",
      "2) 若信息不足，基于字段名给出通用释义；",
      "3) confidence 为 0 到 1 的小数。",
      `标签路径: ${tagPath || "(空)"}`,
      `属性名: ${attrName}`,
      `属性值: ${attrValue || "(空)"}`,
      `简体文本: ${transcription || "(空)"}`
    ].join("\n");

    const response = await arkClient.createResponses({
      model: doubaoModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt }
          ]
        }
      ]
    });

    const raw = extractResponseText(response) || "{}";
    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch (_) {
      const fallback = String(raw).match(/\{[\s\S]*\}/);
      parsed = fallback ? JSON.parse(fallback[0]) : {};
    }

    const suggestion = {
      meaning: String(parsed?.meaning || "").trim(),
      confidence: Number.isFinite(Number(parsed?.confidence)) ? Number(parsed.confidence) : 0
    };

    res.json({ suggestion });
  } catch (err) {
    const modelTip = `当前模型配置: ${doubaoModel}`;
    const detail = [
      err?.message || "释义失败",
      err?.code ? `code=${err.code}` : "",
      err?.requestId ? `requestId=${err.requestId}` : "",
      modelTip
    ].filter(Boolean).join(" | ");
    res.status(400).send(detail);
  }
});

app.post("/api/layout/suggest", async (req, res) => {
  try {
    const imageDataUrl = String(req.body?.imageDataUrl || "");
    const categoriesRaw = Array.isArray(req.body?.categories) ? req.body.categories : [];
    const categories = categoriesRaw
      .map((item) => ({
        name: String(item?.name || "").trim(),
        path: String(item?.path || "").trim()
      }))
      .filter((item) => item.name);

    if (!imageDataUrl) {
      res.status(400).send("缺少 imageDataUrl");
      return;
    }
    if (categories.length === 0) {
      res.status(400).send("缺少 categories");
      return;
    }
    if (!arkClient) {
      res.status(501).send("未配置 DOUBAO_API_KEY，暂无法调用自动画框识别。");
      return;
    }

    const categoryText = categories
      .map((item, idx) => `${idx + 1}. ${item.name}${item.path ? ` (${item.path})` : ""}`)
      .join("\\n");

      const hasSent = categories.some((item) => item.name.toLowerCase() === "sent");
      const hasSnt = categories.some((item) => item.name.toLowerCase() === "snt");
      const sentenceMode = hasSent || hasSnt;

    const promptLines = [
      "你是古籍版面结构识别助手。",
      "请识别图片中的语义区域，并只使用给定标签分类。",
      "只返回严格 JSON，不要输出任何额外文本。",
      "可用标签如下：",
      categoryText,
      "JSON 格式：",
      "{\"detections\":[{\"tagName\":\"标签名\",\"x\":0.1,\"y\":0.1,\"w\":0.3,\"h\":0.2,\"confidence\":0.8}]}",
      "要求：",
      "1) tagName 必须是上面可用标签之一；",
      "2) x,y,w,h 为 0~1 的归一化坐标；",
      "3) 只返回明显区域，不要输出太碎的小块；",
      "4) 无法识别时返回 detections 空数组。"
    ];

    if (sentenceMode) {
      promptLines.push(
        "5) 若标签包含 sent 或 snt，请启用自动句读：按句子切分，一句一个框，不能跨句；",
        "6) 句子边界参考。！？；及明显停顿；",
        "7) 若同时有 sent 与 snt：按阅读顺序交替标注（第一句 sent，第二句 snt，第三句 sent...）。"
      );
    }

    const promptText = promptLines.join("\\n");

    const response = await arkClient.createResponses({
      model: doubaoModel,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText },
            { type: "input_image", image_url: imageDataUrl }
          ]
        }
      ]
    });

    const raw = extractResponseText(response) || "{}";
    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch (_) {
      const fallback = String(raw).match(/\{[\s\S]*\}/);
      parsed = fallback ? JSON.parse(fallback[0]) : {};
    }

    const allowedNames = new Set(categories.map((item) => item.name.toLowerCase()));
    const detections = (Array.isArray(parsed?.detections) ? parsed.detections : [])
      .map((item) => ({
        tagName: String(item?.tagName || "").trim(),
        x: Number(item?.x),
        y: Number(item?.y),
        w: Number(item?.w),
        h: Number(item?.h),
        confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : 0
      }))
      .filter((item) => item.tagName && allowedNames.has(item.tagName.toLowerCase()))
      .map((item) => ({
        ...item,
        x: clamp01(item.x),
        y: clamp01(item.y),
        w: clamp01(item.w),
        h: clamp01(item.h)
      }))
      .filter((item) => item.w >= 0.003 && item.h >= 0.003 && item.x + item.w <= 1 && item.y + item.h <= 1)
      .slice(0, 100);

    if (hasSent && hasSnt && detections.length > 1) {
      const sentLike = new Set(["sent", "snt"]);
      const sentenceDetections = detections.filter((d) => sentLike.has(String(d.tagName || "").toLowerCase()));
      if (sentenceDetections.length === detections.length) {
        const sorted = [...detections].sort((a, b) => {
          if (Math.abs(a.y - b.y) > 0.02) return a.y - b.y;
          return a.x - b.x;
        });
        sorted.forEach((d, i) => {
          d.tagName = i % 2 === 0 ? "sent" : "snt";
        });
      }
    }

    res.json({ detections });
  } catch (err) {
    const modelTip = `当前模型配置: ${doubaoModel}`;
    const detail = [
      err?.message || "自动画框识别失败",
      err?.code ? `code=${err.code}` : "",
      err?.requestId ? `requestId=${err.requestId}` : "",
      modelTip
    ].filter(Boolean).join(" | ");
    res.status(400).send(detail);
  }
});

app.use(express.static(workspaceRoot));
app.get("/", (_req, res) => {
  res.sendFile(path.resolve(workspaceRoot, "index.html"));
});

function extractResponseText(response) {
  if (!response || !Array.isArray(response.output)) {
    return "";
  }
  const parts = [];
  for (const item of response.output) {
    if (!item || !Array.isArray(item.content)) {
      continue;
    }
    for (const content of item.content) {
      if (!content || typeof content.text !== "string") {
        continue;
      }
      parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

app.listen(port, () => {
  console.log(`glyph api running at http://localhost:${port}`);
  console.log(`storage mode: ${storageMode}`);
});
