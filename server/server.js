import path from "path";
import { createServer } from "http";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { ArkRuntimeClient } from "@volcengine/ark-runtime";
import { JsonStore } from "./storage/jsonStore.js";
import { PostgresStore } from "./storage/postgresStore.js";
import { CollabPostgresStore } from "./storage/collabPostgresStore.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const storageMode = (process.env.STORAGE_MODE || "json").toLowerCase();
const doubaoApiKey = process.env.DOUBAO_API_KEY || process.env.ARK_API_KEY || "";
const doubaoModel = process.env.DOUBAO_MODEL || "doubao-seed-1-8-251228";
const jwtSecret = String(process.env.JWT_SECRET || "").trim() || "dev-collab-secret-change-me";
const jwtExpire = process.env.JWT_EXPIRE || "7d";

const arkClient = doubaoApiKey
  ? new ArkRuntimeClient({ apiKey: doubaoApiKey })
  : null;

const store = storageMode === "postgres"
  ? new PostgresStore(process.env.DATABASE_URL)
  : new JsonStore(path.resolve(__dirname, "data", "glyph-records.json"));

const collabStore = storageMode === "postgres"
  ? new CollabPostgresStore(process.env.DATABASE_URL)
  : null;

if (storageMode === "postgres" && !process.env.DATABASE_URL) {
  throw new Error("STORAGE_MODE=postgres 时必须设置 DATABASE_URL");
}

if (storageMode === "postgres" && !String(process.env.JWT_SECRET || "").trim()) {
  console.warn("[WARN] JWT_SECRET 未设置，当前使用开发默认密钥，请尽快在生产环境配置 JWT_SECRET。");
}

await store.init();
if (collabStore) {
  await collabStore.init();
}

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: storageMode, time: new Date().toISOString() });
});

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName || ""
    },
    jwtSecret,
    { expiresIn: jwtExpire }
  );
}

function parseBearerToken(value) {
  const text = String(value || "");
  if (!text.startsWith("Bearer ")) return "";
  return text.slice("Bearer ".length).trim();
}

function requireCollab(req, res, next) {
  if (!collabStore) {
    res.status(501).json({ error: "协作模式仅支持 PostgreSQL 存储，请设置 STORAGE_MODE=postgres" });
    return;
  }
  next();
}

function requireAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "未登录" });
    return;
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: String(payload.sub || ""),
      email: String(payload.email || ""),
      displayName: String(payload.displayName || "")
    };
    if (!req.user.id) {
      res.status(401).json({ error: "登录状态无效" });
      return;
    }
    next();
  } catch (_) {
    res.status(401).json({ error: "登录已过期，请重新登录" });
  }
}

app.post("/api/auth/register", requireCollab, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || "").trim();
    if (!email || !password) {
      res.status(400).json({ error: "email 和 password 不能为空" });
      return;
    }
    const existing = await collabStore.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "该邮箱已注册" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await collabStore.createUser({ email, passwordHash, displayName });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err?.message || "注册失败" });
  }
});

app.post("/api/auth/login", requireCollab, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      res.status(400).json({ error: "email 和 password 不能为空" });
      return;
    }
    const user = await collabStore.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "账号或密码错误" });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) {
      res.status(401).json({ error: "账号或密码错误" });
      return;
    }
    const profile = {
      id: user.id,
      accountNo: Number(user.accountNo || 0),
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt
    };
    const token = signToken(profile);
    res.json({ token, user: profile });
  } catch (err) {
    res.status(400).json({ error: err?.message || "登录失败" });
  }
});

app.get("/api/auth/me", requireCollab, requireAuth, async (req, res) => {
  try {
    const user = await collabStore.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err?.message || "查询失败" });
  }
});

app.patch("/api/auth/profile", requireCollab, requireAuth, async (req, res) => {
  try {
    const displayName = String(req.body?.displayName || "").trim();
    if (!displayName) {
      res.status(400).json({ error: "昵称不能为空" });
      return;
    }
    const user = await collabStore.updateUserDisplayName(req.user.id, displayName);
    if (!user) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err?.message || "更新昵称失败" });
  }
});

app.get("/api/collab/books", requireCollab, requireAuth, async (req, res) => {
  try {
    const books = await collabStore.listBooksForUser(req.user.id);
    res.json({ books });
  } catch (err) {
    res.status(400).json({ error: err?.message || "查询书籍失败" });
  }
});

app.post("/api/collab/books", requireCollab, requireAuth, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim() || "未命名书籍";
    const payload = req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {};
    const book = await collabStore.createBook({ userId: req.user.id, name, payload });
    res.status(201).json({ book });
  } catch (err) {
    res.status(400).json({ error: err?.message || "创建书籍失败" });
  }
});

app.get("/api/collab/books/:id", requireCollab, requireAuth, async (req, res) => {
  try {
    const book = await collabStore.getBookForUser(req.params.id, req.user.id);
    if (!book) {
      res.status(404).json({ error: "书籍不存在或无权限" });
      return;
    }
    res.json({ book });
  } catch (err) {
    res.status(400).json({ error: err?.message || "查询书籍失败" });
  }
});

app.put("/api/collab/books/:id", requireCollab, requireAuth, async (req, res) => {
  try {
    const payload = req.body?.payload;
    const name = req.body?.name;
    const baseVersion = Number(req.body?.baseVersion);
    const book = await collabStore.updateBook({
      bookId: req.params.id,
      userId: req.user.id,
      name,
      payload,
      baseVersion
    });
    res.json({ book });
  } catch (err) {
    const msg = err?.message || "更新书籍失败";
    if (msg.includes("版本冲突")) {
      res.status(409).json({ error: msg });
      return;
    }
    res.status(400).json({ error: msg });
  }
});

app.delete("/api/collab/books/:id", requireCollab, requireAuth, async (req, res) => {
  try {
    const ok = await collabStore.deleteBook({
      bookId: req.params.id,
      actorUserId: req.user.id
    });
    if (!ok) {
      res.status(404).json({ error: "书籍不存在" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err?.message || "删除书籍失败" });
  }
});

app.post("/api/collab/books/:id/share", requireCollab, requireAuth, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const nickname = String(req.body?.nickname || "").trim();
    const accountNo = Number(req.body?.accountNo);
    const role = String(req.body?.role || "viewer").trim().toLowerCase();
    const hasAccountNo = Number.isInteger(accountNo) && accountNo > 0;
    if (!email && !nickname && !hasAccountNo) {
      res.status(400).json({ error: "email、nickname 或 accountNo 不能为空" });
      return;
    }
    const result = hasAccountNo
      ? await collabStore.shareBookByAccountNo({
        bookId: req.params.id,
        actorUserId: req.user.id,
        targetAccountNo: accountNo,
        role
      })
      : nickname
        ? await collabStore.shareBookByNickname({
        bookId: req.params.id,
        actorUserId: req.user.id,
        targetNickname: nickname,
        role
      })
        : await collabStore.shareBook({
          bookId: req.params.id,
          actorUserId: req.user.id,
          targetEmail: email,
          role
        });
    res.json({ shared: result });
  } catch (err) {
    res.status(400).json({ error: err?.message || "共享失败" });
  }
});

app.get("/api/collab/books/:id/members", requireCollab, requireAuth, async (req, res) => {
  try {
    const result = await collabStore.listBookMembers({
      bookId: req.params.id,
      userId: req.user.id
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err?.message || "查询成员失败" });
  }
});

app.patch("/api/collab/books/:id/members/:userId", requireCollab, requireAuth, async (req, res) => {
  try {
    const role = String(req.body?.role || "").trim().toLowerCase();
    const result = await collabStore.updateBookMemberRole({
      bookId: req.params.id,
      actorUserId: req.user.id,
      targetUserId: req.params.userId,
      role
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err?.message || "更新成员角色失败" });
  }
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
    const xmlHintLinesRaw = Array.isArray(req.body?.xmlHintLines) ? req.body.xmlHintLines : [];
    const xmlHintRules = String(req.body?.xmlHintRules || "").trim().slice(0, 12000);
    const categories = categoriesRaw
      .map((item) => ({
        name: String(item?.name || "").trim(),
        path: String(item?.path || "").trim()
      }))
      .filter((item) => item.name);
    const xmlHintLines = xmlHintLinesRaw
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .slice(0, 12);

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
      "4) 无法识别时返回 detections 空数组。",
      "5) 同一标签的框严禁重合（同一 tagName 的任意两框交叠面积必须为 0）；不同标签允许重合。"
    ];

    if (xmlHintLines.length > 0) {
      promptLines.push(
        "以下是用户投喂的 XML 标签示例（代表其标注习惯），请优先按这些路径和标签名称做判断：",
        ...xmlHintLines,
        "若示例与图片冲突，以图片实际内容为准，但标签命名尽量贴合示例。"
      );
    }

    if (xmlHintRules) {
      promptLines.push(
        "以下是用户上传文档中的勾画规则，请记住并严格执行：",
        xmlHintRules,
        "请持续遵守这些规则，尤其要保证同一标签的框不重合。"
      );
    }

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

    const overlapArea = (a, b) => {
      const left = Math.max(a.x, b.x);
      const top = Math.max(a.y, b.y);
      const right = Math.min(a.x + a.w, b.x + b.w);
      const bottom = Math.min(a.y + a.h, b.y + b.h);
      const w = Math.max(0, right - left);
      const h = Math.max(0, bottom - top);
      return w * h;
    };

    const nonOverlapDetections = [];
    detections
      .slice()
      .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
      .forEach((item) => {
        const itemTag = String(item.tagName || "").toLowerCase();
        const hasOverlap = nonOverlapDetections.some((picked) => {
          const pickedTag = String(picked.tagName || "").toLowerCase();
          if (pickedTag !== itemTag) return false;
          return overlapArea(picked, item) > 0.000001;
        });
        if (!hasOverlap) {
          nonOverlapDetections.push(item);
        }
      });

    if (hasSent && hasSnt && nonOverlapDetections.length > 1) {
      const sentLike = new Set(["sent", "snt"]);
      const sentenceDetections = nonOverlapDetections.filter((d) => sentLike.has(String(d.tagName || "").toLowerCase()));
      if (sentenceDetections.length === nonOverlapDetections.length) {
        const sorted = [...nonOverlapDetections].sort((a, b) => {
          if (Math.abs(a.y - b.y) > 0.02) return a.y - b.y;
          return a.x - b.x;
        });
        sorted.forEach((d, i) => {
          d.tagName = i % 2 === 0 ? "sent" : "snt";
        });
      }
    }

    res.json({ detections: nonOverlapDetections });
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

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });
const wsRooms = new Map();

function addToRoom(bookId, ws) {
  if (!wsRooms.has(bookId)) wsRooms.set(bookId, new Set());
  wsRooms.get(bookId).add(ws);
}

function removeFromRooms(ws) {
  wsRooms.forEach((members, bookId) => {
    members.delete(ws);
    if (members.size === 0) wsRooms.delete(bookId);
  });
}

function wsSend(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastBook(bookId, payload, exceptWs = null) {
  const members = wsRooms.get(bookId);
  if (!members) return;
  members.forEach((client) => {
    if (exceptWs && client === exceptWs) return;
    wsSend(client, payload);
  });
}

function verifyTokenFromReq(req) {
  const reqUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const tokenFromQuery = String(reqUrl.searchParams.get("token") || "").trim();
  const token = tokenFromQuery || parseBearerToken(req.headers.authorization);
  if (!token) throw new Error("missing-token");
  const payload = jwt.verify(token, jwtSecret);
  return {
    id: String(payload.sub || ""),
    email: String(payload.email || ""),
    displayName: String(payload.displayName || "")
  };
}

function compactUserForPresence(user) {
  return {
    userId: String(user?.id || ""),
    email: String(user?.email || ""),
    displayName: String(user?.displayName || "")
  };
}

function getRoomPresenceSnapshot(bookId) {
  const members = wsRooms.get(bookId);
  if (!members || members.size === 0) return [];
  const seen = new Set();
  const users = [];
  members.forEach((client) => {
    const id = String(client?.user?.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);
    users.push(compactUserForPresence(client.user));
  });
  return users;
}

function normalizePresenceCoord(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return clamp01(n);
}

function normalizeActionText(action) {
  return String(action || "").trim().slice(0, 120);
}

wss.on("connection", (ws, req, user) => {
  ws.user = user;
  ws.currentBookId = "";

  ws.on("message", async (raw) => {
    try {
      if (!collabStore) {
        wsSend(ws, { type: "error", message: "协作模式未启用" });
        return;
      }
      const message = JSON.parse(String(raw || "{}"));
      const type = String(message?.type || "").trim();
      if (type === "subscribe") {
        const bookId = String(message?.bookId || "").trim();
        if (!bookId) {
          wsSend(ws, { type: "error", message: "bookId 不能为空" });
          return;
        }
        const canAccess = await collabStore.canAccessBook(bookId, ws.user.id);
        if (!canAccess) {
          wsSend(ws, { type: "error", message: "无权限订阅该书籍" });
          return;
        }

        const prevBookId = String(ws.currentBookId || "").trim();
        if (prevBookId && prevBookId !== bookId) {
          const prevMembers = wsRooms.get(prevBookId);
          if (prevMembers) {
            prevMembers.delete(ws);
            if (prevMembers.size === 0) wsRooms.delete(prevBookId);
          }
          broadcastBook(prevBookId, {
            type: "presence_leave",
            bookId: prevBookId,
            user: compactUserForPresence(ws.user),
            ts: Date.now()
          }, ws);
        }

        addToRoom(bookId, ws);
        ws.currentBookId = bookId;
        const book = await collabStore.getBookForUser(bookId, ws.user.id);
        wsSend(ws, { type: "subscribed", bookId, book });
        wsSend(ws, {
          type: "presence_snapshot",
          bookId,
          users: getRoomPresenceSnapshot(bookId),
          ts: Date.now()
        });
        broadcastBook(bookId, {
          type: "presence_join",
          bookId,
          user: compactUserForPresence(ws.user),
          ts: Date.now()
        }, ws);
        return;
      }

      if (type === "update_book") {
        const bookId = String(message?.bookId || "").trim();
        if (!bookId) {
          wsSend(ws, { type: "error", message: "bookId 不能为空" });
          return;
        }
        const updated = await collabStore.updateBook({
          bookId,
          userId: ws.user.id,
          name: message?.name,
          payload: message?.payload && typeof message.payload === "object" ? message.payload : {},
          baseVersion: Number(message?.baseVersion)
        });
        const event = { type: "book_updated", bookId, book: updated };
        wsSend(ws, event);
        broadcastBook(bookId, event, ws);
        return;
      }

      if (type === "presence_cursor") {
        const bookId = String(message?.bookId || "").trim();
        const imageId = String(message?.imageId || "").trim();
        const x = normalizePresenceCoord(message?.x);
        const y = normalizePresenceCoord(message?.y);
        if (!bookId || x == null || y == null) {
          return;
        }
        if (String(ws.currentBookId || "") !== bookId) {
          return;
        }
        const canAccess = await collabStore.canAccessBook(bookId, ws.user.id);
        if (!canAccess) return;
        broadcastBook(bookId, {
          type: "presence_cursor",
          bookId,
          imageId,
          x,
          y,
          user: compactUserForPresence(ws.user),
          ts: Date.now()
        }, ws);
        return;
      }

      if (type === "presence_action") {
        const bookId = String(message?.bookId || "").trim();
        const imageId = String(message?.imageId || "").trim();
        const action = normalizeActionText(message?.action);
        if (!bookId || !action) {
          return;
        }
        if (String(ws.currentBookId || "") !== bookId) {
          return;
        }
        const canAccess = await collabStore.canAccessBook(bookId, ws.user.id);
        if (!canAccess) return;
        broadcastBook(bookId, {
          type: "presence_action",
          bookId,
          imageId,
          action,
          user: compactUserForPresence(ws.user),
          ts: Date.now()
        }, ws);
        return;
      }

      wsSend(ws, { type: "error", message: `未知消息类型: ${type || "(empty)"}` });
    } catch (err) {
      wsSend(ws, { type: "error", message: err?.message || "消息处理失败" });
    }
  });

  ws.on("close", () => {
    const bookId = String(ws.currentBookId || "").trim();
    if (bookId) {
      broadcastBook(bookId, {
        type: "presence_leave",
        bookId,
        user: compactUserForPresence(ws.user),
        ts: Date.now()
      }, ws);
    }
    removeFromRooms(ws);
  });
});

httpServer.on("upgrade", (req, socket, head) => {
  try {
    if (!collabStore) {
      socket.destroy();
      return;
    }
    const reqUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    if (reqUrl.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    const user = verifyTokenFromReq(req);
    if (!user.id) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, user);
    });
  } catch (_) {
    socket.destroy();
  }
});

httpServer.listen(port, () => {
  console.log(`glyph api running at http://localhost:${port}`);
  console.log(`storage mode: ${storageMode}`);
  if (collabStore) {
    console.log(`collab websocket: ws://localhost:${port}/ws?token=...`);
  }
});
