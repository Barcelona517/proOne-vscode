const STORAGE_KEY = "guji_editor_v4";
const BOOKS_INDEX_KEY = `${STORAGE_KEY}_books_index`;
const BOOK_DATA_KEY_PREFIX = `${STORAGE_KEY}_book_`;
const DB_NAME = `${STORAGE_KEY}_db`;
const DB_VERSION = 1;
const DB_STORE_BOOKS_META = "books_meta";
const DB_STORE_BOOKS_DATA = "books_data";
const DB_STORE_KV = "kv";
const STORAGE_MIGRATED_FLAG = `${STORAGE_KEY}_migrated_to_idb_v1`;
const LAST_OPENED_BOOK_KEY = `${STORAGE_KEY}_last_opened_book_id`;
const LAST_VIEW_KEY = `${STORAGE_KEY}_last_view`;
const AUTH_TOKEN_KEY = `${STORAGE_KEY}_auth_token`;
const GLYPH_PUA_START = 0xE000;
const GLYPH_PUA_END = 0xF8FF;
const APP_HOST = window.location.hostname || "127.0.0.1";
const IS_LOCAL_HOST = /^(localhost|127\.0\.0\.1)$/i.test(APP_HOST);
const API_PROTOCOL = (window.location.protocol === "file:" || IS_LOCAL_HOST) ? "http:" : window.location.protocol;
const WS_PROTOCOL = API_PROTOCOL === "https:" ? "wss" : "ws";
const API_BASE = `${API_PROTOCOL}//${APP_HOST}:3000`;

let currentBookId = null;
let booksIndexCache = [];
let saveStateQueue = Promise.resolve();
let saveStateDebounceTimer = null;
let saveStateDebounceForce = false;
const SAVE_STATE_DEBOUNCE_MS = 1200;
const lastSavedPayloadKeyByBook = new Map();
let dbPromise = null;
const collabState = {
  token: String(localStorage.getItem(AUTH_TOKEN_KEY) || "").trim(),
  user: null,
  ws: null,
  wsConnected: false,
  wsReconnectTimer: null,
  wsReconnectAttempts: 0,
  wsManualClose: false,
  currentBookVersion: 0,
  pendingWsSave: null,
  presenceUsers: {},
  remotePeers: {},
  cursorSendAt: 0,
  lastCursor: { imageId: "", x: -1, y: -1 }
};

const seedImages = [
  { path: "古籍示例/顶格/试验样例-00000002-00008.jpg", category: "顶格", element: "text", kind: "文字" },
  { path: "古籍示例/顶格/simple_08.jpg", category: "顶格", element: "text", kind: "文字" },
  { path: "古籍示例/不规则/试验样例-00000002-00010.jpg", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/试验样例-00000002-00009.jpg", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/试验样例-00000002-00007.jpg", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/试验样例-00000002-00006.jpg", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/3 (8).png", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/3 (14).png", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/3 (1).png", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/不规则/3 (1).jpg", category: "不规则", element: "div", kind: "混合" },
  { path: "古籍示例/封面/1 (4).png", category: "封面", element: "page", kind: "图片" },
  { path: "古籍示例/封面/1 (3).png", category: "封面", element: "page", kind: "图片" },
  { path: "古籍示例/封面/1 (2).png", category: "封面", element: "page", kind: "图片" },
  { path: "古籍示例/封面/1 (1).png", category: "封面", element: "page", kind: "图片" },
  { path: "古籍示例/横排/simple_02.jpg", category: "横排", element: "text", kind: "文字" },
  { path: "古籍示例/图片/2 (4).png", category: "图片", element: "page", kind: "图片" },
  { path: "古籍示例/图片/2 (2).png", category: "图片", element: "page", kind: "图片" },
  { path: "古籍示例/图片/simple_05.jpg", category: "图片", element: "page", kind: "图片" },
  { path: "古籍示例/表格/试验样例-00000001-00003.jpg", category: "表格", element: "div", kind: "混合" },
  { path: "古籍示例/标准样式/试验样例-00000002-00005.jpg", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/simple_03.jpg", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/simple_01.jpg", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (9).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (7).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (6).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (5).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (4).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (3).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (13).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (12).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (11).png", category: "标准样式", element: "text", kind: "文字" },
  { path: "古籍示例/标准样式/3 (10).png", category: "标准样式", element: "text", kind: "文字" }
];

const templateDefaults = [
  { id: "t_article", name: "article", parentId: null, attrs: ["id"] },
  { id: "t_head", name: "head", parentId: "t_article", attrs: ["id"] },
  { id: "t_content", name: "content", parentId: "t_article", attrs: ["id"] },
  { id: "t_view", name: "view", parentId: "t_article", attrs: ["id"] },
  { id: "t_title", name: "title", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_subtitle", name: "subtitle", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_authors", name: "authors", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_book", name: "book", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_date", name: "date", parentId: "t_head", attrs: ["id", "value"] },
  { id: "t_text", name: "text", parentId: "t_content", attrs: ["id", "column", "direction"] },
  { id: "t_page", name: "page", parentId: "t_content", attrs: ["id", "src", "name", "position"] },
  { id: "t_div", name: "div", parentId: "t_content", attrs: ["id", "column", "direction"] },
  { id: "t_sources", name: "sources", parentId: "t_view", attrs: ["id", "name"] }
];

const state = {
  images: [],
  templateTags: [],
  selectedImageId: null,
  selectedAnnoId: null,
  selectedTemplateTagId: null,
  selectedTagFilterName: "",
  drawingActive: false,
  glyphCreateActive: false,
  draftRect: null,
  pendingDrafts: [],
  activeDraftTagId: null,
  activeMainPanel: "edit",
  activeRightPanel: "object",
  glyphDraft: null,
  glyphRegistry: [],
  aiLayoutHints: { examples: [], activeFileNames: [], cachedPromptLines: [], updatedAt: "" },
  propInputs: {},
  objectStyleInputs: {},
  draggingThumbId: null,
  batchDeleteImageIds: [],
  renamingImage: false,
  reviewData: {
    submissions: [],
    editorBases: {},
    activeVersionId: ""
  },
  versionPreview: {
    active: false,
    versionId: "",
    versionNo: 0,
    showDiffOnly: true,
    diffByImage: {},
    targetByImage: {},
    baseByImage: {}
  },
  collabPanel: {
    openBookId: "",
    loading: false,
    bookRole: "viewer",
    members: []
  }
};

const el = {
  libraryShell: document.getElementById("libraryShell"),
  booksList: document.getElementById("booksList"),
  newBookBtn: document.getElementById("newBookBtn"),
  libraryImportInput: document.getElementById("libraryImportInput"),
  backToLibraryBtn: document.getElementById("backToLibraryBtn"),
  submitOrReviewBtn: document.getElementById("submitOrReviewBtn"),
  versionHistoryBtn: document.getElementById("versionHistoryBtn"),
  authUserLabel: document.getElementById("authUserLabel"),
  authOpenBtn: document.getElementById("authOpenBtn"),
  authRenameBtn: document.getElementById("authRenameBtn"),
  authLogoutBtn: document.getElementById("authLogoutBtn"),
  shareBookBtn: document.getElementById("shareBookBtn"),
  authModal: document.getElementById("authModal"),
  authEmailInput: document.getElementById("authEmailInput"),
  authPasswordInput: document.getElementById("authPasswordInput"),
  authDisplayNameInput: document.getElementById("authDisplayNameInput"),
  authLoginSubmitBtn: document.getElementById("authLoginSubmitBtn"),
  authRegisterSubmitBtn: document.getElementById("authRegisterSubmitBtn"),
  authCancelBtn: document.getElementById("authCancelBtn"),
  collabMembersModal: document.getElementById("collabMembersModal"),
  collabMembersTitle: document.getElementById("collabMembersTitle"),
  collabMembersHint: document.getElementById("collabMembersHint"),
  collabRoleOwnerList: document.getElementById("collabRoleOwnerList"),
  collabRoleEditorList: document.getElementById("collabRoleEditorList"),
  collabRoleViewerList: document.getElementById("collabRoleViewerList"),
  collabAddOwnerBtn: document.getElementById("collabAddOwnerBtn"),
  collabAddEditorBtn: document.getElementById("collabAddEditorBtn"),
  collabAddViewerBtn: document.getElementById("collabAddViewerBtn"),
  collabMembersCloseBtn: document.getElementById("collabMembersCloseBtn"),
  thumbList: document.getElementById("thumbList"),
  mainImage: document.getElementById("mainImage"),
  drawLayer: document.getElementById("drawLayer"),
  presenceLayer: document.getElementById("presenceLayer"),
  viewerTitle: document.getElementById("viewerTitle"),
  viewerTitleInput: document.getElementById("viewerTitleInput"),
  collabLiveHint: document.getElementById("collabLiveHint"),
  versionPreviewBar: document.getElementById("versionPreviewBar"),
  versionPreviewTitle: document.getElementById("versionPreviewTitle"),
  versionPreviewToggleBtn: document.getElementById("versionPreviewToggleBtn"),
  versionPreviewExitBtn: document.getElementById("versionPreviewExitBtn"),
  renameImageBtn: document.getElementById("renameImageBtn"),
  mainPanelBtnEdit: document.getElementById("mainPanelBtnEdit"),
  mainPanelBtnGlyph: document.getElementById("mainPanelBtnGlyph"),
  sectionEditWorkspace: document.getElementById("sectionEditWorkspace"),
  sectionGlyphWorkspace: document.getElementById("sectionGlyphWorkspace"),
  panelBtnObject: document.getElementById("panelBtnObject"),
  panelBtnDraw: document.getElementById("panelBtnDraw"),
  panelBtnTags: document.getElementById("panelBtnTags"),
  panelSwitcher: document.getElementById("panelSwitcher"),
  sectionProps: document.getElementById("sectionProps"),
  sectionDraw: document.getElementById("sectionDraw"),
  sectionTags: document.getElementById("sectionTags"),
  currentTargetHint: document.getElementById("currentTargetHint"),
  propsEditor: document.getElementById("propsEditor"),
  propNoteRow: document.getElementById("propNoteRow"),
  propNote: document.getElementById("propNote"),
  propMeaningRow: document.getElementById("propMeaningRow"),
  propMeaning: document.getElementById("propMeaning"),
  unicodeAllocArea: document.getElementById("unicodeAllocArea"),
  propCodepoint: document.getElementById("propCodepoint"),
  unicodeHint: document.getElementById("unicodeHint"),
  propMeaningAutoTranslateBtn: document.getElementById("propMeaningAutoTranslateBtn"),
  saveCurrentPropsBtn: document.getElementById("saveCurrentPropsBtn"),
  editModeArea: document.getElementById("editModeArea"),
  drawState: document.getElementById("drawState"),
  startDrawBtn: document.getElementById("startDrawBtn"),
  clearDraftBtn: document.getElementById("clearDraftBtn"),
  glyphCharInput: document.getElementById("glyphCharInput"),
  glyphManualCodepointInput: document.getElementById("glyphManualCodepointInput"),
  glyphIdsInput: document.getElementById("glyphIdsInput"),
  glyphIdsPatternSelect: document.getElementById("glyphIdsPatternSelect"),
  glyphIdsPatternApplyBtn: document.getElementById("glyphIdsPatternApplyBtn"),
  glyphNoteInput: document.getElementById("glyphNoteInput"),
  glyphAutoSuggestBtn: document.getElementById("glyphAutoSuggestBtn"),
  glyphStartCreateBtn: document.getElementById("glyphStartCreateBtn"),
  glyphRuleBtn: document.getElementById("glyphRuleBtn"),
  glyphReselectBtn: document.getElementById("glyphReselectBtn"),
  glyphAssignSaveBtn: document.getElementById("glyphAssignSaveBtn"),
  glyphCreateHint: document.getElementById("glyphCreateHint"),
  glyphCapturedPreview: document.getElementById("glyphCapturedPreview"),
  glyphRecentList: document.getElementById("glyphRecentList"),
  annoShapeSelect: document.getElementById("annoShapeSelect"),
  annoColor: document.getElementById("annoColor"),
  annoColorPreview: document.getElementById("annoColorPreview"),
  annoColorHint: document.getElementById("annoColorHint"),
  tagPickerTree: document.getElementById("tagPickerTree"),
  selectedTagInfo: document.getElementById("selectedTagInfo"),
  draftTagName: document.getElementById("draftTagName"),
  draftTagParent: document.getElementById("draftTagParent"),
  draftTagAttrs: document.getElementById("draftTagAttrs"),
  addDraftTagToTemplate: document.getElementById("addDraftTagToTemplate"),
  createDraftTagBtn: document.getElementById("createDraftTagBtn"),
  autoDrawByAiBtn: document.getElementById("autoDrawByAiBtn"),
  feedXmlHintsBtn: document.getElementById("feedXmlHintsBtn"),
  feedXmlHintsInput: document.getElementById("feedXmlHintsInput"),
  feedXmlHintsInfo: document.getElementById("feedXmlHintsInfo"),
  xmlHintsModal: document.getElementById("xmlHintsModal"),
  xmlHintsList: document.getElementById("xmlHintsList"),
  xmlHintsCloseBtn: document.getElementById("xmlHintsCloseBtn"),
  xmlHintsAddBtn: document.getElementById("xmlHintsAddBtn"),
  versionModal: document.getElementById("versionModal"),
  versionList: document.getElementById("versionList"),
  versionModalCloseBtn: document.getElementById("versionModalCloseBtn"),
  imageEditModal: document.getElementById("imageEditModal"),
  imageEditNameInput: document.getElementById("imageEditNameInput"),
  imageEditNameSaveBtn: document.getElementById("imageEditNameSaveBtn"),
  imageEditIdInput: document.getElementById("imageEditIdInput"),
  imageEditIdSaveBtn: document.getElementById("imageEditIdSaveBtn"),
  imageEditModalCloseBtn: document.getElementById("imageEditModalCloseBtn"),
  annoTranscriptionRow: document.getElementById("annoTranscriptionRow"),
  annoTranscription: document.getElementById("annoTranscription"),
  annoMeaningRow: document.getElementById("annoMeaningRow"),
  annoMeaning: document.getElementById("annoMeaning"),
  annoAutoSuggestBtn: document.getElementById("annoAutoSuggestBtn"),
  saveAnnoBtn: document.getElementById("saveAnnoBtn"),
  imageTagTree: document.getElementById("imageTagTree"),
  templateTreeArea: document.getElementById("templateTreeArea"),
  templateTagTree: document.getElementById("templateTagTree"),
  templateTagSelect: document.getElementById("templateTagSelect"),
  tagMoveUpBtn: document.getElementById("tagMoveUpBtn"),
  tagMoveDownBtn: document.getElementById("tagMoveDownBtn"),
  deleteTagBtn: document.getElementById("deleteTagBtn"),
  newAttrForTemplateTag: document.getElementById("newAttrForTemplateTag"),
  addAttrBtn: document.getElementById("addAttrBtn"),
  templateAttrSelect: document.getElementById("templateAttrSelect"),
  deleteAttrBtn: document.getElementById("deleteAttrBtn"),
  deleteSelectedImagesBtn: document.getElementById("deleteSelectedImagesBtn"),
  exportXmlBtn: document.getElementById("exportXmlBtn"),
  exportFormatModal: document.getElementById("exportFormatModal"),
  exportAsXmlBtn: document.getElementById("exportAsXmlBtn"),
  exportAsCsvBtn: document.getElementById("exportAsCsvBtn"),
  cancelExportFormatBtn: document.getElementById("cancelExportFormatBtn"),
  uploadInput: document.getElementById("uploadInput"),
  uploadBtn: document.getElementById("uploadBtn")
};

function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function encodePath(path) { return path.split("/").map((part) => encodeURIComponent(part)).join("/"); }
function fileToDisplayName(path) { return path.split("/").pop() || path; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function isCollabMode() {
  return true;
}

function setCollabToken(token) {
  collabState.token = String(token || "").trim();
  if (collabState.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, collabState.token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (collabState.token) {
    headers.Authorization = `Bearer ${collabState.token}`;
  }
  return headers;
}

async function collabFetch(path, options = {}) {
  const method = options.method || "GET";
  const headers = getAuthHeaders(options.headers || {});
  const init = { ...options, method, headers };
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const raw = await res.text();
    let msg = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object" && parsed.error) {
        msg = parsed.error;
      }
    } catch (_) {
      // keep raw text
    }
    if (res.status === 401) {
      setCollabToken("");
      collabState.user = null;
      closeCollabSocket();
      updateAuthUi();
      showAuthModal();
    }
    throw new Error(msg || `请求失败: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function roleLabel(role) {
  const normalized = String(role || "viewer").toLowerCase();
  if (normalized === "owner") return "管理者";
  if (normalized === "editor") return "可编辑者";
  return "仅读";
}

function getBookMetaById(bookId) {
  if (!bookId) return null;
  return loadBooksIndex().find((item) => item.id === bookId) || null;
}

function getCurrentBookRole() {
  return String(getBookMetaById(currentBookId)?.role || "viewer").toLowerCase();
}

function canEditCurrentBook() {
  if (state.versionPreview.active) return false;
  const role = getCurrentBookRole();
  return role === "owner" || role === "editor";
}

function canManageMembers(role) {
  return String(role || "viewer").toLowerCase() === "owner";
}

function canInviteMembers(role) {
  const normalized = String(role || "viewer").toLowerCase();
  return normalized === "owner" || normalized === "editor";
}

function ensureCanEdit(actionName = "执行编辑操作") {
  if (canEditCurrentBook()) return true;
  alert(`你当前是仅读角色，不能${actionName}`);
  return false;
}

function peerDisplayName(user) {
  if (!user) return "协作用户";
  return user.displayName || user.email || "协作用户";
}

function colorForUserId(userId) {
  const input = String(userId || "");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 74% 46%)`;
}

function resetPresenceState() {
  collabState.presenceUsers = {};
  collabState.remotePeers = {};
  collabState.cursorSendAt = 0;
  collabState.lastCursor = { imageId: "", x: -1, y: -1 };
  renderPresenceLayer();
  renderLivePresenceHint();
}

function renderLivePresenceHint() {
  if (!el.collabLiveHint) return;
  const mine = collabState.user?.id ? 1 : 0;
  const others = Object.keys(collabState.presenceUsers || {}).length;
  const total = mine + others;
  el.collabLiveHint.textContent = `协作在线：${total} 人`;
}

function renderPresenceLayer() {
  if (!el.presenceLayer) return;
  el.presenceLayer.innerHTML = "";
  const currentImageId = selectedImage()?.id || "";
  Object.values(collabState.remotePeers || {}).forEach((peer) => {
    if (!peer || !peer.imageId || peer.imageId !== currentImageId) return;
    if (!Number.isFinite(peer.x) || !Number.isFinite(peer.y)) return;
    const wrapper = document.createElement("div");
    wrapper.className = "remote-cursor";
    wrapper.style.left = `${clamp01(peer.x) * 100}%`;
    wrapper.style.top = `${clamp01(peer.y) * 100}%`;

    const color = colorForUserId(peer.userId);
    const dot = document.createElement("div");
    dot.className = "remote-cursor-dot";
    dot.style.background = color;

    const label = document.createElement("div");
    label.className = "remote-cursor-label";
    label.style.background = color;
    label.textContent = peerDisplayName(peer);

    wrapper.appendChild(dot);
    wrapper.appendChild(label);
    el.presenceLayer.appendChild(wrapper);
  });
}

function updatePresenceUser(user) {
  const userId = String(user?.userId || "");
  if (!userId || userId === String(collabState.user?.id || "")) return;
  collabState.presenceUsers[userId] = {
    userId,
    displayName: String(user?.displayName || ""),
    email: String(user?.email || "")
  };
  renderLivePresenceHint();
}

function removePresenceUser(userId) {
  const id = String(userId || "");
  if (!id) return;
  delete collabState.presenceUsers[id];
  delete collabState.remotePeers[id];
  renderLivePresenceHint();
  renderPresenceLayer();
}

function sendPresenceCursor(x, y) {
  if (!collabState.wsConnected || !currentBookId || !collabState.ws || collabState.ws.readyState !== WebSocket.OPEN) return;
  const imageId = selectedImage()?.id || "";
  if (!imageId) return;
  const now = Date.now();
  if (now - collabState.cursorSendAt < 50) return;
  const lx = Number(collabState.lastCursor.x);
  const ly = Number(collabState.lastCursor.y);
  const movedEnough = Math.abs(lx - x) > 0.0025 || Math.abs(ly - y) > 0.0025 || collabState.lastCursor.imageId !== imageId;
  if (!movedEnough) return;
  collabState.cursorSendAt = now;
  collabState.lastCursor = { imageId, x, y };
  collabState.ws.send(JSON.stringify({
    type: "presence_cursor",
    bookId: currentBookId,
    imageId,
    x: clamp01(x),
    y: clamp01(y)
  }));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasFullVersionSnapshot(version) {
  return !!(version?.snapshot && typeof version.snapshot === "object" && Array.isArray(version.snapshot.images));
}

function clonePayloadForVersionSnapshot(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const safeTemplateTags = Array.isArray(source.templateTags) && source.templateTags.length > 0
    ? deepClone(source.templateTags)
    : deepClone(templateDefaults.map((tag, idx) => ({ ...tag, order: idx + 1 })));
  return {
    images: Array.isArray(source.images) ? deepClone(source.images) : [],
    templateTags: safeTemplateTags,
    selectedImageId: source.selectedImageId || null,
    selectedTemplateTagId: source.selectedTemplateTagId || templateDefaults[0]?.id || null,
    activeMainPanel: source.activeMainPanel || "edit",
    activeRightPanel: source.activeRightPanel || "object",
    glyphRegistry: Array.isArray(source.glyphRegistry) ? deepClone(source.glyphRegistry) : [],
    aiLayoutHints: normalizeAiLayoutHints(source.aiLayoutHints || {}),
    reviewData: { submissions: [], editorBases: {}, lastApprovedSnapshot: [], activeVersionId: "" }
  };
}

function applyTargetSnapshotOnPayload(payload, targetSnapshot) {
  const next = clonePayloadForVersionSnapshot(payload);
  const targetById = snapshotMap(targetSnapshot);
  if (targetById.size === 0) return next;

  next.images = (Array.isArray(next.images) ? next.images : []).map((img) => {
    const id = String(img?.id || "");
    const target = targetById.get(id);
    if (!target) return img;
    return {
      ...img,
      name: String(target?.name || img?.name || ""),
      annotations: deepClone(Array.isArray(target?.annotations) ? target.annotations : [])
    };
  });

  if (!next.selectedImageId || !next.images.some((img) => img.id === next.selectedImageId)) {
    next.selectedImageId = next.images[0]?.id || null;
  }
  return next;
}

function countLegacySubmissionsWithoutFullSnapshot(submissions) {
  const list = Array.isArray(submissions) ? submissions : [];
  return list.filter((item) => !hasFullVersionSnapshot(item) && Array.isArray(item?.targetSnapshot) && item.targetSnapshot.length > 0).length;
}

function normalizeReviewData(data, options = {}) {
  const base = data && typeof data === "object" ? data : {};
  const seedPayload = options.seedPayload && typeof options.seedPayload === "object"
    ? clonePayloadForVersionSnapshot(options.seedPayload)
    : null;
  const submissions = Array.isArray(base.submissions) ? base.submissions.map((item, idx) => ({
    id: String(item?.id || uid("review_ver")),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    submitter: {
      userId: String(item?.submitter?.userId || ""),
      displayName: String(item?.submitter?.displayName || ""),
      email: String(item?.submitter?.email || ""),
      accountNo: Number(item?.submitter?.accountNo || 0)
    },
    versionNo: Number(item?.versionNo || idx + 1),
    parentVersionId: String(item?.parentVersionId || ""),
    diffCount: Number(item?.diffCount || 0),
    snapshot: item?.snapshot && typeof item.snapshot === "object" ? item.snapshot : null,
    status: String(item?.status || "pending"),
    savedPageIds: Array.isArray(item?.savedPageIds) ? item.savedPageIds.map((x) => String(x || "")).filter(Boolean) : [],
    reviewedAt: item?.reviewedAt ? String(item.reviewedAt) : "",
    baseSnapshot: Array.isArray(item?.baseSnapshot) ? item.baseSnapshot : [],
    targetSnapshot: Array.isArray(item?.targetSnapshot) ? item.targetSnapshot : []
  })) : [];

  submissions.forEach((item, idx) => {
    if (!item.parentVersionId && idx > 0) item.parentVersionId = submissions[idx - 1].id;
    if (!Number.isFinite(item.versionNo) || item.versionNo <= 0) item.versionNo = idx + 1;
  });

  // Auto-migrate legacy entries (targetSnapshot only) to full snapshots.
  const byId = new Map(submissions.map((item) => [item.id, item]));
  let latestFullSnapshot = null;
  submissions.forEach((item) => {
    if (hasFullVersionSnapshot(item)) {
      latestFullSnapshot = clonePayloadForVersionSnapshot(item.snapshot);
      return;
    }
    if (!Array.isArray(item.targetSnapshot) || item.targetSnapshot.length === 0) return;
    const parent = item.parentVersionId ? byId.get(String(item.parentVersionId || "")) : null;
    const parentSnapshot = hasFullVersionSnapshot(parent) ? parent.snapshot : null;
    const basePayload = parentSnapshot || latestFullSnapshot || seedPayload;
    if (!basePayload) return;
    item.snapshot = applyTargetSnapshotOnPayload(basePayload, item.targetSnapshot);
    latestFullSnapshot = clonePayloadForVersionSnapshot(item.snapshot);
  });

  // Backfill legacy records where diffCount was not stored.
  submissions.forEach((item) => {
    const prev = item.parentVersionId ? byId.get(String(item.parentVersionId || "")) : null;
    const targetSnapshot = snapshotFromVersionRecord(item);
    const baseSnapshot = prev ? snapshotFromVersionRecord(prev) : [];
    const computed = Object.keys(buildReviewDiffByImage(baseSnapshot, targetSnapshot, [])).length;
    if ((!Number.isFinite(item.diffCount) || item.diffCount <= 0) && computed > 0) {
      item.diffCount = computed;
    }
    if (!Number.isFinite(item.diffCount) || item.diffCount < 0) {
      item.diffCount = 0;
    }
  });

  const editorBases = base.editorBases && typeof base.editorBases === "object" ? base.editorBases : {};
  const lastApprovedSnapshot = Array.isArray(base.lastApprovedSnapshot) ? base.lastApprovedSnapshot : [];
  const activeVersionId = String(base.activeVersionId || submissions[submissions.length - 1]?.id || "");
  return { submissions, editorBases, lastApprovedSnapshot, activeVersionId };
}

function captureReviewSnapshot(images = state.images) {
  return (Array.isArray(images) ? images : []).map((img) => ({
    id: img.id,
    name: img.name || "",
    annotations: deepClone(Array.isArray(img.annotations) ? img.annotations : [])
  }));
}

function snapshotMap(snapshot) {
  const map = new Map();
  (Array.isArray(snapshot) ? snapshot : []).forEach((item) => {
    map.set(String(item?.id || ""), item || {});
  });
  return map;
}

function buildReviewDiffByImage(baseSnapshot, targetSnapshot, savedPageIds = []) {
  const baseMap = snapshotMap(baseSnapshot);
  const targetMap = snapshotMap(targetSnapshot);
  const saved = new Set((savedPageIds || []).map((x) => String(x || "")));
  const imageIds = new Set([...baseMap.keys(), ...targetMap.keys()]);
  const diffByImage = {};

  imageIds.forEach((imageId) => {
    if (!imageId || saved.has(imageId)) return;
    const base = baseMap.get(imageId) || { annotations: [] };
    const target = targetMap.get(imageId) || { annotations: [] };
    const baseAnnos = Array.isArray(base.annotations) ? base.annotations : [];
    const targetAnnos = Array.isArray(target.annotations) ? target.annotations : [];

    const baseById = new Map(baseAnnos.map((anno) => [String(anno?.id || uid("b")), anno]));
    const targetById = new Map(targetAnnos.map((anno) => [String(anno?.id || uid("t")), anno]));
    const annoIds = new Set([...baseById.keys(), ...targetById.keys()]);
    const added = [];
    const removed = [];

    annoIds.forEach((annoId) => {
      const oldAnno = baseById.get(annoId);
      const newAnno = targetById.get(annoId);
      if (!oldAnno && newAnno) {
        added.push(newAnno);
        return;
      }
      if (oldAnno && !newAnno) {
        removed.push(oldAnno);
        return;
      }
      if (oldAnno && newAnno) {
        const oldKey = JSON.stringify(oldAnno);
        const newKey = JSON.stringify(newAnno);
        if (oldKey !== newKey) {
          removed.push(oldAnno);
          added.push(newAnno);
        }
      }
    });

    if (added.length > 0 || removed.length > 0) {
      diffByImage[imageId] = {
        added,
        removed,
        baseImage: base,
        targetImage: target
      };
    }
  });

  return diffByImage;
}

function getEditorBaselineSnapshot(userId, currentSnapshot) {
  const uidText = String(userId || "");
  if (!uidText) return deepClone(Array.isArray(currentSnapshot) ? currentSnapshot : []);

  const existing = state.reviewData.editorBases?.[uidText];
  if (Array.isArray(existing) && existing.length > 0) {
    return deepClone(existing);
  }

  const approved = state.reviewData.lastApprovedSnapshot;
  const base = Array.isArray(approved) && approved.length > 0
    ? deepClone(approved)
    : deepClone(Array.isArray(currentSnapshot) ? currentSnapshot : []);
  state.reviewData.editorBases[uidText] = deepClone(base);
  return base;
}

function hasUnsubmittedEditorChanges() {
  const role = getCurrentBookRole();
  if (!(role === "editor" || role === "owner")) return false;
  if (!currentBookId) return false;
  const userId = String(collabState.user?.id || "");
  if (!userId) return false;
  const currentSnapshot = captureReviewSnapshot(state.images);
  const baseSnapshot = getEditorBaselineSnapshot(userId, currentSnapshot);
  const diff = buildReviewDiffByImage(baseSnapshot, currentSnapshot, []);
  return Object.keys(diff).length > 0;
}

function submitCurrentChangesForReview() {
  const role = getCurrentBookRole();
  if (!(role === "editor" || role === "owner")) {
    alert("仅管理者或编辑者可提交改动");
    return;
  }
  const userId = String(collabState.user?.id || "");
  if (!userId) {
    alert("请先登录协作账号");
    return;
  }
  const currentSnapshot = captureReviewSnapshot(state.images);
  const baseSnapshot = getEditorBaselineSnapshot(userId, currentSnapshot);

  const diffByImage = buildReviewDiffByImage(baseSnapshot, currentSnapshot, []);
  if (Object.keys(diffByImage).length === 0) {
    alert("当前没有可提交的改动");
    return;
  }

  const maxVersionNo = state.reviewData.submissions.reduce((max, item) => {
    const no = Number(item?.versionNo || 0);
    return no > max ? no : max;
  }, 0);

  const version = {
    id: uid("version"),
    versionNo: maxVersionNo + 1,
    parentVersionId: String(state.reviewData.activeVersionId || ""),
    createdAt: new Date().toISOString(),
    submitter: {
      userId,
      displayName: String(collabState.user?.displayName || ""),
      email: String(collabState.user?.email || ""),
      accountNo: Number(collabState.user?.accountNo || 0)
    },
    diffCount: Object.keys(diffByImage).length,
    snapshot: deepClone(collectCurrentBookData())
  };

  state.reviewData.submissions.push(version);
  state.reviewData.activeVersionId = version.id;
  state.reviewData.editorBases[userId] = deepClone(currentSnapshot);
  state.reviewData.lastApprovedSnapshot = deepClone(currentSnapshot);
  saveState({ wait: true, force: true });
  alert("已提交一版到版本记录");
  renderAll();
}

function snapshotByImage(snapshot) {
  const byImage = {};
  (Array.isArray(snapshot) ? snapshot : []).forEach((item) => {
    const key = String(item?.id || "");
    if (!key) return;
    byImage[key] = {
      id: key,
      name: String(item?.name || ""),
      annotations: Array.isArray(item?.annotations) ? deepClone(item.annotations) : []
    };
  });
  return byImage;
}

function snapshotFromVersionRecord(version) {
  if (!version || typeof version !== "object") return [];
  if (version.snapshot && typeof version.snapshot === "object" && Array.isArray(version.snapshot.images)) {
    return captureReviewSnapshot(version.snapshot.images);
  }
  if (Array.isArray(version.targetSnapshot)) {
    return deepClone(version.targetSnapshot);
  }
  return [];
}

function findSeedPayloadFromHistory(submissions = []) {
  const list = Array.isArray(submissions) ? submissions : [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const v = list[i];
    if (v?.snapshot && typeof v.snapshot === "object" && Array.isArray(v.snapshot.images) && v.snapshot.images.length > 0) {
      return deepClone(v.snapshot);
    }
  }
  return null;
}

function buildRestorePayloadFromVersion(version, submissions = []) {
  if (version?.snapshot && typeof version.snapshot === "object" && Array.isArray(version.snapshot.images)) {
    return { payload: deepClone(version.snapshot), missingImageIds: [] };
  }

  // Legacy versions may only have annotation snapshots (without image src/meta).
  // Patch annotations onto current payload to avoid losing image files after restore.
  const currentPayload = deepClone(collectCurrentBookData());
  const currentImages = Array.isArray(currentPayload.images) ? currentPayload.images : [];
  const fallback = currentImages.length > 0
    ? currentPayload
    : (findSeedPayloadFromHistory(submissions) || currentPayload);
  const targetSnapshot = snapshotFromVersionRecord(version);
  const targetById = snapshotMap(targetSnapshot);
  if (targetById.size === 0) {
    return { payload: fallback, missingImageIds: [] };
  }

  const matchedIds = new Set();
  const nextImages = (Array.isArray(fallback.images) ? fallback.images : []).map((img) => {
    const id = String(img?.id || "");
    const snap = targetById.get(id);
    if (!snap) return img;
    matchedIds.add(id);
    return {
      ...img,
      name: String(snap?.name || img?.name || ""),
      annotations: deepClone(Array.isArray(snap?.annotations) ? snap.annotations : [])
    };
  });

  const missingImageIds = [];
  targetById.forEach((_snap, id) => {
    if (!matchedIds.has(String(id || ""))) {
      missingImageIds.push(String(id || ""));
    }
  });

  fallback.images = nextImages;
  if (!fallback.selectedImageId || !nextImages.some((img) => img.id === fallback.selectedImageId)) {
    fallback.selectedImageId = nextImages[0]?.id || null;
  }
  return { payload: fallback, missingImageIds };
}

function resolveVersionDiffCount(version, byId = null) {
  const saved = Number(version?.diffCount || 0);
  if (saved > 0) return saved;

  const hasLegacyPair = Array.isArray(version?.baseSnapshot) || Array.isArray(version?.targetSnapshot);
  let baseSnapshot = [];
  let targetSnapshot = [];

  if (hasLegacyPair) {
    baseSnapshot = Array.isArray(version?.baseSnapshot) ? deepClone(version.baseSnapshot) : [];
    targetSnapshot = Array.isArray(version?.targetSnapshot) ? deepClone(version.targetSnapshot) : [];
  } else {
    targetSnapshot = snapshotFromVersionRecord(version);
    const previous = byId && version?.parentVersionId
      ? byId.get(String(version.parentVersionId || ""))
      : null;
    baseSnapshot = previous ? snapshotFromVersionRecord(previous) : [];
  }

  return Object.keys(buildReviewDiffByImage(baseSnapshot, targetSnapshot, [])).length;
}

function exitVersionPreview() {
  state.versionPreview = {
    active: false,
    versionId: "",
    versionNo: 0,
    showDiffOnly: true,
    diffByImage: {},
    targetByImage: {},
    baseByImage: {}
  };
  renderAll();
}

function enterVersionPreview(versionId) {
  const role = getCurrentBookRole();
  if (!(role === "owner" || role === "editor" || role === "viewer")) {
    alert("当前角色不可查看版本差异");
    return;
  }
  const submissions = state.reviewData.submissions;
  const byId = new Map(submissions.map((item) => [item.id, item]));
  const current = byId.get(versionId);
  if (!current) {
    alert("未找到该版本");
    return;
  }

  const previous = current.parentVersionId ? byId.get(String(current.parentVersionId || "")) : null;
  const targetSnapshot = snapshotFromVersionRecord(current);
  const baseSnapshot = previous ? snapshotFromVersionRecord(previous) : [];
  const diffByImage = buildReviewDiffByImage(baseSnapshot, targetSnapshot, []);

  state.versionPreview = {
    active: true,
    versionId,
    versionNo: Number(current.versionNo || 0),
    showDiffOnly: Object.keys(diffByImage).length > 0,
    diffByImage,
    targetByImage: snapshotByImage(targetSnapshot),
    baseByImage: snapshotByImage(baseSnapshot)
  };
  state.selectedAnnoId = null;

  const firstChangedImageId = Object.keys(diffByImage)[0];
  if (firstChangedImageId) {
    state.selectedImageId = firstChangedImageId;
  }

  closeVersionModal();
  renderAll();
}

function syncVersionPreviewBarUi() {
  if (!el.versionPreviewBar) return;
  if (!state.versionPreview.active) {
    el.versionPreviewBar.classList.add("hidden");
    return;
  }
  el.versionPreviewBar.classList.remove("hidden");
  if (el.versionPreviewTitle) {
    const modeText = state.versionPreview.showDiffOnly ? "仅新增/减少" : "全部";
    el.versionPreviewTitle.textContent = `版本 ${state.versionPreview.versionNo} 对比（当前: ${modeText}，绿=新增，红=减少）`;
  }
  if (el.versionPreviewToggleBtn) {
    el.versionPreviewToggleBtn.textContent = state.versionPreview.showDiffOnly
      ? "切换为显示全部"
      : "切换为仅显示新增/减少";
  }
}

function restoreVersion(versionId) {
  const role = getCurrentBookRole();
  if (role !== "owner") {
    alert("仅管理者可恢复版本");
    return;
  }
  const version = state.reviewData.submissions.find((item) => item.id === versionId);
  if (!version) {
    alert("未找到该版本");
    return;
  }
  const ok = window.confirm("确定恢复到该版本吗？当前未提交改动将被覆盖。");
  if (!ok) return;

  const preservedReviewData = deepClone(state.reviewData);
  const restoreResult = buildRestorePayloadFromVersion(version, state.reviewData.submissions);
  applyBookData(restoreResult.payload || {});
  state.reviewData = normalizeReviewData(preservedReviewData);
  state.reviewData.activeVersionId = version.id;
  saveState({ wait: true, force: true });
  renderAll();
  closeVersionModal();

  if (Array.isArray(restoreResult.missingImageIds) && restoreResult.missingImageIds.length > 0) {
    alert(`已恢复该历史版本标注，但有 ${restoreResult.missingImageIds.length} 张历史图片在当前书籍中缺失，无法完整还原。`);
  }
}

function getVersionMaps(submissions) {
  const byId = new Map();
  const children = new Map();
  submissions.forEach((item) => {
    byId.set(item.id, item);
    const parentId = String(item.parentVersionId || "");
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push(item);
  });
  children.forEach((arr) => {
    arr.sort((a, b) => Number(a.versionNo || 0) - Number(b.versionNo || 0));
  });
  return { byId, children };
}

function getActiveVersionPath(submissions, activeVersionId) {
  if (!Array.isArray(submissions) || submissions.length === 0) return [];
  const { byId } = getVersionMaps(submissions);
  let current = byId.get(String(activeVersionId || "")) || submissions[submissions.length - 1];
  if (!current) return [];

  const reversed = [];
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    reversed.push(current);
    visited.add(current.id);
    const parentId = String(current.parentVersionId || "");
    current = parentId ? byId.get(parentId) : null;
  }
  return reversed.reverse();
}

function collectVersionSubtreeIds(childrenMap, rootId) {
  const ids = new Set();
  const stack = [String(rootId || "")];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || ids.has(currentId)) continue;
    ids.add(currentId);
    const childList = childrenMap.get(currentId) || [];
    childList.forEach((child) => {
      stack.push(String(child.id || ""));
    });
  }
  return ids;
}

function createVersionCard(item, role) {
  const card = document.createElement("div");
  card.className = "version-item";

  const head = document.createElement("div");
  head.className = "version-item-head";
  const title = document.createElement("strong");
  title.textContent = `版本 ${Number(item?.versionNo || 0)}`;
  const status = document.createElement("span");
  status.className = "version-item-status";
  status.textContent = `变更页数 ${Number(item?._displayDiffCount || 0)}`;
  head.appendChild(title);
  head.appendChild(status);

  const info = document.createElement("div");
  info.className = "muted";
  const who = item.submitter?.displayName || item.submitter?.email || "未知用户";
  const accountNo = Number(item.submitter?.accountNo || 0);
  const accountText = accountNo > 0 ? ` #${accountNo}` : "";
  info.textContent = `${who}${accountText} 提交于 ${new Date(item.createdAt).toLocaleString()}`;

  const actions = document.createElement("div");
  actions.className = "version-item-actions";

  const previewBtn = document.createElement("button");
  previewBtn.className = "mini-btn";
  previewBtn.type = "button";
  previewBtn.textContent = "查看差异";
  previewBtn.addEventListener("click", () => {
    enterVersionPreview(item.id);
  });
  actions.appendChild(previewBtn);

  if (role === "owner") {
    const restoreBtn = document.createElement("button");
    restoreBtn.className = "mini-btn";
    restoreBtn.type = "button";
    restoreBtn.textContent = "恢复此版";
    restoreBtn.addEventListener("click", () => {
      restoreVersion(item.id);
    });
    actions.appendChild(restoreBtn);
  } else {
    const note = document.createElement("span");
    note.className = "version-item-status";
    note.textContent = "仅查看";
    actions.appendChild(note);
  }

  card.appendChild(head);
  card.appendChild(info);
  card.appendChild(actions);
  return card;
}

function openVersionModal() {
  if (state.versionPreview.active) {
    alert("请先退出此历史版本");
    return;
  }
  if (!el.versionModal || !el.versionList) return;
  el.versionList.innerHTML = "";
  const submissions = state.reviewData.submissions
    .slice()
    .sort((a, b) => Number(a.versionNo || 0) - Number(b.versionNo || 0));

  if (submissions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "xml-hints-empty";
    empty.textContent = "暂无提交版本";
    el.versionList.appendChild(empty);
    el.versionModal.classList.remove("hidden");
    return;
  }

  const role = getCurrentBookRole();
  const { byId, children } = getVersionMaps(submissions);
  submissions.forEach((item) => {
    item._displayDiffCount = resolveVersionDiffCount(item, byId);
  });
  const activePath = getActiveVersionPath(submissions, state.reviewData.activeVersionId);

  activePath.forEach((item, idx) => {
    el.versionList.appendChild(createVersionCard(item, role));

    if (idx >= activePath.length - 1) return;
    const next = activePath[idx + 1];
    const currentSubtree = collectVersionSubtreeIds(children, item.id);
    const nextSubtree = collectVersionSubtreeIds(children, next.id);
    const hidden = Array.from(currentSubtree)
      .filter((id) => id !== item.id && !nextSubtree.has(id))
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => Number(a.versionNo || 0) - Number(b.versionNo || 0));

    if (hidden.length === 0) return;

    const wrapper = document.createElement("div");
    wrapper.className = "revoked-group";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "mini-btn revoked-toggle-btn";
    toggleBtn.type = "button";
    toggleBtn.textContent = `显示被撤销版本 (${hidden.length})`;

    const hiddenList = document.createElement("div");
    hiddenList.className = "revoked-list hidden";
    hidden.forEach((revokedVersion) => {
      hiddenList.appendChild(createVersionCard(revokedVersion, role));
    });

    toggleBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const nextExpanded = hiddenList.classList.contains("hidden");
      hiddenList.classList.toggle("hidden", !nextExpanded);
      toggleBtn.textContent = nextExpanded
        ? `收起被撤销版本 (${hidden.length})`
        : `显示被撤销版本 (${hidden.length})`;
    });

    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(hiddenList);
    el.versionList.appendChild(wrapper);
  });

  el.versionModal.classList.remove("hidden");
}

function closeVersionModal() {
  if (!el.versionModal) return;
  el.versionModal.classList.add("hidden");
}

function syncReviewToolbarUi() {
  const role = getCurrentBookRole();
  const canSubmit = role === "owner" || role === "editor";
  const canViewVersions = role === "owner" || role === "editor" || role === "viewer";

  if (el.submitOrReviewBtn) {
    el.submitOrReviewBtn.classList.toggle("hidden", !canSubmit || !currentBookId);
    el.submitOrReviewBtn.textContent = "提交改动";
  }
  if (el.versionHistoryBtn) el.versionHistoryBtn.classList.toggle("hidden", !canViewVersions || !currentBookId);
  if (el.renameImageBtn) el.renameImageBtn.classList.remove("hidden");
  syncVersionPreviewBarUi();
}

function updateAuthUi() {
  const currentRole = getCurrentBookRole();
  if (el.authUserLabel) {
    const accountText = Number(collabState.user?.accountNo) > 0
      ? ` #${Number(collabState.user.accountNo)}`
      : "";
    el.authUserLabel.textContent = collabState.user
      ? `协作用户：${collabState.user.displayName || collabState.user.email || "已登录"}${accountText}${currentBookId ? `（${roleLabel(currentRole)}）` : ""}`
      : "";
  }
  if (el.authOpenBtn) el.authOpenBtn.classList.toggle("hidden", !!collabState.user);
  if (el.authRenameBtn) el.authRenameBtn.classList.toggle("hidden", !collabState.user);
  if (el.authLogoutBtn) el.authLogoutBtn.classList.toggle("hidden", !collabState.user);
  if (el.shareBookBtn) {
    el.shareBookBtn.classList.toggle("hidden", !collabState.user || !currentBookId || !canInviteMembers(currentRole));
  }
  syncReviewToolbarUi();
  syncEditorPermissionUi();
}

function showAuthModal() {
  if (!el.authModal) return;
  el.authModal.classList.remove("hidden");
  if (el.authEmailInput) {
    window.setTimeout(() => {
      el.authEmailInput.focus();
    }, 0);
  }
}

function hideAuthModal() {
  if (!el.authModal) return;
  el.authModal.classList.add("hidden");
}

async function bootstrapAuthUser() {
  if (!collabState.token) {
    collabState.user = null;
    updateAuthUi();
    return;
  }
  try {
    const data = await collabFetch("/api/auth/me");
    collabState.user = data?.user || null;
  } catch (_) {
    setCollabToken("");
    collabState.user = null;
  }
  updateAuthUi();
}

function closeCollabSocket() {
  collabState.wsManualClose = true;
  if (collabState.wsReconnectTimer) {
    window.clearTimeout(collabState.wsReconnectTimer);
    collabState.wsReconnectTimer = null;
  }
  collabState.wsReconnectAttempts = 0;
  if (collabState.ws) {
    try { collabState.ws.close(); } catch (_) {}
  }
  collabState.ws = null;
  collabState.wsConnected = false;
  resetPresenceState();
  if (collabState.pendingWsSave?.reject) {
    collabState.pendingWsSave.reject(new Error("协作连接已断开"));
  }
  collabState.pendingWsSave = null;
}

function scheduleCollabReconnect() {
  if (collabState.wsManualClose) return;
  if (!collabState.token) return;
  if (collabState.wsReconnectTimer) return;
  const attempts = Math.max(0, Number(collabState.wsReconnectAttempts || 0));
  const delay = Math.min(5000, 600 + attempts * 400);
  collabState.wsReconnectTimer = window.setTimeout(() => {
    collabState.wsReconnectTimer = null;
    connectCollabSocket();
  }, delay);
}

function updateBookMetaFromCollabBook(book) {
  if (!book?.id) return;
  const books = loadBooksIndex();
  const idx = books.findIndex((item) => item.id === book.id);
  const nextMeta = {
    id: book.id,
    name: book.name || "未命名书籍",
    createdAt: book.createdAt || new Date().toISOString(),
    updatedAt: book.updatedAt || new Date().toISOString(),
    imageCount: Array.isArray(book.payload?.images) ? book.payload.images.length : 0,
    ownerUserId: book.ownerUserId || "",
    role: book.role || "viewer",
    version: Number(book.version || 1)
  };
  if (idx >= 0) books[idx] = { ...books[idx], ...nextMeta };
  else books.unshift(nextMeta);
  saveBooksIndex(books);
}

function connectCollabSocket() {
  if (!isCollabMode()) return;
  if (collabState.ws && (collabState.ws.readyState === WebSocket.OPEN || collabState.ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  if (!collabState.token) return;
  collabState.wsManualClose = false;

  const url = `${WS_PROTOCOL}://${APP_HOST}:3000/ws?token=${encodeURIComponent(collabState.token)}`;
  const ws = new WebSocket(url);
  collabState.ws = ws;

  ws.addEventListener("open", () => {
    collabState.wsReconnectAttempts = 0;
    if (collabState.wsReconnectTimer) {
      window.clearTimeout(collabState.wsReconnectTimer);
      collabState.wsReconnectTimer = null;
    }
    collabState.wsConnected = true;
    resetPresenceState();
    if (currentBookId) {
      ws.send(JSON.stringify({ type: "subscribe", bookId: currentBookId }));
    }
  });

  ws.addEventListener("close", () => {
    if (collabState.pendingWsSave?.reject) {
      const pending = collabState.pendingWsSave;
      collabState.pendingWsSave = null;
      pending.reject(new Error("协作连接已断开"));
    }
    collabState.wsConnected = false;
    resetPresenceState();
    if (collabState.ws === ws) {
      collabState.ws = null;
    }
    collabState.wsReconnectAttempts += 1;
    scheduleCollabReconnect();
  });

  ws.addEventListener("error", () => {
    if (collabState.pendingWsSave?.reject) {
      const pending = collabState.pendingWsSave;
      collabState.pendingWsSave = null;
      pending.reject(new Error("协作连接异常"));
    }
    collabState.wsConnected = false;
    if (collabState.ws === ws) {
      collabState.ws = null;
    }
    collabState.wsReconnectAttempts += 1;
    scheduleCollabReconnect();
  });

  ws.addEventListener("message", (evt) => {
    try {
      const msg = JSON.parse(String(evt.data || "{}"));

      if (msg.type === "error") {
        const message = String(msg?.message || "协作保存失败");
        if (collabState.pendingWsSave?.reject) {
          const pending = collabState.pendingWsSave;
          collabState.pendingWsSave = null;
          pending.reject(new Error(message));
          return;
        }
      }

      if (msg.type === "subscribed" && msg.book) {
        resetPresenceState();
        updateBookMetaFromCollabBook(msg.book);
        lastSavedPayloadKeyByBook.set(String(msg.book.id || ""), payloadKey(msg.book.payload || {}));
        collabState.currentBookVersion = Number(msg.book.version || collabState.currentBookVersion || 1);
        renderBooksList();
        return;
      }

      if (msg.type === "presence_snapshot") {
        const users = Array.isArray(msg.users) ? msg.users : [];
        const nextMap = {};
        users.forEach((item) => {
          const userId = String(item?.userId || "");
          if (!userId || userId === String(collabState.user?.id || "")) return;
          nextMap[userId] = {
            userId,
            displayName: String(item?.displayName || ""),
            email: String(item?.email || "")
          };
        });
        collabState.presenceUsers = nextMap;
        renderLivePresenceHint();
        return;
      }

      if (msg.type === "presence_join") {
        updatePresenceUser(msg.user);
        return;
      }

      if (msg.type === "presence_leave") {
        const userId = String(msg?.user?.userId || "");
        removePresenceUser(userId);
        return;
      }

      if (msg.type === "presence_cursor") {
        const userId = String(msg?.user?.userId || "");
        if (!userId || userId === String(collabState.user?.id || "")) return;
        updatePresenceUser(msg.user);
        collabState.remotePeers[userId] = {
          userId,
          displayName: String(msg?.user?.displayName || ""),
          email: String(msg?.user?.email || ""),
          imageId: String(msg?.imageId || ""),
          x: Number(msg?.x),
          y: Number(msg?.y),
          ts: Number(msg?.ts || Date.now())
        };
        renderPresenceLayer();
        return;
      }

      if (msg.type === "book_updated" && msg.book) {
        updateBookMetaFromCollabBook(msg.book);
        lastSavedPayloadKeyByBook.set(String(msg.book.id || ""), payloadKey(msg.book.payload || {}));
        if (msg.book.id === currentBookId) {
          const nextVersion = Number(msg.book.version || 1);
          const pending = collabState.pendingWsSave;
          if (pending && pending.bookId === msg.book.id) {
            collabState.pendingWsSave = null;
            collabState.currentBookVersion = nextVersion;
            pending.resolve(msg.book);
            return;
          }
          if (nextVersion > collabState.currentBookVersion) {
            collabState.currentBookVersion = nextVersion;
            applyBookData(msg.book.payload || {});
            renderAll();
          }
        }
        renderBooksList();
      }
    } catch (_) {
      // ignore malformed ws payload
    }
  });
}

function sendWsSaveBook(bookId, name, payload, baseVersion) {
  const ws = collabState.ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("协作连接未就绪"));
  }
  if (collabState.pendingWsSave) {
    return Promise.reject(new Error("上一次协作保存尚未完成"));
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      if (collabState.pendingWsSave?.reject) {
        const p = collabState.pendingWsSave;
        collabState.pendingWsSave = null;
        p.reject(new Error("协作保存超时，请重试"));
      }
    }, 8000);

    collabState.pendingWsSave = {
      bookId,
      resolve: (book) => {
        window.clearTimeout(timeoutId);
        resolve(book);
      },
      reject: (err) => {
        window.clearTimeout(timeoutId);
        reject(err);
      }
    };

    ws.send(JSON.stringify({
      type: "update_book",
      bookId,
      name,
      payload,
      baseVersion
    }));
  });
}

async function reloadWorkspaceByMode() {
  state.selectedAnnoId = null;
  state.selectedTagFilterName = "";
  state.pendingDrafts = [];
  state.draftRect = null;
  currentBookId = null;
  collabState.currentBookVersion = 0;
  resetPresenceState();
  await loadState();
  renderAll();
  updateAuthUi();
}

function bookDataKey(bookId) {
  return `${BOOK_DATA_KEY_PREFIX}${bookId}`;
}

function isIndexedDbSupported() {
  return typeof window !== "undefined" && !!window.indexedDB;
}

function openStorageDb() {
  if (!isIndexedDbSupported()) {
    return Promise.reject(new Error("当前浏览器不支持 IndexedDB"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE_BOOKS_META)) {
        db.createObjectStore(DB_STORE_BOOKS_META, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DB_STORE_BOOKS_DATA)) {
        db.createObjectStore(DB_STORE_BOOKS_DATA, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DB_STORE_KV)) {
        db.createObjectStore(DB_STORE_KV, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("打开 IndexedDB 失败"));
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

async function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB 请求失败"));
  });
}

async function idbGet(storeName, key) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return idbRequest(store.get(key));
}

async function idbPut(storeName, value) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await idbRequest(store.put(value));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB 写入事务失败"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB 写入事务中止"));
  });
}

async function idbDelete(storeName, key) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  await idbRequest(store.delete(key));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB 删除事务失败"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB 删除事务中止"));
  });
}

async function idbGetAll(storeName) {
  const db = await openStorageDb();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return idbRequest(store.getAll());
}

async function dbLoadBooksIndex() {
  const rows = await idbGetAll(DB_STORE_BOOKS_META);
  const list = Array.isArray(rows) ? rows : [];
  list.sort((a, b) => {
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return tb - ta;
  });
  return list;
}

async function dbSaveBooksIndex(books) {
  const db = await openStorageDb();
  const tx = db.transaction(DB_STORE_BOOKS_META, "readwrite");
  const store = tx.objectStore(DB_STORE_BOOKS_META);
  const oldRows = await idbRequest(store.getAll());
  const oldIds = new Set((oldRows || []).map((item) => item.id));
  const nextIds = new Set((books || []).map((item) => item.id));
  (books || []).forEach((item) => store.put(item));
  oldIds.forEach((id) => {
    if (!nextIds.has(id)) {
      store.delete(id);
    }
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("保存书籍索引失败"));
    tx.onabort = () => reject(tx.error || new Error("保存书籍索引失败"));
  });
}

async function dbLoadBookData(bookId) {
  const row = await idbGet(DB_STORE_BOOKS_DATA, bookId);
  return row?.data || null;
}

async function dbSaveBookData(bookId, data) {
  return idbPut(DB_STORE_BOOKS_DATA, { id: bookId, data });
}

async function dbDeleteBookData(bookId) {
  return idbDelete(DB_STORE_BOOKS_DATA, bookId);
}

async function dbGetFlag(key) {
  const row = await idbGet(DB_STORE_KV, key);
  return row?.value;
}

async function dbSetFlag(key, value) {
  return idbPut(DB_STORE_KV, { key, value });
}

async function setLastOpenedBookId(bookId) {
  await dbSetFlag(LAST_OPENED_BOOK_KEY, String(bookId || ""));
}

async function getLastOpenedBookId() {
  const value = await dbGetFlag(LAST_OPENED_BOOK_KEY);
  const normalized = String(value || "").trim();
  return normalized || null;
}

async function setLastView(viewName) {
  const nextView = viewName === "editor" ? "editor" : "library";
  await dbSetFlag(LAST_VIEW_KEY, nextView);
}

async function getLastView() {
  const value = String(await dbGetFlag(LAST_VIEW_KEY) || "").trim().toLowerCase();
  return value === "editor" ? "editor" : "library";
}

function loadBooksIndex() {
  return Array.isArray(booksIndexCache) ? booksIndexCache.slice() : [];
}

function saveBooksIndex(books) {
  booksIndexCache = Array.isArray(books) ? books.slice() : [];
}

async function persistBooksIndex() {
  await dbSaveBooksIndex(booksIndexCache);
}

function reportSaveError(err) {
  const msg = err?.message || "保存失败";
  if (/quota|配额|空间/i.test(msg)) {
    alert("保存失败：浏览器存储空间不足，请清理站点数据后重试");
    return;
  }
  alert(msg);
}

function isVersionConflictError(err) {
  const msg = String(err?.message || "");
  return /版本冲突|409|conflict/i.test(msg);
}

function payloadKey(payload) {
  try {
    return JSON.stringify(payload || {});
  } catch (_) {
    return "";
  }
}

function showEditorView() {
  if (el.libraryShell) el.libraryShell.classList.add("hidden");
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.classList.remove("hidden");
}

function showLibraryView() {
  const appShell = document.querySelector(".app-shell");
  if (appShell) appShell.classList.add("hidden");
  if (el.libraryShell) el.libraryShell.classList.remove("hidden");
}

function normalizeRect(rect) {
  const x1 = Math.min(rect.x1, rect.x2);
  const y1 = Math.min(rect.y1, rect.y2);
  const x2 = Math.max(rect.x1, rect.x2);
  const y2 = Math.max(rect.y1, rect.y2);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function normalizeAnnoShape(_shape) {
  return "rect";
}

function normalizeAnnoBorderStyle(style) {
  const normalized = String(style || "").trim().toLowerCase();
  if (normalized === "dashed" || normalized === "dotted") return normalized;
  return "solid";
}

function normalizeAnnoBorderWidth(width) {
  const n = Number.parseInt(width, 10);
  if (!Number.isFinite(n)) return 2;
  return Math.max(1, Math.min(8, n));
}

function toShapeRect(base, _shape) {
  return { ...base };
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((ch) => ch + ch).join("") : clean;
  const intVal = Number.parseInt(normalized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyBoxVisualStyle(box, color, borderStyle, borderWidth, isDraft = false) {
  const safeColor = String(color || "#2e6f86");
  const safeBorderStyle = normalizeAnnoBorderStyle(borderStyle || (isDraft ? "dashed" : "solid"));
  const safeBorderWidth = normalizeAnnoBorderWidth(borderWidth);
  box.style.border = `${safeBorderWidth}px ${safeBorderStyle} ${safeColor}`;
  box.style.borderColor = safeColor;
  box.style.background = hexToRgba(safeColor, isDraft ? 0.12 : 0.18);
}

function findTemplateTag(id) { return state.templateTags.find((tag) => tag.id === id) || null; }
function templateChildren(parentId) { return state.templateTags.filter((tag) => tag.parentId === parentId).sort((a, b) => (a.order || 0) - (b.order || 0)); }

function templatePath(tagId) {
  const arr = [];
  let cursor = findTemplateTag(tagId);
  while (cursor) {
    arr.unshift(cursor.name);
    cursor = cursor.parentId ? findTemplateTag(cursor.parentId) : null;
  }
  return arr.join("/");
}

function selectedImage() { return state.images.find((img) => img.id === state.selectedImageId) || null; }
function selectedAnno() {
  const img = selectedImage();
  if (!img || !state.selectedAnnoId) return null;
  return img.annotations.find((anno) => anno.id === state.selectedAnnoId) || null;
}

function ensureTemplateOrder() {
  const parentGroups = new Map();
  state.templateTags.forEach((tag) => {
    const key = tag.parentId || "ROOT";
    if (!parentGroups.has(key)) parentGroups.set(key, []);
    parentGroups.get(key).push(tag);
  });
  parentGroups.forEach((group) => {
    group.sort((a, b) => (a.order || 0) - (b.order || 0));
    group.forEach((tag, index) => { tag.order = index + 1; });
  });
}

function ensureImageMeta(img, idx) {
  img.meta = img.meta || {};
  if (!img.meta.id) img.meta.id = `img_${idx + 1}`;
  img.annotations = img.annotations || [];
  img.annotations.forEach((anno, index) => {
    anno.attrs = anno.attrs || {};
    const tag = findTemplateTag(anno.tagId);
    if (tag && tag.style) {
      anno.shape = normalizeAnnoShape(tag.style.shape);
      anno.color = tag.style.color;
      anno.borderStyle = normalizeAnnoBorderStyle(tag.style.borderStyle || "solid");
      anno.borderWidth = normalizeAnnoBorderWidth(tag.style.borderWidth || 2);
    }
    anno.color = anno.color || "#2e6f86";
    anno.shape = normalizeAnnoShape(anno.shape);
    anno.borderStyle = normalizeAnnoBorderStyle(anno.borderStyle);
    anno.borderWidth = normalizeAnnoBorderWidth(anno.borderWidth);
    anno.id = anno.id || `anno_${index + 1}`;
    anno.transcription = anno.transcription || "";
    anno.parentAnnoId = anno.parentAnnoId || null;
  });
}

function setIfNotEmpty(obj, key, value) {
  const trimmed = (value || "").trim();
  if (trimmed) obj[key] = trimmed;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function numToXml(value) {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(6)).toString();
}

function timestampForFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function buildAiLayoutHintPromptLines(hints) {
  const lines = [];
  const examples = Array.isArray(hints?.examples) ? hints.examples : [];
  const enabledExamples = examples.filter((item) => item.enabled);
  enabledExamples.forEach((item, idx) => {
    const ruleText = String(item.ruleText || "").trim();
    if (ruleText) {
      lines.push(`${idx + 1}. 文件=${item.fileName}; 规则摘要=${ruleText.slice(0, 500)}`);
      return;
    }
    const summaryText = String(item.summaryText || "").trim();
    if (summaryText) {
      lines.push(`${idx + 1}. 文件=${item.fileName}; 说明摘要=${summaryText.slice(0, 500)}`);
      return;
    }
    const tags = item.tags.length > 0 ? item.tags.join(",") : "(无)";
    const paths = item.paths.length > 0 ? item.paths.slice(0, 10).join(" | ") : "(无)";
    lines.push(`${idx + 1}. 文件=${item.fileName}; 标签=${tags}; 路径样例=${paths}`);
  });

  return lines.slice(0, 12);
}

function normalizeAiLayoutHints(raw) {
  const activeFileNamesRaw = Array.isArray(raw?.activeFileNames)
    ? raw.activeFileNames.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  const activeSet = new Set(activeFileNamesRaw);
  const examplesRaw = Array.isArray(raw?.examples) ? raw.examples : [];
  const examples = examplesRaw
    .map((item) => ({
      fileName: String(item?.fileName || "").trim(),
      fileType: String(item?.fileType || "").trim() || "text",
      tags: Array.isArray(item?.tags) ? item.tags.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 24) : [],
      paths: Array.isArray(item?.paths) ? item.paths.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 24) : [],
      summaryText: String(item?.summaryText || "").trim().slice(0, 2000),
      ruleText: String(item?.ruleText || "").trim().slice(0, 8000),
      enabled: activeSet.size === 0 ? true : activeSet.has(String(item?.fileName || "").trim())
    }))
    .filter((item) => item.fileName && (item.tags.length > 0 || item.paths.length > 0 || item.summaryText || item.ruleText))
    .slice(-10);
  const activeFileNames = examples.filter((item) => item.enabled).map((item) => item.fileName);
  const cachedPromptLines = buildAiLayoutHintPromptLines({ examples });
  return {
    examples,
    activeFileNames,
    cachedPromptLines,
    updatedAt: String(raw?.updatedAt || "")
  };
}

function stripXmlTags(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxText(file) {
  if (!window.JSZip) {
    throw new Error("缺少 docx 解析依赖，请刷新页面后重试");
  }
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file("word/document.xml");
  if (!entry) return "";
  const xml = await entry.async("string");
  return stripXmlTags(xml);
}

async function extractHintFromFile(file) {
  const fileName = String(file?.name || "").trim() || `example_${Date.now()}`;
  const lowerName = fileName.toLowerCase();
  const typeText = String(file?.type || "").toLowerCase();
  const isDocx = lowerName.endsWith(".docx") || typeText.includes("wordprocessingml");
  const isDoc = lowerName.endsWith(".doc") || typeText.includes("msword");
  const isXml = lowerName.endsWith(".xml") || /(text|application)\/xml|\+xml/.test(typeText);

  if (isDocx) {
    let plainText = await extractDocxText(file);
    plainText = String(plainText || "").replace(/\s+/g, " ").trim();
    if (!plainText) {
      throw new Error(`${fileName} 解析为空，请确认文档中有正文内容`);
    }
    return {
      fileName,
      fileType: "docx",
      tags: [],
      paths: [],
      summaryText: plainText.slice(0, 1600),
      ruleText: plainText.slice(0, 8000),
      enabled: true
    };
  }

  if (isDoc) {
    throw new Error(`${fileName} 为 .doc 旧格式，请先另存为 .docx 再上传`);
  }

  if (isXml) {
    const text = await file.text();
    const xmlHint = extractXmlHintFromText(text, fileName);
    const templateTags = parseTemplateTreeFromXmlText(text, fileName);
    const summaryText = [
      xmlHint.tags.length ? `标签: ${xmlHint.tags.join(",")}` : "",
      xmlHint.paths.length ? `路径样例: ${xmlHint.paths.slice(0, 12).join(" | ")}` : ""
    ].filter(Boolean).join("; ");
    return {
      ...xmlHint,
      fileType: "xml",
      summaryText,
      ruleText: String(text || "").slice(0, 8000),
      templateTags
    };
  }

  let plainText = "";
  try {
    plainText = await file.text();
  } catch (_) {
    plainText = "";
  }

  plainText = String(plainText || "").replace(/\s+/g, " ").trim();
  if (!plainText) {
    throw new Error(`${fileName} 无法提取可读文本，请优先使用 .docx/.txt/.md/.xml`);
  }

  const short = plainText.slice(0, 1600);
  return {
    fileName,
    fileType: isDocx ? "docx" : "text",
    tags: [],
    paths: [],
    summaryText: short,
    ruleText: plainText.slice(0, 8000),
    enabled: true
  };
}

function extractXmlHintFromText(xmlText, fileName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) {
    throw new Error(`XML 解析失败: ${fileName}`);
  }

  const tagSet = new Set();
  doc.querySelectorAll("template tag").forEach((node) => {
    const name = String(node.getAttribute("name") || "").trim();
    if (name) tagSet.add(name);
  });

  const pathSet = new Set();
  doc.querySelectorAll("annotations annotation").forEach((node) => {
    const pathVal = String(node.getAttribute("tagPath") || "").trim();
    const nameVal = String(node.getAttribute("tagName") || "").trim();
    if (pathVal) pathSet.add(pathVal);
    else if (nameVal) pathSet.add(nameVal);
  });

  return {
    fileName,
    tags: Array.from(tagSet).slice(0, 24),
    paths: Array.from(pathSet).slice(0, 24)
  };
}

function parseTemplateTreeFromXmlText(xmlText, fileName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) {
    throw new Error(`XML 解析失败: ${fileName}`);
  }

  const result = [];
  const pushTag = (name, parentId, attrs = []) => {
    const tagName = String(name || "").trim();
    if (!tagName) return "";
    const id = uid("xml_tag");
    result.push({
      id,
      name: tagName,
      parentId,
      attrs: Array.from(new Set((attrs || []).map((x) => String(x || "").trim()).filter(Boolean))),
      order: result.length + 1
    });
    return id;
  };

  const templateRoots = Array.from(doc.querySelectorAll("template > tag"))
    .filter((node) => node.parentElement?.tagName === "template");
  if (templateRoots.length > 0) {
    const walkTemplate = (node, parentId = null) => {
      const name = String(node.getAttribute("name") || "").trim();
      const attrs = String(node.getAttribute("attrs") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const id = pushTag(name, parentId, attrs);
      if (!id) return;
      Array.from(node.children)
        .filter((child) => child.tagName === "tag")
        .forEach((child) => walkTemplate(child, id));
    };
    templateRoots.forEach((node) => walkTemplate(node, null));
    return result.slice(0, 300);
  }

  const keyToAttrs = new Map();
  const childrenByKey = new Map();
  const nodeKey = (name, parentKey) => `${parentKey || "ROOT"}>${name}`;

  const visit = (node, parentKey = null) => {
    if (!(node instanceof Element)) return;
    const name = String(node.tagName || "").trim();
    if (!name) return;
    const key = nodeKey(name, parentKey);

    if (!keyToAttrs.has(key)) keyToAttrs.set(key, new Set());
    Array.from(node.attributes || []).forEach((attr) => {
      const attrName = String(attr?.name || "").trim();
      if (attrName) keyToAttrs.get(key).add(attrName);
    });

    const parentMapKey = parentKey || "ROOT";
    if (!childrenByKey.has(parentMapKey)) childrenByKey.set(parentMapKey, []);
    if (!childrenByKey.get(parentMapKey).includes(key)) {
      childrenByKey.get(parentMapKey).push(key);
    }

    Array.from(node.children || []).forEach((child) => visit(child, key));
  };

  if (doc.documentElement) {
    visit(doc.documentElement, null);
  }

  const build = (parentKey = null, parentId = null) => {
    const list = childrenByKey.get(parentKey || "ROOT") || [];
    list.forEach((key) => {
      const name = key.split(">").pop() || "";
      const attrs = Array.from(keyToAttrs.get(key) || []);
      const id = pushTag(name, parentId, attrs);
      if (id) build(key, id);
    });
  };

  build(null, null);
  return result.slice(0, 300);
}

async function ingestXmlHintFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    throw new Error("请先选择示例文件");
  }

  const current = normalizeAiLayoutHints(state.aiLayoutHints);
  const mapByName = new Map(current.examples.map((item) => [item.fileName, item]));
  const enabledSet = new Set(current.activeFileNames);
  let latestTemplateTags = null;
  for (const file of files) {
    const hint = await extractHintFromFile(file);
    mapByName.set(hint.fileName, { ...hint, enabled: true });
    enabledSet.add(hint.fileName);
    if (Array.isArray(hint.templateTags) && hint.templateTags.length > 0) {
      latestTemplateTags = hint.templateTags;
    }
  }
  state.aiLayoutHints = {
    examples: Array.from(mapByName.values()).slice(-10),
    activeFileNames: Array.from(enabledSet).slice(-10),
    updatedAt: new Date().toISOString()
  };
  state.aiLayoutHints = normalizeAiLayoutHints(state.aiLayoutHints);

  if (Array.isArray(latestTemplateTags) && latestTemplateTags.length > 0) {
    state.templateTags = latestTemplateTags;
    if (!state.selectedTemplateTagId || !state.templateTags.some((tag) => tag.id === state.selectedTemplateTagId)) {
      state.selectedTemplateTagId = state.templateTags[0]?.id || null;
    }
    state.activeDraftTagId = state.selectedTemplateTagId || state.activeDraftTagId;
    ensureTemplateOrder();
  }
}

function buildXmlHintLinesForPrompt() {
  const hints = normalizeAiLayoutHints(state.aiLayoutHints);
  state.aiLayoutHints = hints;
  return Array.isArray(hints.cachedPromptLines) ? hints.cachedPromptLines.slice(0, 12) : [];
}

function buildXmlHintRulesForPrompt() {
  const hints = normalizeAiLayoutHints(state.aiLayoutHints);
  state.aiLayoutHints = hints;
  const enabledExamples = Array.isArray(hints.examples)
    ? hints.examples.filter((item) => item.enabled)
    : [];
  const chunks = [];
  enabledExamples.forEach((item, idx) => {
    const ruleText = String(item.ruleText || item.summaryText || "").trim();
    if (!ruleText) return;
    chunks.push(`文件${idx + 1}: ${item.fileName}\n${ruleText.slice(0, 2400)}`);
  });
  return chunks.join("\n\n").slice(0, 12000);
}

function renderXmlHintInfo() {
  if (!el.feedXmlHintsInfo) return;
  const hints = normalizeAiLayoutHints(state.aiLayoutHints);
  const total = hints.examples.length;
  const enabled = hints.activeFileNames.length;
  el.feedXmlHintsInfo.textContent = total > 0 ? `已启用 ${enabled}/${total}` : "未投喂示例";
}

function renderXmlHintsModalList() {
  if (!el.xmlHintsList) return;
  const hints = normalizeAiLayoutHints(state.aiLayoutHints);
  state.aiLayoutHints = hints;
  el.xmlHintsList.innerHTML = "";

  if (hints.examples.length === 0) {
    const empty = document.createElement("div");
    empty.className = "xml-hints-empty";
    empty.textContent = "还没有示例文件，请点击右下角“添加示例”。";
    el.xmlHintsList.appendChild(empty);
    return;
  }

  hints.examples.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "xml-hints-item";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(item.enabled);
    checkbox.addEventListener("change", () => {
      const current = normalizeAiLayoutHints(state.aiLayoutHints);
      const target = current.examples.find((x) => x.fileName === item.fileName);
      if (!target) return;
      target.enabled = checkbox.checked;
      current.activeFileNames = current.examples.filter((x) => x.enabled).map((x) => x.fileName);
      state.aiLayoutHints = normalizeAiLayoutHints(current);
      renderXmlHintInfo();
      saveState();
    });
    label.appendChild(checkbox);

    const title = document.createElement("span");
    title.textContent = `${idx + 1}. ${item.fileName}`;
    label.appendChild(title);
    row.appendChild(label);

    const meta = document.createElement("span");
    meta.className = "muted";
    const tagsText = item.tags.length > 0 ? `标签: ${item.tags.slice(0, 6).join(",")}` : "";
    const summaryText = item.summaryText ? `说明摘要: ${item.summaryText.slice(0, 120)}` : "";
    const typeText = item.fileType ? `类型: ${item.fileType}` : "";
    meta.textContent = [typeText, tagsText, summaryText].filter(Boolean).join(" | ");
    row.appendChild(meta);

    el.xmlHintsList.appendChild(row);
  });
}

function openXmlHintsModal() {
  if (!el.xmlHintsModal) return;
  renderXmlHintsModalList();
  el.xmlHintsModal.classList.remove("hidden");
}

function closeXmlHintsModal() {
  if (!el.xmlHintsModal) return;
  el.xmlHintsModal.classList.add("hidden");
}

function glyphCollectedLabel(item) {
  return item?.collected ? "已被收录" : "未收录";
}

function glyphDisplayText(item) {
  const official = normalizeCodepointInput(item?.officialCodepoint || "");
  if (!official) return "未收录字形";
  return String(item?.glyphChar || "").trim() || "已收录字形";
}

function normalizeGlyphRegistryItem(item) {
  const cp = normalizeCodepointInput(item?.codepoint || "") || String(item?.codepoint || "").trim().toUpperCase();
  const officialCpRaw = String(item?.officialCodepoint || "").trim();
  let officialCp = "";
  try {
    officialCp = officialCpRaw ? normalizeCodepointInput(officialCpRaw) : "";
  } catch (_) {
    officialCp = officialCpRaw.toUpperCase();
  }
  const collected = Boolean(item?.collected) || Boolean(officialCp);
  return {
    ...item,
    codepoint: cp,
    collected,
    officialCodepoint: officialCp || "",
    collectedAt: String(item?.collectedAt || "")
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildGlyphRegistryCsv() {
  const headers = [
    "序号",
    "字形",
    "当前Unicode",
    "官方Unicode",
    "收录状态",
    "IDS",
    "备注",
    "图片名",
    "创建时间",
    "收录更新时间"
  ];
  const rows = [headers.join(",")];
  state.glyphRegistry.forEach((item, idx) => {
    const row = [
      idx + 1,
      item.glyphChar || "",
      item.codepoint || "",
      item.officialCodepoint || "",
      glyphCollectedLabel(item),
      item.glyphIds || "",
      item.glyphNote || "",
      item.imageName || "",
      item.createdAt || "",
      item.collectedAt || ""
    ].map(csvEscape);
    rows.push(row.join(","));
  });
  return `\uFEFF${rows.join("\r\n")}`;
}

function exportGlyphRegistryCsv() {
  const csv = buildGlyphRegistryCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guji_glyph_registry_${timestampForFileName()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function syncGlyphCodepointToAnnotations(targetGlyphChar, oldCodepoint, nextCodepoint) {
  const target = singleCharForGlyphLookup(targetGlyphChar || "");
  state.images.forEach((img) => {
    (img.annotations || []).forEach((anno) => {
      if (!isCharTagAnno(anno)) return;
      const annoGlyph = singleCharForGlyphLookup(anno.attrs?.glyphChar || anno.transcription || "");
      const annoCp = String(anno.attrs?.codepoint || "").trim().toUpperCase();
      const matchedByGlyph = target && annoGlyph && annoGlyph === target;
      const matchedByOldCp = oldCodepoint && annoCp === oldCodepoint;
      if (matchedByGlyph || matchedByOldCp) {
        anno.attrs = anno.attrs || {};
        anno.attrs.codepoint = nextCodepoint;
      }
    });
  });
}

function markGlyphAsCollectedByIndex(index) {
  const item = state.glyphRegistry[index];
  if (!item) return;
  const current = String(item.codepoint || "").trim().toUpperCase();
  const input = window.prompt("输入官方 Unicode（例如 U+2B740）", item.officialCodepoint || current || "");
  if (input == null) return;
  const nextCp = normalizeCodepointInput(input);
  const oldCp = current;
  item.codepoint = nextCp;
  item.officialCodepoint = nextCp;
  item.collected = true;
  item.collectedAt = new Date().toISOString();
  syncGlyphCodepointToAnnotations(item.glyphChar, oldCp, nextCp);
  renderAll();
  saveState();
}

function buildTemplateXml(lines, parentId, indent) {
  const children = templateChildren(parentId);
  children.forEach((tag) => {
    const tagStyle = getTagStyle(tag);
    const tagAttrs = [
      `id="${escapeXml(tag.id || "")}"`,
      `name="${escapeXml(tag.name || "")}"`,
      `order="${escapeXml(String(tag.order || 0))}"`
    ];
    if (tag.parentId) tagAttrs.push(`parentId="${escapeXml(tag.parentId)}"`);
    const attrsText = (tag.attrs || []).join(",");
    if (attrsText) tagAttrs.push(`attrs="${escapeXml(attrsText)}"`);
    if (tagStyle?.shape) tagAttrs.push(`shape="${escapeXml(tagStyle.shape)}"`);
    if (tagStyle?.color) tagAttrs.push(`color="${escapeXml(tagStyle.color)}"`);

    lines.push(`${indent}<tag ${tagAttrs.join(" ")}>`);
    buildTemplateXml(lines, tag.id, `${indent}  `);
    lines.push(`${indent}</tag>`);
  });
}

function buildProjectXml() {
  const totalAnnotations = state.images.reduce((sum, img) => sum + (img.annotations?.length || 0), 0);
  const lines = [];
  lines.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  lines.push(`<gujiProject schemaVersion="1.0" exportedAt="${escapeXml(new Date().toISOString())}">`);
  lines.push(`  <summary imageCount="${state.images.length}" annotationCount="${totalAnnotations}" templateTagCount="${state.templateTags.length}" glyphCount="${state.glyphRegistry.length}"/>`);

  lines.push("  <template>");
  buildTemplateXml(lines, null, "    ");
  lines.push("  </template>");

  lines.push("  <images>");
  state.images.forEach((img, imageIndex) => {
    const imageAttrs = [
      `id="${escapeXml(img.id || "")}"`,
      `name="${escapeXml(img.name || "")}"`,
      `index="${imageIndex + 1}"`,
      `category="${escapeXml(img.category || "")}"`,
      `contentElement="${escapeXml(img.contentElement || "")}"`,
      `contentKind="${escapeXml(img.contentKind || "")}"`
    ];
    if (img.src) imageAttrs.push(`src="${escapeXml(img.src)}"`);
    lines.push(`    <image ${imageAttrs.join(" ")}>`);

    const metaEntries = Object.entries(img.meta || {});
    if (metaEntries.length > 0) {
      lines.push("      <meta>");
      metaEntries.forEach(([key, value]) => {
        lines.push(`        <field name="${escapeXml(key)}" value="${escapeXml(String(value || ""))}"/>`);
      });
      lines.push("      </meta>");
    }

    lines.push("      <annotations>");
    (img.annotations || []).forEach((anno, annoIndex) => {
      const annoAttrs = [
        `id="${escapeXml(anno.id || "")}"`,
        `index="${annoIndex + 1}"`,
        `tagId="${escapeXml(anno.tagId || "")}"`,
        `tagName="${escapeXml(anno.tagName || "")}"`,
        `tagPath="${escapeXml(anno.tagPath || "")}"`,
        `shape="${escapeXml(normalizeAnnoShape(anno.shape || "rect"))}"`,
        `color="${escapeXml(anno.color || "")}"`,
        `borderStyle="${escapeXml(normalizeAnnoBorderStyle(anno.borderStyle || "solid"))}"`,
        `borderWidth="${escapeXml(String(normalizeAnnoBorderWidth(anno.borderWidth || 2)))}"`
      ];
      if (anno.parentAnnoId) annoAttrs.push(`parentAnnoId="${escapeXml(anno.parentAnnoId)}"`);
      lines.push(`        <annotation ${annoAttrs.join(" ")}>`);
      lines.push(`          <rect x="${numToXml(anno.rect?.x || 0)}" y="${numToXml(anno.rect?.y || 0)}" w="${numToXml(anno.rect?.w || 0)}" h="${numToXml(anno.rect?.h || 0)}"/>`);
      lines.push(`          <transcription>${escapeXml(anno.transcription || "")}</transcription>`);

      const annoAttrEntries = Object.entries(anno.attrs || {});
      if (annoAttrEntries.length > 0) {
        lines.push("          <attrs>");
        annoAttrEntries.forEach(([key, value]) => {
          lines.push(`            <attr key="${escapeXml(key)}" value="${escapeXml(String(value || ""))}"/>`);
        });
        lines.push("          </attrs>");
      }
      lines.push("        </annotation>");
    });
    lines.push("      </annotations>");
    lines.push("    </image>");
  });
  lines.push("  </images>");

  lines.push("  <glyphRegistry>");
  state.glyphRegistry.forEach((item, index) => {
    const attrs = [
      `id="${escapeXml(item.id || "")}"`,
      `index="${index + 1}"`,
      `glyphChar="${escapeXml(item.glyphChar || "")}"`,
      `codepoint="${escapeXml(item.codepoint || "")}"`,
      `collected="${escapeXml(item.collected ? "true" : "false")}"`,
      `officialCodepoint="${escapeXml(item.officialCodepoint || "")}"`,
      `imageId="${escapeXml(item.imageId || "")}"`,
      `imageName="${escapeXml(item.imageName || "")}"`,
      `annoId="${escapeXml(item.annoId || "")}"`
    ];
    if (item.createdAt) attrs.push(`createdAt="${escapeXml(item.createdAt)}"`);
    if (item.collectedAt) attrs.push(`collectedAt="${escapeXml(item.collectedAt)}"`);
    if (item.previewDataUrl) attrs.push(`previewDataUrl="${escapeXml(item.previewDataUrl)}"`);
    lines.push(`    <glyph ${attrs.join(" ")}/>`);
  });
  lines.push("  </glyphRegistry>");

  lines.push("</gujiProject>");
  return lines.join("\n");
}

function exportProjectAsXml() {
  const xml = buildProjectXml();
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guji_export_${timestampForFileName()}.xml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildProjectJson() {
  return {
    schemaVersion: "1.0",
    exportedAt: new Date().toISOString(),
    summary: {
      imageCount: state.images.length,
      annotationCount: state.images.reduce((sum, img) => sum + (img.annotations?.length || 0), 0),
      templateTagCount: state.templateTags.length,
      glyphCount: state.glyphRegistry.length
    },
    template: state.templateTags,
    images: state.images,
    glyphRegistry: state.glyphRegistry
  };
}

function exportProjectAsJson() {
  const payload = JSON.stringify(buildProjectJson(), null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guji_export_${timestampForFileName()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openExportFormatModal() {
  if (!el.exportFormatModal) return;
  el.exportFormatModal.classList.remove("hidden");
}

function closeExportFormatModal() {
  if (!el.exportFormatModal) return;
  el.exportFormatModal.classList.add("hidden");
}

function normalizeCodepointInput(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return "";
  const hex = raw.startsWith("U+") ? raw.slice(2) : raw;
  if (!/^[0-9A-F]{4,6}$/.test(hex)) {
    throw new Error("unicode格式错误，应为 U+XXXX 到 U+XXXXXX");
  }
  return `U+${hex}`;
}

function cpIntToUPlus(value) {
  return `U+${value.toString(16).toUpperCase().padStart(4, "0")}`;
}

function codepointFromSingleChar(ch) {
  const text = String(ch || "").trim();
  const arr = [...text];
  if (arr.length !== 1) return "";
  const cp = arr[0].codePointAt(0);
  if (!cp) return "";
  return `U+${cp.toString(16).toUpperCase()}`;
}

function usedCodepointSet() {
  const used = new Set();
  state.images.forEach((img) => {
    img.annotations.forEach((anno) => {
      const cp = (anno.attrs?.codepoint || "").trim().toUpperCase();
      if (cp) used.add(cp);
    });
  });
  state.glyphRegistry.forEach((item) => {
    const cp = String(item.codepoint || "").trim().toUpperCase();
    if (cp) used.add(cp);
  });
  return used;
}

function isPuaCodepoint(cp) {
  const normalized = normalizeCodepointInput(cp);
  const value = Number.parseInt(normalized.slice(2), 16);
  return value >= GLYPH_PUA_START && value <= GLYPH_PUA_END;
}

function singleCharForGlyphLookup(text) {
  const chars = [...String(text || "").trim()];
  if (chars.length !== 1) return "";
  return chars[0];
}

function toSimplifiedSingleChar(text) {
  const raw = singleCharForGlyphLookup(text);
  if (!raw) return "";
  const converted = convertTraditionalToSimplified(raw);
  const simplified = singleCharForGlyphLookup(converted?.text || "");
  if (!simplified || simplified === "-") return raw;
  return simplified;
}

function findGlyphRegistryByChar(glyphChar) {
  const target = singleCharForGlyphLookup(glyphChar);
  if (!target) return null;
  return state.glyphRegistry.find((item) => singleCharForGlyphLookup(item.glyphChar) === target) || null;
}

function resolveRegisteredCodepoint(glyphChar) {
  const simplified = toSimplifiedSingleChar(glyphChar);
  const matched = findGlyphRegistryByChar(simplified);
  if (!matched?.codepoint) return "";
  return normalizeCodepointInput(matched.codepoint) || String(matched.codepoint).trim().toUpperCase();
}

function allocateGlyphCodepoint(glyphChar, manualCodepoint) {
  const used = usedCodepointSet();
  const manual = normalizeCodepointInput(manualCodepoint);
  if (manual) {
    if (!isPuaCodepoint(manual)) return manual;
    if (used.has(manual)) throw new Error(`unicode已存在：${manual}`);
    return manual;
  }

  const registered = resolveRegisteredCodepoint(glyphChar);
  if (registered) return registered;

  const official = codepointFromSingleChar(glyphChar);
  if (official && !isPuaCodepoint(official)) {
    return official;
  }

  for (let cp = GLYPH_PUA_START; cp <= GLYPH_PUA_END; cp += 1) {
    const candidate = cpIntToUPlus(cp);
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("PUA编码池已满，无法分配");
}

function showGlyphAllocationRules() {
  const lines = [
    "编码选址： 使用 Unicode 私有使用区 (PUA)。",
    "优先使用基本平面 (BMP) 的 U+E000 - U+F8FF。",
    "备选辅助平面 (Plane 15/16) 应对万级以上的大型字库。",
    "分配规则 (排序逻辑)：",
    "首选：检索现有标准。在分配 PUA 前，必须检索 Unicode Extension A-I 确认是否已收录。",
    "次选：按部首排序。参照《康熙字典》214部首。",
    "内部分序： 同一部首内按 剩余笔画数（由少到多）排序；笔画相同时按 起笔笔顺（横、竖、撇、点、折）排序。",
    "预留空位： 每个部首区块后预留 10%-20% 的空位，便于后期插入新发现的字。"
  ];
  alert(lines.join("\n"));
}

function ensureCharTemplateTag() {
  let charTag = state.templateTags.find((tag) => (tag.name || "").trim().toLowerCase() === "char") || null;
  if (charTag) return charTag;

  const contentTag = state.templateTags.find((tag) => (tag.name || "").trim().toLowerCase() === "content") || null;
  const parentId = contentTag ? contentTag.id : null;
  charTag = {
    id: uid("tag"),
    name: "char",
    parentId,
    attrs: ["id"],
    order: templateChildren(parentId).length + 1,
    style: { shape: "rect", color: "#8f3b2e" }
  };
  state.templateTags.push(charTag);
  ensureTemplateOrder();
  return charTag;
}

function cropRectToDataUrl(rect) {
  if (!el.mainImage || !el.mainImage.naturalWidth || !el.mainImage.naturalHeight) return "";
  const sx = Math.max(0, Math.floor(rect.x * el.mainImage.naturalWidth));
  const sy = Math.max(0, Math.floor(rect.y * el.mainImage.naturalHeight));
  const sw = Math.max(1, Math.floor(rect.w * el.mainImage.naturalWidth));
  const sh = Math.max(1, Math.floor(rect.h * el.mainImage.naturalHeight));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(el.mainImage, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/png");
}

function captureCurrentImageDataUrl(maxSide = 1600) {
  if (!el.mainImage || !el.mainImage.naturalWidth || !el.mainImage.naturalHeight) return "";
  const srcW = el.mainImage.naturalWidth;
  const srcH = el.mainImage.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(el.mainImage, 0, 0, srcW, srcH, 0, 0, outW, outH);
  return canvas.toDataURL("image/png");
}

function getTemplateTagsByDepth(targetDepth) {
  return state.templateTags.filter((tag) => templateDepth(tag.id) === targetDepth);
}

function getTemplateTagsFromDepth(minDepth) {
  return state.templateTags.filter((tag) => templateDepth(tag.id) >= minDepth);
}

function getAutoLayoutTargetTags() {
  const tags = getTemplateTagsFromDepth(3);
  const mapped = tags.map((tag) => ({
    id: tag.id,
    name: String(tag.name || "").trim(),
    path: templatePath(tag.id),
    style: getTagStyle(tag) || { shape: "rect", color: "#2e6f86", borderStyle: "solid", borderWidth: 2 }
  })).filter((tag) => tag.name);
  return mapped;
}

async function autoDrawLayoutByAI() {
  const img = selectedImage();
  if (!img) {
    throw new Error("请先选择图片");
  }

  const targetTags = getAutoLayoutTargetTags();
  if (targetTags.length === 0) {
    throw new Error("模板树第3层及以下没有可用标签，请先在模板树中配置");
  }

  const imageDataUrl = captureCurrentImageDataUrl();
  if (!imageDataUrl) {
    throw new Error("无法读取当前图片，请稍后重试");
  }

  const payload = {
    imageDataUrl,
    categories: targetTags.map((tag) => ({ name: tag.name, path: tag.path })),
    xmlHintLines: buildXmlHintLinesForPrompt(),
    xmlHintRules: buildXmlHintRulesForPrompt()
  };

  const res = await fetch(`${API_BASE}/api/layout/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "自动画框失败");
  }

  const data = await res.json();
  const detections = Array.isArray(data?.detections) ? data.detections : [];
  if (detections.length === 0) {
    throw new Error("未识别到可用区域");
  }

  const byName = new Map(targetTags.map((tag) => [tag.name.toLowerCase(), tag]));
  const drafts = [];

  detections.forEach((item) => {
    const tagName = String(item?.tagName || "").trim();
    const matched = byName.get(tagName.toLowerCase());
    if (!matched) return;

    const x = clamp01(Number(item?.x));
    const y = clamp01(Number(item?.y));
    const w = clamp01(Number(item?.w));
    const h = clamp01(Number(item?.h));
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) return;
    if (w < 0.003 || h < 0.003) return;
    if (x + w > 1 || y + h > 1) return;

    drafts.push({
      rect: { x, y, w, h },
      tagId: matched.id,
      tagName: matched.name,
      tagPath: matched.path,
      shape: matched.style.shape || "rect",
      color: matched.style.color || "#2e6f86",
      borderStyle: normalizeAnnoBorderStyle(matched.style.borderStyle || "solid"),
      borderWidth: normalizeAnnoBorderWidth(matched.style.borderWidth || 2),
      transcription: String(item?.transcription || item?.text || "").trim(),
      meaning: String(item?.meaning || "").trim(),
      confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : 0
    });
  });

  if (drafts.length === 0) {
    throw new Error("识别结果与当前第3层及以下标签不匹配");
  }

  const sortedDrafts = drafts
    .slice()
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));
  const nonOverlapDrafts = [];
  sortedDrafts.forEach((draft) => {
    const overlaps = nonOverlapDrafts.some((kept) => kept.tagId === draft.tagId && rectsOverlap(kept.rect, draft.rect));
    if (!overlaps) nonOverlapDrafts.push(draft);
  });

  const overlapCheck = validatePendingDraftsNoSameTagOverlap(img, nonOverlapDrafts);
  if (!overlapCheck.ok) {
    throw new Error(`自动画框失败：${overlapCheck.message}`);
  }

  const { lastAnnoId } = appendDraftsToAnnotations(img, nonOverlapDrafts, { preferDraftText: true });
  state.selectedAnnoId = lastAnnoId;
  state.drawingActive = false;
  state.glyphCreateActive = false;
  state.draftRect = null;
  state.pendingDrafts = [];
  renderAll();
  saveState();
}

function captureGlyphDraft(rect) {
  const img = selectedImage();
  if (!img) throw new Error("请先选择图片");
  state.glyphDraft = {
    imageId: img.id,
    imageName: img.name,
    rect: { ...rect },
    previewDataUrl: cropRectToDataUrl(rect),
    capturedAt: new Date().toISOString()
  };
}

function clearGlyphInputFields() {
  if (el.glyphCharInput) el.glyphCharInput.value = "";
  if (el.glyphManualCodepointInput) el.glyphManualCodepointInput.value = "";
  if (el.glyphIdsInput) el.glyphIdsInput.value = "";
  if (el.glyphNoteInput) el.glyphNoteInput.value = "";
}

function formatAccuracyLabel(confidence) {
  if (confidence == null || confidence === "") return "";
  const n = Number(confidence);
  if (!Number.isFinite(n)) return "";
  const pct = n <= 1 ? n * 100 : n;
  return `准确率: ${pct.toFixed(1)}%`;
}

function createGlyphAnnoFromDraft() {
  const img = selectedImage();
  if (!img) throw new Error("请先选择图片");
  if (!state.glyphDraft) throw new Error("请先点击“造字”并框选图片中的一个字");
  if (state.glyphDraft.imageId !== img.id) throw new Error("请切回框选时的图片后再保存造字");

  const rect = { ...state.glyphDraft.rect };
  const glyphChar = (el.glyphCharInput?.value || "").trim();

  const codepoint = allocateGlyphCodepoint(glyphChar, el.glyphManualCodepointInput?.value || "");
  const charTag = ensureCharTemplateTag();
  const style = getTagStyle(charTag) || { shape: "rect", color: "#8f3b2e" };
  if (!getTagStyle(charTag)) syncStyleToTag(charTag.id, style.shape, style.color);

  const anno = {
    id: uid("anno"),
    tagId: charTag.id,
    tagName: charTag.name,
    tagPath: templatePath(charTag.id),
    shape: "rect",
    color: style.color,
    borderStyle: "solid",
    borderWidth: 2,
    transcription: glyphChar || "",
    rect: { ...rect },
    attrs: {
      codepoint,
      glyphChar,
      glyphIds: (el.glyphIdsInput?.value || "").trim(),
      glyphNote: (el.glyphNoteInput?.value || "").trim(),
      glyphImageName: state.glyphDraft.imageName,
      glyphCropDataUrl: state.glyphDraft.previewDataUrl || ""
    },
    parentAnnoId: null
  };

  const idValue = (anno.attrs.id || "").trim();
  anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);
  img.annotations.push(anno);

  state.selectedAnnoId = anno.id;
  state.glyphRegistry.unshift({
    id: uid("glyph"),
    glyphChar: glyphChar || "(未录字符)",
    codepoint,
    officialCodepoint: "",
    collected: false,
    collectedAt: "",
    glyphIds: (el.glyphIdsInput?.value || "").trim(),
    glyphNote: (el.glyphNoteInput?.value || "").trim(),
    imageId: img.id,
    imageName: img.name,
    previewDataUrl: state.glyphDraft.previewDataUrl || "",
    annoId: anno.id,
    createdAt: new Date().toISOString()
  });
  state.glyphRegistry = state.glyphRegistry.slice(0, 200);

  state.glyphDraft = null;
  return anno;
}

async function persistGlyphRecordToServer(anno) {
  if (!anno) return;
  const payload = {
    charGlyph: String(anno.attrs?.glyphChar || anno.transcription || "").trim(),
    manualCodepoint: String(anno.attrs?.codepoint || "").trim(),
    ids: String(anno.attrs?.glyphIds || "").trim(),
    note: String(anno.attrs?.glyphNote || "").trim(),
    imageDataUrl: String(anno.attrs?.glyphCropDataUrl || "")
  };

  const res = await fetch(`${API_BASE}/api/glyphs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "写入数据库失败");
  }
}

async function suggestGlyphByAI() {
  if (!state.glyphDraft?.previewDataUrl) {
    throw new Error("请先框选字图后再自动识别");
  }

  const payload = {
    imageDataUrl: state.glyphDraft.previewDataUrl,
    imageName: state.glyphDraft.imageName,
    existing: state.glyphRegistry.slice(0, 200).map((it) => ({
      glyphChar: it.glyphChar,
      codepoint: it.codepoint
    }))
  };

  const res = await fetch(`${API_BASE}/api/glyphs/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "AI识别服务不可用");
  }

  const data = await res.json();
  const suggestion = data?.suggestion || data || {};

  const recognizedChar = singleCharForGlyphLookup(suggestion.glyphChar || "");
  const simplifiedChar = toSimplifiedSingleChar(recognizedChar);
  const matchedRegistry = findGlyphRegistryByChar(simplifiedChar);
  if (recognizedChar && simplifiedChar && matchedRegistry?.codepoint) {
    suggestion.exists = true;
    suggestion.glyphChar = simplifiedChar;
    suggestion.codepoint = normalizeCodepointInput(matchedRegistry.codepoint) || matchedRegistry.codepoint;
  }

  if (suggestion.glyphChar && el.glyphCharInput) {
    el.glyphCharInput.value = suggestion.glyphChar;
  }
  if (suggestion.codepoint && el.glyphManualCodepointInput) {
    el.glyphManualCodepointInput.value = suggestion.codepoint;
  }
  if (suggestion.ids && el.glyphIdsInput) {
    el.glyphIdsInput.value = suggestion.ids;
  }

  const accuracy = formatAccuracyLabel(suggestion.confidence);
  if (el.glyphCreateHint) {
    if (suggestion.exists) {
      const cp = suggestion.codepoint || "";
      const ids = suggestion.ids || "";
      if (el.glyphManualCodepointInput) el.glyphManualCodepointInput.value = cp;
      if (el.glyphIdsInput) el.glyphIdsInput.value = ids;
      const accuracyLine = accuracy ? `\n${accuracy}` : "";
      alert(`该字已被收录。\nunicode: ${cp || "(空)"}\nIDS: ${ids || "(空)"}${accuracyLine}`);
      el.glyphCreateHint.textContent = accuracy || "该字已被收录，可直接保存";
    } else {
      el.glyphCreateHint.textContent = accuracy
        ? `建议已填入 unicode/IDS。${accuracy}`
        : "建议已填入 unicode/IDS。";
    }
  }
}

function getTranscriptionTargetRect() {
  if (state.draftRect) return { ...state.draftRect };
  if (state.pendingDrafts.length > 0) return { ...state.pendingDrafts[0].rect };
  const anno = selectedAnno();
  if (anno?.rect) return { ...anno.rect };
  return null;
}

async function suggestTranscriptionByAI() {
  const rect = getTranscriptionTargetRect();
  if (!rect) {
    throw new Error("请先框选一个区域后再识别简体");
  }

  const imageDataUrl = cropRectToDataUrl(rect);
  if (!imageDataUrl) {
    throw new Error("无法获取框选字图");
  }

  const transcription = await requestTranscriptionSuggestion(imageDataUrl);
  if (el.annoTranscription) {
    el.annoTranscription.value = transcription;
  }
}

async function requestTranscriptionSuggestion(imageDataUrl) {
  const payload = { imageDataUrl };
  const res = await fetch(`${API_BASE}/api/transcription/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "AI识别服务不可用");
  }

  const data = await res.json();
  const suggestion = data?.suggestion || data || {};
  const transcription = String(suggestion.transcription || "").trim();
  if (!transcription) {
    throw new Error("AI未识别出简体结果，请手动填写");
  }
  return transcription;
}

async function suggestAttributeMeaning(attrName, attrValue, tagPath, transcription) {
  const payload = {
    attrName: String(attrName || "").trim(),
    attrValue: String(attrValue || "").trim(),
    tagPath: String(tagPath || "").trim(),
    transcription: String(transcription || "").trim()
  };

  if (!payload.attrName) {
    throw new Error("缺少属性名");
  }
  if (!payload.attrValue && !payload.transcription) {
    throw new Error("请先填写属性值或简体形式");
  }

  const res = await fetch(`${API_BASE}/api/attrs/meaning`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "AI释义失败");
  }

  const data = await res.json();
  const suggestion = data?.suggestion || data || {};
  const meaning = String(suggestion.meaning || "").trim();
  if (!meaning) {
    throw new Error("AI未返回释义，请手动填写");
  }
  return meaning;
}

const TRADITIONAL_PHRASE_MAP = {
  "乾坤": "乾坤",
  "後來": "后来",
  "裏面": "里面",
  "著作": "著作",
  "臺灣": "台湾",
  "萬物": "万物"
};

const TRADITIONAL_CHAR_MAP = {
  "萬": "万", "與": "与", "專": "专", "業": "业", "叢": "丛", "東": "东", "絲": "丝", "兩": "两",
  "嚴": "严", "喪": "丧", "個": "个", "豐": "丰", "臨": "临", "為": "为", "麗": "丽", "舉": "举",
  "麼": "么", "義": "义", "烏": "乌", "樂": "乐", "喬": "乔", "習": "习", "鄉": "乡", "書": "书",
  "買": "买", "亂": "乱", "爭": "争", "於": "于", "虧": "亏", "雲": "云", "亞": "亚", "產": "产",
  "畝": "亩", "親": "亲", "褻": "亵", "嚲": "亸", "億": "亿", "僅": "仅", "從": "从", "侖": "仑",
  "倉": "仓", "儀": "仪", "們": "们", "價": "价", "眾": "众", "優": "优", "會": "会", "傘": "伞",
  "偉": "伟", "傳": "传", "傷": "伤", "倫": "伦", "偽": "伪", "體": "体", "餘": "余", "俠": "侠",
  "來": "来", "倆": "俩", "倉": "仓", "倖": "幸", "俁": "俣", "俔": "伣", "倀": "伥", "儂": "侬",
  "儘": "尽", "償": "偿", "儲": "储", "兒": "儿", "兌": "兑", "黨": "党", "蘭": "兰", "關": "关",
  "興": "兴", "養": "养", "獸": "兽", "內": "内", "岡": "冈", "冊": "册", "寫": "写", "軍": "军",
  "農": "农", "馮": "冯", "衝": "冲", "決": "决", "況": "况", "凍": "冻", "淨": "净", "涼": "凉",
  "減": "减", "湊": "凑", "幾": "几", "鳳": "凤", "憑": "凭", "凱": "凯", "劃": "划", "劉": "刘",
  "則": "则", "剛": "刚", "創": "创", "刪": "删", "別": "别", "剎": "刹", "劍": "剑", "劑": "剂",
  "勁": "劲", "動": "动", "務": "务", "勵": "励", "勞": "劳", "勢": "势", "勳": "勋", "匯": "汇",
  "區": "区", "醫": "医", "華": "华", "協": "协", "單": "单", "賣": "卖", "盧": "卢", "鹵": "卤",
  "衛": "卫", "卻": "却", "廠": "厂", "歷": "历", "壓": "压", "厭": "厌", "廈": "厦", "廚": "厨",
  "廂": "厢", "參": "参", "雙": "双", "發": "发", "變": "变", "疊": "叠", "葉": "叶", "號": "号",
  "嘆": "叹", "籲": "吁", "後": "后", "嚇": "吓", "呂": "吕", "嗎": "吗", "啟": "启", "吳": "吴",
  "員": "员", "聽": "听", "唄": "呗", "嗚": "呜", "詠": "咏", "嚨": "咙", "嚀": "咛", "噝": "咝",
  "鹹": "咸", "響": "响", "問": "问", "啞": "哑", "喚": "唤", "喪": "丧", "喬": "乔", "單": "单",
  "啣": "衔", "嘯": "啸", "嘍": "喽", "嘩": "哗", "噴": "喷", "嚐": "尝", "團": "团", "園": "园",
  "國": "国", "圖": "图", "圓": "圆", "聖": "圣", "場": "场", "壞": "坏", "塊": "块", "堅": "坚",
  "壇": "坛", "壢": "坜", "壩": "坝", "墳": "坟", "墜": "坠", "壘": "垒", "夢": "梦", "夾": "夹",
  "奪": "夺", "奮": "奋", "奧": "奥", "婦": "妇", "姍": "姗", "妝": "妆", "媽": "妈", "嫗": "妪",
  "嬌": "娇", "孃": "娘", "學": "学", "寧": "宁", "寶": "宝", "實": "实", "審": "审", "寫": "写",
  "寬": "宽", "將": "将", "專": "专", "尋": "寻", "對": "对", "導": "导", "壽": "寿", "屆": "届",
  "屬": "属", "岡": "冈", "島": "岛", "峽": "峡", "崗": "岗", "嶺": "岭", "嶽": "岳", "巔": "巅",
  "幣": "币", "帥": "帅", "師": "师", "帳": "帐", "帶": "带", "幀": "帧", "幫": "帮", "幹": "干",
  "庫": "库", "廢": "废", "廣": "广", "慶": "庆", "廬": "庐", "彎": "弯", "強": "强", "歸": "归",
  "當": "当", "錄": "录", "徵": "征", "德": "德", "徹": "彻", "憶": "忆", "懷": "怀", "態": "态",
  "總": "总", "恆": "恒", "戀": "恋", "恥": "耻", "惱": "恼", "惻": "恻", "愛": "爱", "愜": "惬",
  "愷": "恺", "愴": "怆", "慍": "愠", "慣": "惯", "慘": "惨", "慮": "虑", "慾": "欲", "憂": "忧",
  "憐": "怜", "憫": "悯", "憲": "宪", "懇": "恳", "應": "应", "懲": "惩", "懶": "懒", "懷": "怀",
  "戇": "戆", "戶": "户", "拋": "抛", "擔": "担", "據": "据", "擇": "择", "撫": "抚", "撥": "拨",
  "撈": "捞", "撐": "撑", "撲": "扑", "撻": "挞", "擋": "挡", "擁": "拥", "擰": "拧", "擴": "扩",
  "攝": "摄", "攜": "携", "攔": "拦", "攙": "搀", "攪": "搅", "攬": "揽", "敗": "败", "敘": "叙",
  "敵": "敌", "數": "数", "斂": "敛", "斃": "毙", "斕": "斓", "鬥": "斗", "斬": "斩", "時": "时",
  "晝": "昼", "暈": "晕", "曉": "晓", "曆": "历", "曇": "昙", "曖": "暧", "曜": "曜", "會": "会",
  "朧": "胧", "東": "东", "枴": "拐", "柵": "栅", "標": "标", "樣": "样", "樹": "树", "橋": "桥",
  "機": "机", "橫": "横", "檔": "档", "檢": "检", "櫃": "柜", "櫥": "橱", "權": "权", "歡": "欢",
  "歲": "岁", "歷": "历", "歸": "归", "殘": "残", "毆": "殴", "毀": "毁", "氣": "气", "氫": "氢",
  "漢": "汉", "湯": "汤", "潔": "洁", "濃": "浓", "濟": "济", "濤": "涛", "濫": "滥", "濱": "滨",
  "瀏": "浏", "瀨": "濑", "灣": "湾", "滬": "沪", "滯": "滞", "滲": "渗", "漁": "渔", "潛": "潜",
  "潤": "润", "澤": "泽", "澀": "涩", "澆": "浇", "澗": "涧", "澠": "渑", "澩": "泶", "瀆": "渎",
  "燈": "灯", "爐": "炉", "爛": "烂", "爭": "争", "爺": "爷", "牆": "墙", "獄": "狱", "獲": "获",
  "獸": "兽", "獻": "献", "瑪": "玛", "瑩": "莹", "璣": "玑", "環": "环", "璽": "玺", "甌": "瓯",
  "畫": "画", "當": "当", "瘋": "疯", "癡": "痴", "癢": "痒", "癩": "癞", "發": "发", "皺": "皱",
  "盜": "盗", "盞": "盏", "監": "监", "盤": "盘", "盧": "卢", "眾": "众", "睜": "睁", "瞇": "眯",
  "瞞": "瞒", "矚": "瞩", "礙": "碍", "確": "确", "碼": "码", "禮": "礼", "禱": "祷", "禪": "禅",
  "離": "离", "稅": "税", "穀": "谷", "穩": "稳", "竄": "窜", "竅": "窍", "窩": "窝", "窪": "洼",
  "競": "竞", "筆": "笔", "築": "筑", "簡": "简", "籠": "笼", "類": "类", "糧": "粮", "糞": "粪",
  "糾": "纠", "紀": "纪", "紂": "纣", "約": "约", "紅": "红", "紋": "纹", "納": "纳", "紐": "纽",
  "純": "纯", "紗": "纱", "紛": "纷", "紙": "纸", "級": "级", "紮": "扎", "細": "细", "紳": "绅",
  "紹": "绍", "紺": "绀", "終": "终", "組": "组", "絆": "绊", "結": "结", "絕": "绝", "絞": "绞",
  "絡": "络", "給": "给", "統": "统", "絹": "绢", "綁": "绑", "綏": "绥", "經": "经", "綜": "综",
  "綠": "绿", "綢": "绸", "綣": "绻", "綫": "线", "維": "维", "綱": "纲", "網": "网", "綴": "缀",
  "緊": "紧", "緒": "绪", "緞": "缎", "緣": "缘", "編": "编", "緩": "缓", "緬": "缅", "緯": "纬",
  "練": "练", "緻": "致", "縣": "县", "縱": "纵", "縫": "缝", "縮": "缩", "總": "总", "績": "绩",
  "織": "织", "繞": "绕", "繡": "绣", "繩": "绳", "繪": "绘", "繫": "系", "續": "续", "纏": "缠",
  "纖": "纤", "缽": "钵", "罈": "坛", "羅": "罗", "羆": "罴", "翹": "翘", "翻": "翻", "職": "职",
  "聖": "圣", "聞": "闻", "聯": "联", "聰": "聪", "聲": "声", "肅": "肃", "脅": "胁", "脈": "脉",
  "臉": "脸", "臍": "脐", "臘": "腊", "臨": "临", "與": "与", "興": "兴", "舊": "旧", "艙": "舱",
  "艦": "舰", "藝": "艺", "節": "节", "莖": "茎", "莊": "庄", "華": "华", "萬": "万", "萊": "莱",
  "葉": "叶", "著": "着", "葷": "荤", "蒞": "莅", "蒼": "苍", "蓋": "盖", "蓮": "莲", "蔣": "蒋",
  "蔥": "葱", "蕭": "萧", "薑": "姜", "藍": "蓝", "藥": "药", "蘇": "苏", "蘋": "苹", "虛": "虚",
  "號": "号", "蠟": "蜡", "蠶": "蚕", "衆": "众", "衝": "冲", "補": "补", "裝": "装", "裡": "里",
  "製": "制", "複": "复", "褲": "裤", "襖": "袄", "覺": "觉", "覽": "览", "觀": "观", "規": "规",
  "視": "视", "覓": "觅", "觸": "触", "訃": "讣", "計": "计", "訂": "订", "訌": "讧", "討": "讨",
  "訓": "训", "訖": "讫", "託": "托", "記": "记", "訛": "讹", "訝": "讶", "訟": "讼", "訣": "诀",
  "訪": "访", "設": "设", "許": "许", "訴": "诉", "診": "诊", "詁": "诂", "詆": "诋", "詐": "诈",
  "詔": "诏", "評": "评", "詛": "诅", "詞": "词", "詠": "咏", "詢": "询", "試": "试", "詩": "诗",
  "詫": "诧", "詮": "诠", "該": "该", "詳": "详", "誇": "夸", "譽": "誉", "誠": "诚", "誤": "误",
  "說": "说", "讀": "读", "課": "课", "誰": "谁", "調": "调", "談": "谈", "請": "请", "諸": "诸",
  "諾": "诺", "謀": "谋", "謂": "谓", "謝": "谢", "謠": "谣", "謹": "谨", "譜": "谱", "議": "议",
  "譯": "译", "護": "护", "譽": "誉", "讀": "读", "變": "变", "豔": "艳", "豬": "猪", "貝": "贝",
  "貞": "贞", "負": "负", "貢": "贡", "財": "财", "責": "责", "貧": "贫", "貨": "货", "販": "贩",
  "貪": "贪", "貫": "贯", "貼": "贴", "貴": "贵", "貸": "贷", "費": "费", "賀": "贺", "資": "资",
  "賈": "贾", "賃": "赁", "賄": "贿", "賊": "贼", "賓": "宾", "賑": "赈", "賒": "赊", "賠": "赔",
  "賞": "赏", "賦": "赋", "賭": "赌", "賴": "赖", "賺": "赚", "購": "购", "賽": "赛", "贈": "赠",
  "贊": "赞", "贏": "赢", "趕": "赶", "趙": "赵", "跡": "迹", "踐": "践", "車": "车", "軋": "轧",
  "軌": "轨", "軍": "军", "軒": "轩", "軟": "软", "轉": "转", "輪": "轮", "輯": "辑", "輸": "输",
  "轄": "辖", "辭": "辞", "辯": "辩", "農": "农", "這": "这", "連": "连", "進": "进", "遠": "远",
  "違": "违", "遙": "遥", "遞": "递", "遷": "迁", "選": "选", "遺": "遗", "鄭": "郑", "鄰": "邻",
  "醜": "丑", "醫": "医", "釀": "酿", "釋": "释", "裏": "里", "鈔": "钞", "鐘": "钟", "鋼": "钢",
  "錄": "录", "錢": "钱", "鍋": "锅", "鎖": "锁", "鎮": "镇", "鏡": "镜", "鐵": "铁", "鑄": "铸",
  "鑑": "鉴", "長": "长", "門": "门", "開": "开", "閃": "闪", "閉": "闭", "問": "问", "間": "间",
  "閒": "闲", "閣": "阁", "閱": "阅", "關": "关", "闆": "板", "陣": "阵", "陰": "阴", "陳": "陈",
  "際": "际", "隨": "随", "險": "险", "隱": "隐", "隻": "只", "雜": "杂", "難": "难", "雙": "双",
  "雞": "鸡", "離": "离", "雲": "云", "電": "电", "靜": "静", "非": "非", "靠": "靠", "響": "响",
  "頁": "页", "頂": "顶", "頃": "顷", "項": "项", "順": "顺", "須": "须", "頑": "顽", "頓": "顿",
  "頗": "颇", "領": "领", "頸": "颈", "頻": "频", "題": "题", "額": "额", "顏": "颜", "顯": "显",
  "風": "风", "飛": "飞", "飯": "饭", "飲": "饮", "飼": "饲", "館": "馆", "驅": "驱", "驗": "验",
  "驚": "惊", "髮": "发", "鬆": "松", "魯": "鲁", "鮮": "鲜", "鳥": "鸟", "鳴": "鸣", "鴨": "鸭",
  "鹽": "盐", "麥": "麦", "黃": "黄", "點": "点", "黨": "党", "齊": "齐", "齒": "齿", "龍": "龙"
};

function convertTraditionalToSimplified(text) {
  let converted = text;

  Object.keys(TRADITIONAL_PHRASE_MAP).forEach((trad) => {
    converted = converted.split(trad).join(TRADITIONAL_PHRASE_MAP[trad]);
  });

  const mapValues = new Set(Object.values(TRADITIONAL_CHAR_MAP));
  let unresolvedChars = [];
  let replacedByDashChars = [];
  const chars = [...converted].map((ch) => {
    if (TRADITIONAL_CHAR_MAP[ch]) return TRADITIONAL_CHAR_MAP[ch];

    const cp = ch.codePointAt(0);
    const isPua = (cp >= 0xE000 && cp <= 0xF8FF) || (cp >= 0xF0000 && cp <= 0xFFFFD) || (cp >= 0x100000 && cp <= 0x10FFFD);
    if (isPua) unresolvedChars.push(ch);

    const isCjkUnified = (cp >= 0x3400 && cp <= 0x4DBF) || (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0xF900 && cp <= 0xFAFF);
    if (isCjkUnified && !mapValues.has(ch)) {
      replacedByDashChars.push(ch);
      return "-";
    }

    return ch;
  });

  return {
    text: chars.join(""),
    unresolvedChars: [...new Set(unresolvedChars)],
    replacedByDashChars: [...new Set(replacedByDashChars)]
  };
}

function setUnicodeHint(message) {
  if (!el.unicodeHint) return;
  el.unicodeHint.textContent = message || "仅 char 标签显示 unicode 码";
}

function isCharTagAnno(anno) {
  if (!anno) return false;
  const tagName = (anno.tagName || "").trim().toLowerCase();
  if (tagName === "char") return true;
  const path = (anno.tagPath || "").trim().toLowerCase();
  if (!path) return false;
  const parts = path.split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] === "char";
}

function syncCharAnnoCodepointFromRegistry(anno) {
  if (!isCharTagAnno(anno)) return;
  anno.attrs = anno.attrs || {};

  const byAnnoId = state.glyphRegistry.find((item) => String(item.annoId || "") === String(anno.id || ""));
  let target = byAnnoId || null;

  if (!target) {
    const glyphFromAnno = singleCharForGlyphLookup(anno.attrs?.glyphChar || anno.transcription || "");
    if (glyphFromAnno) {
      target = state.glyphRegistry.find((item) => singleCharForGlyphLookup(item.glyphChar || "") === glyphFromAnno) || null;
    }
  }

  if (!target?.codepoint) return;
  const normalized = normalizeCodepointInput(target.codepoint) || String(target.codepoint).trim().toUpperCase();
  if (normalized && anno.attrs.codepoint !== normalized) {
    anno.attrs.codepoint = normalized;
  }
}

function renderMainPanelTabs() {
  const active = state.activeMainPanel === "glyph" ? "glyph" : "edit";
  state.activeMainPanel = active;
  if (!el.mainPanelBtnEdit || !el.mainPanelBtnGlyph) return;

  el.mainPanelBtnEdit.classList.toggle("active", active === "edit");
  el.mainPanelBtnGlyph.classList.toggle("active", active === "glyph");
  if (el.sectionEditWorkspace) el.sectionEditWorkspace.classList.toggle("active", active === "edit");
  if (el.sectionGlyphWorkspace) el.sectionGlyphWorkspace.classList.toggle("active", active === "glyph");
}

function renderGlyphPanel() {
  if (!el.glyphCreateHint || !el.glyphRecentList) return;
  const viewerOnlyRecent = getCurrentBookRole() === "viewer";

  if (viewerOnlyRecent) {
    state.glyphCreateActive = false;
    state.glyphDraft = null;
  }

  const toggleHidden = (node, hidden) => {
    if (node) node.classList.toggle("hidden", hidden);
  };

  toggleHidden(el.glyphRuleBtn, viewerOnlyRecent);
  toggleHidden(el.glyphCapturedPreview, viewerOnlyRecent);
  toggleHidden(el.glyphReselectBtn?.closest(".glyph-captured-head"), viewerOnlyRecent);
  toggleHidden(el.glyphCharInput?.closest("label"), viewerOnlyRecent);
  toggleHidden(el.glyphManualCodepointInput?.closest("label"), viewerOnlyRecent);
  toggleHidden(el.glyphIdsInput?.closest("label"), viewerOnlyRecent);
  toggleHidden(el.glyphNoteInput?.closest("label"), viewerOnlyRecent);
  toggleHidden(el.glyphAutoSuggestBtn, viewerOnlyRecent);
  toggleHidden(el.glyphStartCreateBtn?.closest(".row-actions"), viewerOnlyRecent);
  toggleHidden(el.glyphCreateHint, viewerOnlyRecent);

  el.glyphCreateHint.textContent = state.glyphCreateActive
    ? "造字模式已开启：请在中间图片上拖拽框选"
    : (state.glyphDraft ? "已框选字图，请分配并保存造字" : "未进入造字框选模式");

  if (el.glyphStartCreateBtn) {
    el.glyphStartCreateBtn.textContent = state.glyphCreateActive ? "造字中" : "开始造字";
  }

  if (el.glyphCapturedPreview) {
    if (state.glyphDraft?.previewDataUrl) {
      el.glyphCapturedPreview.src = state.glyphDraft.previewDataUrl;
      el.glyphCapturedPreview.style.display = "block";
    } else {
      el.glyphCapturedPreview.removeAttribute("src");
      el.glyphCapturedPreview.style.display = "none";
    }
  }

  el.glyphRecentList.innerHTML = "";
  const ul = document.createElement("ul");
  const recent = state.glyphRegistry.slice(0, 8);
  if (recent.length === 0) {
    const li = document.createElement("li");
    li.textContent = "暂无造字记录";
    ul.appendChild(li);
  } else {
    recent.forEach((item, idx) => {
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "inline-action-row";
      const text = document.createElement("span");
      text.textContent = `${glyphDisplayText(item)} -> ${item.codepoint} [${glyphCollectedLabel(item)}] (${item.imageName})`;
      row.appendChild(text);
      if (!viewerOnlyRecent) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mini-btn";
        btn.textContent = item.collected ? "更新官方码" : "标记已收录";
        btn.addEventListener("click", () => {
          markGlyphAsCollectedByIndex(idx);
        });
        row.appendChild(btn);
      }
      li.appendChild(row);
      ul.appendChild(li);
    });
  }
  el.glyphRecentList.appendChild(ul);
}

function renderRightPanelTabs() {
  const canUseDrawPanel = getCurrentBookRole() !== "viewer";
  const allowedPanels = canUseDrawPanel ? ["object", "draw", "tags"] : ["object", "tags"];
  const active = allowedPanels.includes(state.activeRightPanel) ? state.activeRightPanel : "object";
  state.activeRightPanel = active;

  if (el.panelSwitcher) {
    el.panelSwitcher.classList.toggle("viewer-two-tabs", !canUseDrawPanel);
  }

  el.panelBtnObject.classList.toggle("active", active === "object");
  el.panelBtnDraw.classList.toggle("hidden", !canUseDrawPanel);
  el.panelBtnDraw.classList.toggle("active", active === "draw");
  el.panelBtnTags.classList.toggle("active", active === "tags");

  el.sectionProps.classList.toggle("active", active === "object");
  el.sectionDraw.classList.toggle("hidden", !canUseDrawPanel);
  el.sectionDraw.classList.toggle("active", active === "draw");
  el.sectionTags.classList.toggle("active", active === "tags");

}

function syncDrawLayerSize() {
  const w = el.mainImage.clientWidth || 0;
  const h = el.mainImage.clientHeight || 0;
  el.drawLayer.style.width = `${w}px`;
  el.drawLayer.style.height = `${h}px`;
  if (el.presenceLayer) {
    el.presenceLayer.style.width = `${w}px`;
    el.presenceLayer.style.height = `${h}px`;
  }
  renderPresenceLayer();
}

function templateDepth(tagId) {
  let depth = 0;
  let cursor = findTemplateTag(tagId);
  while (cursor) {
    depth += 1;
    cursor = cursor.parentId ? findTemplateTag(cursor.parentId) : null;
  }
  return depth;
}

function supportsMeaningAttrByTagId(tagId) {
  return templateDepth(tagId) >= 3;
}

function setObjectTextFieldsVisible(visible) {
  if (el.propNoteRow) el.propNoteRow.classList.toggle("hidden", !visible);
  if (el.propMeaningRow) el.propMeaningRow.classList.toggle("hidden", !visible);
}

function setDrawTextFieldsVisible(visible) {
  if (el.annoTranscriptionRow) el.annoTranscriptionRow.classList.toggle("hidden", !visible);
  if (el.annoMeaningRow) el.annoMeaningRow.classList.toggle("hidden", !visible);
  if (!visible) {
    if (el.annoTranscription) el.annoTranscription.value = "";
    if (el.annoMeaning) el.annoMeaning.value = "";
  }
}

function drawTextFieldsEnabled() {
  const tag = findTemplateTag(state.activeDraftTagId);
  if (!tag) return false;
  return supportsMeaningAttrByTagId(tag.id);
}

function pointInRect(rect, x, y) {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

function rectsOverlap(a, b, eps = 0.00001) {
  return (
    a.x < b.x + b.w - eps &&
    a.x + a.w > b.x + eps &&
    a.y < b.y + b.h - eps &&
    a.y + a.h > b.y + eps
  );
}

function hasSignificantOverlap(a, b) {
  if (!rectsOverlap(a, b)) return false;
  const inter = rectIntersectionArea(a, b);
  const minArea = Math.max(0.000001, Math.min(a.w * a.h, b.w * b.h));
  const overlapRatio = inter / minArea;
  // Allow tiny edge-touch and minor hand-drawn crossing; block meaningful overlap only.
  return overlapRatio >= 0.12;
}

function hasSameTagOverlapInAnnotations(img, tagId, rect, selfAnnoId = null) {
  return (img.annotations || []).some((anno) => {
    if (anno.id === selfAnnoId) return false;
    if (anno.tagId !== tagId) return false;
    return hasSignificantOverlap(anno.rect, rect);
  });
}

function hasSameTagOverlapInDrafts(drafts, tagId, rect) {
  return (drafts || []).some((draft) => {
    if (draft.tagId !== tagId) return false;
    return hasSignificantOverlap(draft.rect, rect);
  });
}

function validatePendingDraftsNoSameTagOverlap(img, drafts) {
  for (let i = 0; i < drafts.length; i += 1) {
    const draft = drafts[i];
    if (hasSameTagOverlapInAnnotations(img, draft.tagId, draft.rect, null)) {
      return { ok: false, message: `标签 ${draft.tagName || draft.tagId} 与已有同类型方框重叠` };
    }
    for (let j = i + 1; j < drafts.length; j += 1) {
      const other = drafts[j];
      if (draft.tagId === other.tagId && hasSignificantOverlap(draft.rect, other.rect)) {
        return { ok: false, message: `待保存框中存在同类型重叠：${draft.tagName || draft.tagId}` };
      }
    }
  }
  return { ok: true, message: "" };
}

function appendDraftsToAnnotations(img, drafts, options = {}) {
  const defaultTranscription = String(options.defaultTranscription || "").trim();
  const defaultMeaning = String(options.defaultMeaning || "").trim();
  const preferDraftText = options.preferDraftText !== false;
  let lastAnnoId = null;

  (drafts || []).forEach((draftItem) => {
    const attrs = {};
    const draftMeaning = String(draftItem?.meaning || "").trim();
    const textToUse = preferDraftText
      ? String(draftItem?.transcription || draftItem?.text || defaultTranscription || "").trim()
      : defaultTranscription;
    const meaningToUse = preferDraftText ? (draftMeaning || defaultMeaning) : defaultMeaning;
    if (meaningToUse) attrs.meaning = meaningToUse;

    const anno = {
      id: uid("anno"),
      tagId: draftItem.tagId,
      tagName: draftItem.tagName,
      tagPath: draftItem.tagPath,
      shape: normalizeAnnoShape(draftItem.shape),
      color: draftItem.color,
      borderStyle: normalizeAnnoBorderStyle(draftItem.borderStyle || "solid"),
      borderWidth: normalizeAnnoBorderWidth(draftItem.borderWidth || 2),
      transcription: textToUse,
      rect: { ...draftItem.rect },
      attrs,
      parentAnnoId: null
    };
    const idValue = (anno.attrs.id || "").trim();
    anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);
    img.annotations.push(anno);
    lastAnnoId = anno.id;
  });

  return { lastAnnoId };
}

function rectIntersectionArea(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  const w = Math.max(0, right - left);
  const h = Math.max(0, bottom - top);
  return w * h;
}

function getCoveredAnnoIds(img, selfAnnoId, rect) {
  const others = (img.annotations || []).filter((it) => it.id !== selfAnnoId);
  const charOthers = others.filter((it) => isCharTagAnno(it));
  const pool = charOthers.length > 0 ? charOthers : others;
  const ids = new Set();
  pool.forEach((anno) => {
    const overlapArea = rectIntersectionArea(rect, anno.rect);
    const minArea = Math.min(Math.max(0.000001, rect.w * rect.h), Math.max(0.000001, anno.rect.w * anno.rect.h));
    const overlapRatio = overlapArea / minArea;
    if (overlapArea > 0.00005 && overlapRatio >= 0.15) {
      ids.add(anno.id);
    }
  });
  return ids;
}

function notifyNewCoveredAnnos(beforeIds, afterIds) {
  const added = Array.from(afterIds).filter((id) => !beforeIds.has(id));
  if (added.length === 0) return;
  alert(`提醒：当前框范围内检测到 ${added.length} 个新增字，请确认是否需要拆分或新增标注。`);
}

function annoArea(anno) {
  return Math.max(0.000001, anno.rect.w * anno.rect.h);
}

function normalizeAnnoRectForShape(rect, shape) {
  const base = {
    x: clamp01(rect.x),
    y: clamp01(rect.y),
    w: Math.min(1, Math.max(0.003, rect.w)),
    h: Math.min(1, Math.max(0.003, rect.h))
  };
  if (base.x + base.w > 1) base.x = 1 - base.w;
  if (base.y + base.h > 1) base.y = 1 - base.h;
  return toShapeRect(base, shape);
}

function findAnnoById(img, annoId) {
  return img.annotations.find((anno) => anno.id === annoId) || null;
}

function getTagStyle(tag) {
  if (!tag?.style) return null;
  return {
    shape: normalizeAnnoShape(tag.style.shape),
    color: tag.style.color || "#2e6f86",
    borderStyle: normalizeAnnoBorderStyle(tag.style.borderStyle || "solid"),
    borderWidth: normalizeAnnoBorderWidth(tag.style.borderWidth || 2)
  };
}

function syncStyleToTag(tagId, shapeOrBorderStyle, color, borderWidth) {
  const tag = findTemplateTag(tagId);
  if (!tag) return;
  const nextShape = normalizeAnnoShape(shapeOrBorderStyle);
  const nextBorderStyle = normalizeAnnoBorderStyle(shapeOrBorderStyle);
  const fallbackWidth = normalizeAnnoBorderWidth(tag.style?.borderWidth || 2);
  const nextBorderWidth = normalizeAnnoBorderWidth(borderWidth == null ? fallbackWidth : borderWidth);
  tag.style = { shape: nextShape, color, borderStyle: nextBorderStyle, borderWidth: nextBorderWidth };
  state.images.forEach((img) => {
    img.annotations.forEach((anno) => {
      if (anno.tagId === tagId) {
        anno.shape = nextShape;
        anno.color = color;
        anno.borderStyle = nextBorderStyle;
        anno.borderWidth = nextBorderWidth;
      }
    });
  });
}

function syncStyleForSameTagAnnos(sourceAnno, shapeOrBorderStyle, color, borderWidth) {
  if (!sourceAnno) return;
  const nextShape = normalizeAnnoShape(shapeOrBorderStyle);
  const nextBorderStyle = normalizeAnnoBorderStyle(shapeOrBorderStyle);
  const nextBorderWidth = normalizeAnnoBorderWidth(borderWidth == null ? sourceAnno.borderWidth || 2 : borderWidth);
  const nextColor = String(color || "#2e6f86");

  const sourceTagId = String(sourceAnno.tagId || "").trim();
  const sourceTagPath = String(sourceAnno.tagPath || "").trim();
  const sourceTagName = String(sourceAnno.tagName || "").trim();
  const sourceAnnoId = String(sourceAnno.id || "").trim();

  const isSameTag = (anno) => {
    const annoTagId = String(anno?.tagId || "").trim();
    const annoTagPath = String(anno?.tagPath || "").trim();
    const annoTagName = String(anno?.tagName || "").trim();
    const annoId = String(anno?.id || "").trim();
    if (sourceTagId) return annoTagId === sourceTagId;
    if (sourceTagPath) return annoTagPath === sourceTagPath;
    if (sourceTagName) return annoTagName === sourceTagName;
    return sourceAnnoId ? annoId === sourceAnnoId : false;
  };

  state.images.forEach((img) => {
    (img.annotations || []).forEach((anno) => {
      if (!isSameTag(anno)) return;
      anno.shape = nextShape;
      anno.color = nextColor;
      anno.borderStyle = nextBorderStyle;
      anno.borderWidth = nextBorderWidth;
    });
  });

  if (sourceTagId) {
    syncStyleToTag(sourceTagId, shapeOrBorderStyle, nextColor, nextBorderWidth);
  }
}

function syncPickerFromActiveTag() {
  const tag = findTemplateTag(state.activeDraftTagId);
  if (!tag) {
    renderColorPreview(null);
    return;
  }
  const style = getTagStyle(tag);
  if (!style) {
    renderColorPreview(null);
    return;
  }
  if (el.annoShapeSelect) {
    el.annoShapeSelect.value = normalizeAnnoBorderStyle(style.borderStyle || "solid");
  }
  el.annoColor.value = style.color;
  renderColorPreview(style.color);
}

function renderColorPreview(colorValue) {
  if (!el.annoColorPreview) return;
  el.annoColorPreview.textContent = "改变颜色";
  if (!colorValue) {
    el.annoColorPreview.style.background = "#9b9488";
    if (el.annoColorHint) el.annoColorHint.textContent = "请选择颜色";
    return;
  }
  const val = colorValue.toLowerCase();
  el.annoColorPreview.style.background = val;
  if (el.annoColorHint) el.annoColorHint.textContent = `当前颜色: ${val}`;
}

function getParentMap(img) {
  const parentMap = new Map();
  img.annotations.forEach((anno) => parentMap.set(anno.id, null));

  img.annotations.forEach((anno, index) => {
    const idValue = (anno.attrs?.id || "").trim();
    if (idValue) {
      const previousSameId = img.annotations
        .slice(0, index)
        .filter((it) => (it.attrs?.id || "").trim() === idValue);
      if (previousSameId.length > 0) {
        parentMap.set(anno.id, previousSameId[previousSameId.length - 1].id);
      }
      return;
    }

    const containing = img.annotations
      .filter((it) => it.id !== anno.id && containsRect(it.rect, anno.rect))
      .sort((a, b) => (a.rect.w * a.rect.h) - (b.rect.w * b.rect.h));
    if (containing.length > 0) parentMap.set(anno.id, containing[0].id);
  });

  return parentMap;
}

function pickTopAnnoAtPoint(img, x, y) {
  const hits = img.annotations.filter((anno) => pointInRect(anno.rect, x, y));
  if (hits.length === 0) return null;

  const parentMap = getParentMap(img);
  const hierarchyDepth = new Map();
  function depthForAnnoId(annoId) {
    if (!annoId) return 0;
    if (hierarchyDepth.has(annoId)) return hierarchyDepth.get(annoId);
    let depth = 1;
    let cursor = parentMap.get(annoId);
    const guard = new Set([annoId]);
    while (cursor && !guard.has(cursor)) {
      guard.add(cursor);
      depth += 1;
      cursor = parentMap.get(cursor);
    }
    hierarchyDepth.set(annoId, depth);
    return depth;
  }

  hits.sort((a, b) => {
    const annoDepthDiff = depthForAnnoId(b.id) - depthForAnnoId(a.id);
    if (annoDepthDiff !== 0) return annoDepthDiff;
    const depthDiff = templateDepth(b.tagId) - templateDepth(a.tagId);
    if (depthDiff !== 0) return depthDiff;
    return annoArea(a) - annoArea(b);
  });
  return hits[0];
}

function createUploadedImageItem(name, src) {
  return {
    id: uid("upload"),
    name,
    src,
    category: "用户上传",
    contentElement: "page",
    contentKind: "图片",
    meta: { id: uid("img") },
    annotations: []
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function stripFileExt(name) {
  const raw = String(name || "").trim();
  const idx = raw.lastIndexOf(".");
  return idx > 0 ? raw.slice(0, idx) : raw;
}

async function importImageFile(file) {
  const src = await readFileAsDataUrl(file);
  const img = createUploadedImageItem(file.name, src);
  state.images.push(img);
  state.selectedImageId = img.id;
}

async function buildPdfImageItems(file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib || typeof pdfjsLib.getDocument !== "function") {
    throw new Error("PDF 解析库未加载，请检查网络后重试");
  }

  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const baseName = stripFileExt(file.name) || "pdf";
  const items = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const src = canvas.toDataURL("image/png");
    const name = `${baseName}_p${String(pageNo).padStart(3, "0")}.png`;
    items.push(createUploadedImageItem(name, src));
  }
  return items;
}

async function importPdfFile(file) {
  const items = await buildPdfImageItems(file);
  const createdIds = [];
  items.forEach((img) => {
    state.images.push(img);
    createdIds.push(img.id);
  });

  if (createdIds.length > 0) {
    state.selectedImageId = createdIds[0];
    alert(`PDF 导入完成，共 ${createdIds.length} 页`);
  }
}

function parseImportedXmlProject(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parseErr = doc.querySelector("parsererror");
  if (parseErr) {
    throw new Error("XML 解析失败，请检查文件格式");
  }

  const project = doc.querySelector("gujiProject");
  if (!project) throw new Error("不是可识别的导出 XML 文件");

  const template = [];
  const templateRoot = project.querySelector("template");
  function walkTag(tagNode, parentId = null) {
    const id = tagNode.getAttribute("id") || uid("tag");
    const name = tagNode.getAttribute("name") || "tag";
    const order = Number(tagNode.getAttribute("order") || "0") || 0;
    const attrs = String(tagNode.getAttribute("attrs") || "").split(",").map((x) => x.trim()).filter(Boolean);
    const shape = String(tagNode.getAttribute("shape") || "").trim();
    const color = String(tagNode.getAttribute("color") || "").trim();
    const item = { id, name, parentId, attrs, order };
    if (shape || color) item.style = { shape: normalizeAnnoShape(shape), color: color || "#2e6f86" };
    template.push(item);
    Array.from(tagNode.children).filter((n) => n.tagName === "tag").forEach((child) => walkTag(child, id));
  }
  if (templateRoot) {
    Array.from(templateRoot.children).filter((n) => n.tagName === "tag").forEach((node) => walkTag(node, null));
  }

  const images = [];
  const imageNodes = Array.from(project.querySelectorAll("images > image"));
  imageNodes.forEach((node, idx) => {
    const image = {
      id: node.getAttribute("id") || uid("img"),
      name: node.getAttribute("name") || `image_${idx + 1}`,
      src: node.getAttribute("src") || "",
      category: node.getAttribute("category") || "导入XML",
      contentElement: node.getAttribute("contentElement") || "page",
      contentKind: node.getAttribute("contentKind") || "图片",
      meta: {},
      annotations: []
    };
    node.querySelectorAll("meta > field").forEach((f) => {
      const key = f.getAttribute("name");
      const value = f.getAttribute("value") || "";
      if (key) image.meta[key] = value;
    });
    node.querySelectorAll("annotations > annotation").forEach((a) => {
      const rectNode = a.querySelector("rect");
      const anno = {
        id: a.getAttribute("id") || uid("anno"),
        tagId: a.getAttribute("tagId") || "",
        tagName: a.getAttribute("tagName") || "",
        tagPath: a.getAttribute("tagPath") || "",
        shape: normalizeAnnoShape(a.getAttribute("shape") || "rect"),
        color: a.getAttribute("color") || "#2e6f86",
        borderStyle: normalizeAnnoBorderStyle(a.getAttribute("borderStyle") || "solid"),
        borderWidth: normalizeAnnoBorderWidth(a.getAttribute("borderWidth") || "2"),
        transcription: a.querySelector("transcription")?.textContent || "",
        rect: {
          x: Number(rectNode?.getAttribute("x") || 0),
          y: Number(rectNode?.getAttribute("y") || 0),
          w: Number(rectNode?.getAttribute("w") || 0),
          h: Number(rectNode?.getAttribute("h") || 0)
        },
        attrs: {},
        parentAnnoId: a.getAttribute("parentAnnoId") || null
      };
      a.querySelectorAll("attrs > attr").forEach((attrNode) => {
        const key = attrNode.getAttribute("key");
        const value = attrNode.getAttribute("value") || "";
        if (key) anno.attrs[key] = value;
      });
      image.annotations.push(anno);
    });
    images.push(image);
  });

  const glyphRegistry = Array.from(project.querySelectorAll("glyphRegistry > glyph")).map((g) => normalizeGlyphRegistryItem({
    id: g.getAttribute("id") || uid("glyph"),
    glyphChar: g.getAttribute("glyphChar") || "",
    codepoint: g.getAttribute("codepoint") || "",
    officialCodepoint: g.getAttribute("officialCodepoint") || "",
    collected: g.getAttribute("collected") === "true",
    collectedAt: g.getAttribute("collectedAt") || "",
    imageId: g.getAttribute("imageId") || "",
    imageName: g.getAttribute("imageName") || "",
    annoId: g.getAttribute("annoId") || "",
    previewDataUrl: g.getAttribute("previewDataUrl") || "",
    createdAt: g.getAttribute("createdAt") || ""
  }));

  return {
    images,
    templateTags: template.length > 0 ? template : templateDefaults.map((tag, i) => ({ ...tag, order: i + 1 })),
    selectedImageId: images[0]?.id || null,
    selectedTemplateTagId: (template[0]?.id || templateDefaults[0]?.id || null),
    activeMainPanel: "edit",
    activeRightPanel: "object",
    glyphRegistry
  };
}

async function createBookFromImportedFile(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  const isXml = file.type.includes("xml") || /\.xml$/i.test(file.name || "");
  let data;
  if (isXml) {
    const text = await file.text();
    data = parseImportedXmlProject(text);
    try {
      const hint = extractXmlHintFromText(text, file.name || "import.xml");
      data.aiLayoutHints = normalizeAiLayoutHints({ examples: [hint], updatedAt: new Date().toISOString() });
    } catch (_) {
      // Ignore hint parse failure; XML import itself may still be valid for project data.
    }
  } else if (isPdf) {
    const images = await buildPdfImageItems(file);
    data = createDefaultBookData();
    data.images = images;
    data.selectedImageId = images[0]?.id || null;
  } else {
    const src = await readFileAsDataUrl(file);
    const image = createUploadedImageItem(file.name, src);
    data = createDefaultBookData();
    data.images = [image];
    data.selectedImageId = image.id;
  }
  const bookName = stripFileExt(file.name) || `新建书籍_${Date.now()}`;
  const id = await createBookRecord(bookName, data);
  renderBooksList();
  await openBookById(id);
}

async function importSelectedFile(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
  if (isPdf) {
    await importPdfFile(file);
  } else {
    await importImageFile(file);
  }
  state.selectedAnnoId = null;
  state.selectedTagFilterName = "";
  state.renamingImage = false;
  renderAll();
  saveState();
}

function collectCurrentBookData() {
  return {
    images: state.images,
    templateTags: state.templateTags,
    selectedImageId: state.selectedImageId,
    selectedTemplateTagId: state.selectedTemplateTagId,
    activeMainPanel: state.activeMainPanel,
    activeRightPanel: state.activeRightPanel,
    glyphRegistry: state.glyphRegistry,
    aiLayoutHints: normalizeAiLayoutHints(state.aiLayoutHints),
    reviewData: normalizeReviewData(state.reviewData)
  };
}

function applyBookData(parsed) {
  const rawSubmissions = Array.isArray(parsed?.reviewData?.submissions) ? parsed.reviewData.submissions : [];
  const rawLegacyCount = countLegacySubmissionsWithoutFullSnapshot(rawSubmissions);
  state.versionPreview = {
    active: false,
    versionId: "",
    versionNo: 0,
    showDiffOnly: true,
    diffByImage: {},
    targetByImage: {},
    baseByImage: {}
  };
  state.images = Array.isArray(parsed.images) ? parsed.images : [];
  state.templateTags = (Array.isArray(parsed.templateTags) && parsed.templateTags.length > 0)
    ? parsed.templateTags
    : templateDefaults.map((tag, idx) => ({ ...tag, order: idx + 1 }));
  state.selectedImageId = parsed.selectedImageId || state.images[0]?.id || null;
  state.selectedTemplateTagId = parsed.selectedTemplateTagId || state.templateTags[0]?.id || null;
  state.activeMainPanel = parsed.activeMainPanel || "edit";
  state.activeRightPanel = parsed.activeRightPanel || "object";
  state.glyphRegistry = Array.isArray(parsed.glyphRegistry)
    ? parsed.glyphRegistry.map((item) => normalizeGlyphRegistryItem(item))
    : [];
  state.aiLayoutHints = normalizeAiLayoutHints(parsed.aiLayoutHints || {});
  state.reviewData = normalizeReviewData(parsed.reviewData || {}, { seedPayload: parsed });
  const normalizedLegacyCount = countLegacySubmissionsWithoutFullSnapshot(state.reviewData.submissions);
  if (getCurrentBookRole() === "editor") {
    const uidText = String(collabState.user?.id || "");
    if (uidText) {
      const currentSnapshot = captureReviewSnapshot(state.images);
      getEditorBaselineSnapshot(uidText, currentSnapshot);
    }
  }
  if (getCurrentBookRole() === "owner") {
    const uidText = String(collabState.user?.id || "");
    if (uidText) {
      const currentSnapshot = captureReviewSnapshot(state.images);
      getEditorBaselineSnapshot(uidText, currentSnapshot);
    }
  }
  state.glyphDraft = null;
  state.glyphCreateActive = false;
  state.pendingDrafts = [];
  state.draftRect = null;
  ensureTemplateOrder();
  state.images.forEach((img, idx) => ensureImageMeta(img, idx));
  renderXmlHintInfo();

  // Persist one-time migration from legacy targetSnapshot-only entries to full snapshot entries.
  if (currentBookId && collabState.token && rawLegacyCount > normalizedLegacyCount) {
    window.setTimeout(() => {
      saveState({ force: true });
    }, 0);
  }
}

function createDefaultBookData() {
  return {
    images: [],
    templateTags: templateDefaults.map((tag, idx) => ({ ...tag, order: idx + 1 })),
    selectedImageId: null,
    selectedTemplateTagId: templateDefaults[0]?.id || null,
    activeMainPanel: "edit",
    activeRightPanel: "object",
    glyphRegistry: [],
    aiLayoutHints: { examples: [], activeFileNames: [], cachedPromptLines: [], updatedAt: "" },
    reviewData: { submissions: [], editorBases: {}, lastApprovedSnapshot: [], activeVersionId: "" }
  };
}

async function migrateLocalStorageBooksIfNeeded() {
  const migrated = await dbGetFlag(STORAGE_MIGRATED_FLAG);
  if (migrated) return;

  let books = [];
  try {
    const rawBooks = localStorage.getItem(BOOKS_INDEX_KEY);
    books = rawBooks ? JSON.parse(rawBooks) : [];
    if (!Array.isArray(books)) books = [];
  } catch (_) {
    books = [];
  }

  if (books.length > 0) {
    for (const book of books) {
      try {
        const raw = localStorage.getItem(bookDataKey(book.id));
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        await dbSaveBookData(book.id, parsed);
      } catch (_) {
        // ignore one broken record and continue
      }
    }
    booksIndexCache = books.slice();
    await persistBooksIndex();
    await dbSetFlag(STORAGE_MIGRATED_FLAG, true);
    return;
  }

  const rawLegacy = localStorage.getItem(STORAGE_KEY);
  if (rawLegacy) {
    try {
      const parsed = JSON.parse(rawLegacy);
      if (Array.isArray(parsed.images) && Array.isArray(parsed.templateTags)) {
        const bookId = uid("book");
        const now = new Date().toISOString();
        booksIndexCache = [{
          id: bookId,
          name: "默认书籍",
          createdAt: now,
          updatedAt: now,
          imageCount: parsed.images.length
        }];
        await dbSaveBookData(bookId, parsed);
        await persistBooksIndex();
      }
    } catch (_) {
      // ignore legacy parse errors
    }
  }
  await dbSetFlag(STORAGE_MIGRATED_FLAG, true);
}

function saveState(options = {}) {
  if (!currentBookId) return Promise.resolve();
  if (!collabState.token) return Promise.resolve();
  const requestedForce = !!options.force;
  if (!requestedForce && !canEditCurrentBook()) return Promise.resolve();
  const wait = !!options.wait;

  const runSaveTask = async (force) => {
    if (!force && !canEditCurrentBook()) return;
    const payload = collectCurrentBookData();
    const localPayloadKey = payloadKey(payload);
    const savedPayloadKey = lastSavedPayloadKeyByBook.get(String(currentBookId || ""));
    if (!force && localPayloadKey && savedPayloadKey && localPayloadKey === savedPayloadKey) {
      return;
    }

    const books = loadBooksIndex();
    const meta = books.find((item) => item.id === currentBookId);
    const nextName = meta?.name || "未命名书籍";
    const metaVersion = Number(meta?.version || 0);
    const liveVersion = Number(collabState.currentBookVersion || 0);
    // Use the newest known version to avoid false 409 conflicts from stale metadata.
    const initialBaseVersion = Math.max(1, metaVersion, liveVersion);

    const putSave = async (baseVersion) => {
      const data = await collabFetch(`/api/collab/books/${currentBookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nextName,
          payload,
          baseVersion
        })
      });
      return data?.book;
    };

    const saveOnce = async (baseVersion) => {
      if (collabState.wsConnected) {
        try {
          return await sendWsSaveBook(currentBookId, nextName, payload, baseVersion);
        } catch (err) {
          if (isVersionConflictError(err)) {
            throw err;
          }
          return putSave(baseVersion);
        }
      }
      return putSave(baseVersion);
    };

    let updatedBook;
    let lastConflictError = null;
    let attempt = 0;
    let baseVersion = initialBaseVersion;
    while (attempt < 5) {
      try {
        updatedBook = await saveOnce(baseVersion);
        break;
      } catch (err) {
        if (isVersionConflictError(err)) {
          lastConflictError = err;
        }
        if (!isVersionConflictError(err) || attempt >= 4) {
          throw err;
        }
        const latestData = await collabFetch(`/api/collab/books/${currentBookId}`);
        const latestBook = latestData?.book;
        const latestPayloadKey = payloadKey(latestBook?.payload || {});
        const latestVersion = Number(latestBook?.version || 0);
        if (latestBook && latestVersion > 0) {
          collabState.currentBookVersion = latestVersion;
          updateBookMetaFromCollabBook(latestBook);
          lastSavedPayloadKeyByBook.set(String(currentBookId || ""), latestPayloadKey);
          if (latestPayloadKey && localPayloadKey && latestPayloadKey === localPayloadKey) {
            return;
          }
          baseVersion = Math.max(1, latestVersion, collabState.currentBookVersion || 1);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 120 + attempt * 80));
        attempt += 1;
      }
    }

    // For background autosave, after repeated conflicts fallback to non-version checked write.
    if (!updatedBook && !wait && isVersionConflictError(lastConflictError)) {
      try {
        updatedBook = await putSave(0);
      } catch (err) {
        if (!isVersionConflictError(err)) {
          throw err;
        }
      }
    }

    if (updatedBook) {
      collabState.currentBookVersion = Number(updatedBook.version || collabState.currentBookVersion || 1);
      updateBookMetaFromCollabBook(updatedBook);
      lastSavedPayloadKeyByBook.set(String(currentBookId || ""), payloadKey(updatedBook.payload || payload));
    }
  };

  if (!wait) {
    saveStateDebounceForce = saveStateDebounceForce || requestedForce;
    if (saveStateDebounceTimer) {
      window.clearTimeout(saveStateDebounceTimer);
    }
    saveStateDebounceTimer = window.setTimeout(() => {
      const nextForce = saveStateDebounceForce;
      saveStateDebounceForce = false;
      saveStateDebounceTimer = null;
      saveStateQueue = saveStateQueue.then(() => runSaveTask(nextForce)).catch((err) => {
        if (isVersionConflictError(err)) {
          console.warn("saveState conflict skipped:", err?.message || err);
          return;
        }
        reportSaveError(err);
      });
    }, SAVE_STATE_DEBOUNCE_MS);
    return Promise.resolve();
  }

  if (saveStateDebounceTimer) {
    window.clearTimeout(saveStateDebounceTimer);
    saveStateDebounceTimer = null;
  }
  const force = requestedForce || saveStateDebounceForce;
  saveStateDebounceForce = false;

  saveStateQueue = saveStateQueue.then(() => runSaveTask(force)).catch((err) => {
    reportSaveError(err);
  });
  return saveStateQueue;
}

async function openBookById(bookId) {
  if (!collabState.token) {
    showAuthModal();
    return;
  }
  if (currentBookId && currentBookId !== bookId) {
    await saveState({ wait: true });
  }

  const data = await collabFetch(`/api/collab/books/${bookId}`);
  const book = data?.book;
  if (!book) {
    alert("书籍数据不存在");
    return;
  }
  const parsed = book.payload || {};
  collabState.currentBookVersion = Number(book.version || 1);
  updateBookMetaFromCollabBook(book);
  lastSavedPayloadKeyByBook.set(String(bookId || ""), payloadKey(parsed));
  connectCollabSocket();
  if (collabState.ws && collabState.ws.readyState === WebSocket.OPEN) {
    collabState.ws.send(JSON.stringify({ type: "subscribe", bookId }));
  }

  applyBookData(parsed);
  currentBookId = bookId;
  if (getCurrentBookRole() === "editor") {
    const uidText = String(collabState.user?.id || "");
    if (uidText) {
      const currentSnapshot = captureReviewSnapshot(state.images);
      getEditorBaselineSnapshot(uidText, currentSnapshot);
    }
  }
  await setLastOpenedBookId(bookId);
  await setLastView("editor");
  showEditorView();
  updateAuthUi();
  renderAll();
}

async function createBookRecord(name, data) {
  if (!collabState.token) {
    showAuthModal();
    throw new Error("请先登录协作账号");
  }

  const res = await collabFetch("/api/collab/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: String(name || "").trim() || "未命名书籍",
      payload: data || {}
    })
  });
  const book = res?.book;
  if (!book?.id) throw new Error("创建书籍失败");
  updateBookMetaFromCollabBook(book);
  collabState.currentBookVersion = Number(book.version || 1);
  return book.id;
}

async function renameBookRecord(bookId, nextName) {
  if (!collabState.token) {
    showAuthModal();
    throw new Error("请先登录协作账号");
  }
  const normalized = String(nextName || "").trim();
  if (!normalized) throw new Error("书籍名称不能为空");
  const detail = await collabFetch(`/api/collab/books/${bookId}`);
  const currentBook = detail?.book;
  if (!currentBook) throw new Error("书籍不存在");
  const updated = await collabFetch(`/api/collab/books/${bookId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: normalized,
      payload: currentBook.payload || {},
      baseVersion: Number(currentBook.version || 1)
    })
  });
  if (updated?.book) {
    updateBookMetaFromCollabBook(updated.book);
    if (currentBookId === bookId) {
      collabState.currentBookVersion = Number(updated.book.version || collabState.currentBookVersion || 1);
    }
  }
}

async function deleteBookRecord(bookId) {
  if (!collabState.token) {
    showAuthModal();
    throw new Error("请先登录协作账号");
  }
  await collabFetch(`/api/collab/books/${bookId}`, { method: "DELETE" });
  const books = loadBooksIndex().filter((item) => item.id !== bookId);
  saveBooksIndex(books);
  const lastOpenedId = await getLastOpenedBookId();
  if (lastOpenedId === bookId) {
    await setLastOpenedBookId("");
  }
  if (currentBookId === bookId) {
    currentBookId = null;
    await setLastView("library");
  }
}

function roleListElement(role) {
  if (role === "owner") return el.collabRoleOwnerList;
  if (role === "editor") return el.collabRoleEditorList;
  return el.collabRoleViewerList;
}

function canAddForRole(bookRole, targetRole) {
  const normalized = String(bookRole || "viewer").toLowerCase();
  if (normalized === "owner") return true;
  if (normalized === "editor") return targetRole === "viewer";
  return false;
}

function canDragMember(bookRole, member) {
  const normalized = String(bookRole || "viewer").toLowerCase();
  return normalized === "owner" && !!member?.userId;
}

async function fetchBookMembers(bookId) {
  if (!bookId) throw new Error("缺少书籍ID");
  const data = await collabFetch(`/api/collab/books/${bookId}/members`);
  const members = Array.isArray(data?.members) ? data.members : [];
  const bookRole = String(data?.book?.role || getBookMetaById(bookId)?.role || "viewer").toLowerCase();
  return { members, bookRole };
}

function renderCollabMembersModal() {
  if (!el.collabMembersModal) return;
  const { loading, members, bookRole, openBookId } = state.collabPanel;
  const openBook = getBookMetaById(openBookId);

  if (el.collabMembersTitle) {
    el.collabMembersTitle.textContent = openBook
      ? `协作成员 - ${openBook.name || "未命名书籍"}`
      : "协作成员";
  }
  if (el.collabMembersHint) {
    el.collabMembersHint.textContent = loading
      ? "加载中..."
      : `你的身份：${roleLabel(bookRole)}${canManageMembers(bookRole) ? "（可拖拽成员改变身份）" : ""}`;
  }

  ["owner", "editor", "viewer"].forEach((role) => {
    const list = roleListElement(role);
    if (!list) return;
    list.innerHTML = "";
    list.classList.toggle("droppable", canManageMembers(bookRole));
    const listMembers = members.filter((item) => String(item.role || "viewer").toLowerCase() === role);
    if (listMembers.length === 0 && !loading) {
      const empty = document.createElement("div");
      empty.className = "collab-role-empty";
      empty.textContent = "暂无成员";
      list.appendChild(empty);
    }
    listMembers.forEach((member) => {
      const row = document.createElement("div");
      row.className = "collab-member-item";
      row.draggable = canDragMember(bookRole, member);
      row.dataset.userId = member.userId;
      row.dataset.role = String(member.role || "viewer").toLowerCase();
      row.innerHTML = `
        <div class="collab-member-name">${member.displayName || "(未设置昵称)"}</div>
        <div class="collab-member-meta">账号 #${Number(member.accountNo || 0)} · ${member.email}</div>
      `;
      if (row.draggable) {
        row.addEventListener("dragstart", (evt) => {
          evt.dataTransfer?.setData("text/plain", JSON.stringify({ userId: member.userId, role: row.dataset.role }));
          row.classList.add("dragging");
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
        });
      }
      list.appendChild(row);
    });

    if (canManageMembers(bookRole)) {
      list.ondragover = (evt) => {
        evt.preventDefault();
        list.classList.add("drag-over");
      };
      list.ondragleave = () => list.classList.remove("drag-over");
      list.ondrop = (evt) => {
        evt.preventDefault();
        list.classList.remove("drag-over");
        const raw = evt.dataTransfer?.getData("text/plain") || "";
        if (!raw) return;
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch (_) {
          return;
        }
        if (!payload?.userId || !openBookId) return;
        const targetRole = role;
        if (String(payload.role || "") === targetRole) return;
        updateBookMemberRole(openBookId, payload.userId, targetRole).catch((err) => {
          alert(err?.message || "更新角色失败");
        });
      };
    } else {
      list.ondragover = null;
      list.ondragleave = null;
      list.ondrop = null;
    }
  });

  if (el.collabAddOwnerBtn) el.collabAddOwnerBtn.disabled = !canAddForRole(bookRole, "owner");
  if (el.collabAddEditorBtn) el.collabAddEditorBtn.disabled = !canAddForRole(bookRole, "editor");
  if (el.collabAddViewerBtn) el.collabAddViewerBtn.disabled = !canAddForRole(bookRole, "viewer");
}

async function refreshCollabMembersModal() {
  const bookId = state.collabPanel.openBookId;
  if (!bookId) return;
  state.collabPanel.loading = true;
  renderCollabMembersModal();
  try {
    const data = await fetchBookMembers(bookId);
    state.collabPanel.members = data.members;
    state.collabPanel.bookRole = data.bookRole;
    const meta = getBookMetaById(bookId);
    if (meta && meta.role !== data.bookRole) {
      const nextBooks = loadBooksIndex().map((item) => (
        item.id === bookId ? { ...item, role: data.bookRole } : item
      ));
      saveBooksIndex(nextBooks);
      renderBooksList();
      updateAuthUi();
    }
  } finally {
    state.collabPanel.loading = false;
    renderCollabMembersModal();
  }
}

async function openCollabMembersModal(book) {
  if (!book?.id) return;
  state.collabPanel.openBookId = book.id;
  state.collabPanel.members = [];
  state.collabPanel.bookRole = String(book.role || "viewer").toLowerCase();
  state.collabPanel.loading = true;
  renderCollabMembersModal();
  if (el.collabMembersModal) {
    el.collabMembersModal.classList.remove("hidden");
  }
  await refreshCollabMembersModal();
}

function closeCollabMembersModal() {
  if (el.collabMembersModal) {
    el.collabMembersModal.classList.add("hidden");
  }
  state.collabPanel.openBookId = "";
  state.collabPanel.members = [];
  state.collabPanel.loading = false;
}

async function inviteBookMember(targetRole) {
  const bookId = state.collabPanel.openBookId;
  if (!bookId) return;
  const currentRole = String(state.collabPanel.bookRole || "viewer").toLowerCase();
  if (!canAddForRole(currentRole, targetRole)) {
    alert("你当前没有该邀请权限");
    return;
  }
  const targetInput = window.prompt("输入对方数字账号（推荐）或昵称/邮箱");
  if (targetInput == null) return;
  const normalized = String(targetInput || "").trim();
  if (!normalized) {
    alert("输入不能为空");
    return;
  }

  const body = { role: targetRole };
  if (/^\d+$/.test(normalized)) {
    body.accountNo = Number(normalized);
  } else if (normalized.includes("@")) {
    body.email = normalized;
  } else {
    body.nickname = normalized;
  }

  await collabFetch(`/api/collab/books/${bookId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  await refreshCollabMembersModal();
}

async function updateBookMemberRole(bookId, userId, role) {
  await collabFetch(`/api/collab/books/${bookId}/members/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  });
  await refreshCollabMembersModal();
}

function renderBooksList() {
  if (!el.booksList) return;
  const books = loadBooksIndex();
  el.booksList.innerHTML = "";
  if (books.length === 0) {
    const empty = document.createElement("div");
    empty.className = "book-card";
    empty.innerHTML = "<div class=\"book-card-title\">暂无书籍</div><div class=\"book-card-meta\">点击右上角“新建”导入图片、PDF 或 XML</div>";
    el.booksList.appendChild(empty);
    return;
  }

  books.forEach((book) => {
    const bookRole = String(book.role || "viewer").toLowerCase();
    const canRename = bookRole === "owner" || bookRole === "editor";
    const canDelete = bookRole === "owner";
    const card = document.createElement("div");
    card.className = "book-card";
    const head = document.createElement("div");
    head.className = "book-card-head";
    const title = document.createElement("div");
    title.className = "book-card-title";
    title.textContent = book.name || "未命名书籍";
    const roleBadge = document.createElement("span");
    roleBadge.className = `book-role-badge role-${bookRole}`;
    roleBadge.textContent = roleLabel(bookRole);

    const collabBtn = document.createElement("button");
    collabBtn.type = "button";
    collabBtn.className = "mini-btn collab-manage-btn";
    collabBtn.textContent = "协作";
    collabBtn.title = "查看与管理协作成员";
    collabBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      openCollabMembersModal(book).catch((err) => {
        alert(err?.message || "打开协作面板失败");
      });
    });

    head.appendChild(title);
    head.appendChild(roleBadge);
    head.appendChild(collabBtn);

    const meta = document.createElement("div");
    meta.className = "book-card-meta";
    meta.textContent = `图片 ${book.imageCount || 0} 张 · 更新于 ${new Date(book.updatedAt || book.createdAt || Date.now()).toLocaleString()}`;
    const enterBtn = document.createElement("button");
    enterBtn.type = "button";
    enterBtn.className = "primary";
    enterBtn.textContent = "进入书籍";
    enterBtn.addEventListener("click", () => {
      if (!collabState.user) {
        showAuthModal();
        return;
      }
      openBookById(book.id).catch((err) => {
        alert(err?.message || "打开书籍失败");
      });
    });

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "mini-btn";
    renameBtn.textContent = "重命名";
    renameBtn.disabled = !canRename;
    renameBtn.addEventListener("click", async () => {
      if (!canRename) {
        alert("你当前没有重命名权限");
        return;
      }
      const nextName = window.prompt("输入新的书籍名称", book.name || "");
      if (nextName == null) return;
      try {
        await renameBookRecord(book.id, nextName);
        renderBooksList();
      } catch (err) {
        alert(err?.message || "重命名失败");
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "mini-btn book-delete-btn";
    deleteBtn.textContent = "删除";
    deleteBtn.disabled = !canDelete;
    deleteBtn.addEventListener("click", async () => {
      if (!canDelete) {
        alert("仅管理者可删除书籍");
        return;
      }
      const ok = window.confirm(`确定删除书籍“${book.name || "未命名书籍"}”吗？删除后不可恢复。`);
      if (!ok) return;
      try {
        await deleteBookRecord(book.id);
        renderBooksList();
      } catch (err) {
        alert(err?.message || "删除失败");
      }
    });

    const actions = document.createElement("div");
    actions.className = "book-card-actions";
    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(head);
    card.appendChild(meta);
    card.appendChild(enterBtn);
    card.appendChild(actions);
    el.booksList.appendChild(card);
  });
}

async function loadState() {
  if (!collabState.token || !collabState.user) {
    booksIndexCache = [];
    currentBookId = null;
    showLibraryView();
    updateAuthUi();
    renderBooksList();
    showAuthModal();
    return;
  }

  booksIndexCache = [];
  const resp = await collabFetch("/api/collab/books");
  const books = Array.isArray(resp?.books) ? resp.books : [];
  saveBooksIndex(books.map((book) => ({
    id: book.id,
    name: book.name || "未命名书籍",
    createdAt: book.createdAt || new Date().toISOString(),
    updatedAt: book.updatedAt || new Date().toISOString(),
    imageCount: Array.isArray(book.payload?.images) ? book.payload.images.length : 0,
    ownerUserId: book.ownerUserId || "",
    role: book.role || "viewer",
    version: Number(book.version || 1)
  })));
  const indexBooks = loadBooksIndex();
  if (indexBooks.length === 0) {
    currentBookId = null;
    await setLastView("library");
    await setLastOpenedBookId("");
    showLibraryView();
    updateAuthUi();
    renderBooksList();
    return;
  }

  const lastView = await getLastView();
  const lastOpenedBookId = await getLastOpenedBookId();
  if (lastView === "editor" && lastOpenedBookId && indexBooks.some((book) => book.id === lastOpenedBookId)) {
    await openBookById(lastOpenedBookId);
    return;
  }

  await setLastView("library");
  showLibraryView();
  updateAuthUi();
  renderBooksList();
}

function renderThumbs() {
  el.thumbList.innerHTML = "";
  const editable = canEditCurrentBook();
  const selectedForDelete = new Set(state.batchDeleteImageIds);
  state.images.forEach((img) => {
    const card = document.createElement("div");
    card.className = `thumb-item ${img.id === state.selectedImageId ? "active" : ""}`;
    card.draggable = editable;
    card.dataset.imageId = img.id;
    card.innerHTML = `
      <div class="thumb-head">
        <label class="thumb-select"><input type="checkbox" data-select-id="${img.id}" ${selectedForDelete.has(img.id) ? "checked" : ""} />选中</label>
      </div>
      <img src="${img.src}" alt="${img.name}" />
      <div class="thumb-meta">${img.name}</div>
      <div class="thumb-meta">id:${img.meta.id}</div>
    `;

    card.addEventListener("dragstart", (evt) => {
      if (!editable) return;
      state.draggingThumbId = img.id;
      card.classList.add("dragging");
      if (evt.dataTransfer) {
        evt.dataTransfer.effectAllowed = "move";
        evt.dataTransfer.setData("text/plain", img.id);
      }
    });

    card.addEventListener("dragend", () => {
      state.draggingThumbId = null;
      card.classList.remove("dragging");
      el.thumbList.querySelectorAll(".thumb-item.drag-over").forEach((node) => node.classList.remove("drag-over"));
    });

    card.addEventListener("dragover", (evt) => {
      evt.preventDefault();
      if (state.draggingThumbId && state.draggingThumbId !== img.id) {
        card.classList.add("drag-over");
      }
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (evt) => {
      if (!editable) return;
      evt.preventDefault();
      card.classList.remove("drag-over");
      const draggedId = state.draggingThumbId || (evt.dataTransfer ? evt.dataTransfer.getData("text/plain") : "");
      if (!draggedId || draggedId === img.id) return;
      const fromIndex = state.images.findIndex((it) => it.id === draggedId);
      const toIndex = state.images.findIndex((it) => it.id === img.id);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      const [moved] = state.images.splice(fromIndex, 1);
      state.images.splice(toIndex, 0, moved);
      saveState();
      renderThumbs();
    });

    card.addEventListener("click", () => {
      state.selectedImageId = img.id;
      state.selectedAnnoId = null;
      state.selectedTagFilterName = "";
      state.drawingActive = false;
      state.draftRect = null;
      state.renamingImage = false;
      renderAll();
    });

    const selectCheckbox = card.querySelector(`input[data-select-id="${img.id}"]`);
    selectCheckbox.disabled = !editable;
    selectCheckbox.addEventListener("click", (evt) => {
      evt.stopPropagation();
    });
    selectCheckbox.addEventListener("change", () => {
      if (selectCheckbox.checked) {
        if (!state.batchDeleteImageIds.includes(img.id)) state.batchDeleteImageIds.push(img.id);
      } else {
        state.batchDeleteImageIds = state.batchDeleteImageIds.filter((id) => id !== img.id);
      }
    });

    el.thumbList.appendChild(card);
  });
}

function renderMainImage() {
  const img = selectedImage();
  if (!img) {
    state.renamingImage = false;
    closeImageEditModal();
    el.mainImage.removeAttribute("src");
    el.viewerTitle.textContent = "未选择图片";
    if (el.viewerTitle) el.viewerTitle.classList.remove("hidden");
    if (el.viewerTitleInput) el.viewerTitleInput.classList.add("hidden");
    if (el.renameImageBtn) el.renameImageBtn.disabled = true;
    syncDrawLayerSize();
    return;
  }
  if (el.mainImage.src !== img.src) {
    el.mainImage.src = img.src;
  }
  el.viewerTitle.textContent = `${img.name} | id:${img.meta.id}`;
  if (el.viewerTitle) el.viewerTitle.classList.remove("hidden");
  if (el.viewerTitleInput) el.viewerTitleInput.classList.add("hidden");
  if (el.renameImageBtn) {
    el.renameImageBtn.disabled = false;
    el.renameImageBtn.textContent = "编辑";
  }
  syncDrawLayerSize();
}

function startRenameSelectedImage() {
  if (!ensureCanEdit("编辑图片信息")) return;
  const img = selectedImage();
  if (!img) {
    alert("请先选择图片");
    return;
  }

  openImageEditModal(img);
}

function openImageEditModal(img) {
  if (!el.imageEditModal) return;
  const target = img || selectedImage();
  if (!target) return;
  if (el.imageEditNameInput) {
    el.imageEditNameInput.value = String(target.name || "");
  }
  if (el.imageEditIdInput) {
    el.imageEditIdInput.value = String(target.meta?.id || "");
  }
  el.imageEditModal.classList.remove("hidden");
  if (el.imageEditNameInput) {
    el.imageEditNameInput.focus();
    el.imageEditNameInput.select();
  }
}

function closeImageEditModal() {
  if (!el.imageEditModal) return;
  el.imageEditModal.classList.add("hidden");
}

function saveSelectedImageNameFromModal() {
  if (!ensureCanEdit("编辑图片名称")) return;
  const img = selectedImage();
  if (!img) {
    alert("请先选择图片");
    return;
  }
  const nextName = String(el.imageEditNameInput?.value || "").trim();
  if (!nextName) {
    alert("图片名称不能为空");
    if (el.imageEditNameInput) {
      el.imageEditNameInput.focus();
      el.imageEditNameInput.select();
    }
    return;
  }
  img.name = nextName;
  renderAll();
  saveState();
}

function saveSelectedImageIdFromModal() {
  if (!ensureCanEdit("编辑图片ID")) return;
  const img = selectedImage();
  if (!img) {
    alert("请先选择图片");
    return;
  }
  const nextId = String(el.imageEditIdInput?.value || "").trim();
  if (!nextId) {
    alert("图片ID不能为空");
    if (el.imageEditIdInput) {
      el.imageEditIdInput.focus();
      el.imageEditIdInput.select();
    }
    return;
  }
  img.meta = img.meta || {};
  img.meta.id = nextId;
  renderAll();
  saveState();
}

function confirmRenameSelectedImage() {
  if (!ensureCanEdit("重命名图片")) return;
  const img = selectedImage();
  if (!img) return;

  const nextName = String(el.viewerTitleInput?.value || "");
  const trimmed = nextName.trim();
  if (!trimmed) {
    alert("图片名称不能为空");
    if (el.viewerTitleInput) {
      el.viewerTitleInput.focus();
      el.viewerTitleInput.select();
    }
    return;
  }

  img.name = trimmed;
  state.renamingImage = false;
  renderAll();
  saveState();
}

function cancelRenameSelectedImage() {
  state.renamingImage = false;
  renderMainImage();
}

function renderBoxes() {
  const img = selectedImage();
  el.drawLayer.innerHTML = "";
  if (!img) return;
  const editable = canEditCurrentBook();

  if (state.versionPreview.active) {
    const imageId = String(img.id || "");
    const diff = state.versionPreview.diffByImage[imageId] || null;
    const targetImage = state.versionPreview.targetByImage[imageId] || { annotations: [] };
    const targetAnnos = Array.isArray(targetImage.annotations) ? targetImage.annotations : [];
    const addedSet = new Set((diff?.added || []).map((anno) => String(anno?.id || "")));
    const renderAnnos = [];

    if (state.versionPreview.showDiffOnly) {
      (diff?.added || []).forEach((anno) => {
        renderAnnos.push({ ...anno, __diffKind: "added" });
      });
      (diff?.removed || []).forEach((anno) => {
        renderAnnos.push({ ...anno, __diffKind: "removed" });
      });
    } else {
      targetAnnos.forEach((anno) => {
        const kind = addedSet.has(String(anno?.id || "")) ? "added" : "normal";
        renderAnnos.push({ ...anno, __diffKind: kind });
      });
      (diff?.removed || []).forEach((anno) => {
        renderAnnos.push({ ...anno, __diffKind: "removed" });
      });
    }

    renderAnnos.forEach((anno) => {
      const box = document.createElement("div");
      box.className = "box shape-rect";
      box.style.zIndex = String(50 + templateDepth(anno.tagId));
      box.style.left = `${anno.rect.x * 100}%`;
      box.style.top = `${anno.rect.y * 100}%`;
      box.style.width = `${anno.rect.w * 100}%`;
      box.style.height = `${anno.rect.h * 100}%`;

      if (anno.__diffKind === "added") {
        box.classList.add("box-diff-added");
        box.style.setProperty("--shape-color", "#1f7a3a");
        applyBoxVisualStyle(box, "#1f7a3a", "solid", 2);
        box.title = `新增: ${anno.tagPath || anno.tagName || "标注"}`;
      } else if (anno.__diffKind === "removed") {
        box.classList.add("box-diff-removed");
        box.style.setProperty("--shape-color", "#b23a2a");
        applyBoxVisualStyle(box, "#b23a2a", "dashed", 2);
        box.title = `减少: ${anno.tagPath || anno.tagName || "标注"}`;
      } else {
        box.style.setProperty("--shape-color", anno.color || "#2e6f86");
        applyBoxVisualStyle(box, anno.color || "#2e6f86", anno.borderStyle || "solid", anno.borderWidth || 2);
        box.title = `${anno.tagPath || anno.tagName || "标注"}`;
      }
      el.drawLayer.appendChild(box);
    });
    return;
  }

  const parentMap = getParentMap(img);
  const renderAnnos = [...img.annotations];

  renderAnnos.forEach((anno) => {
    const box = document.createElement("div");
    box.className = "box shape-rect";
    if (anno.id === state.selectedAnnoId) box.classList.add("selected");
    box.style.zIndex = String(50 + templateDepth(anno.tagId));
    if (state.selectedTagFilterName) {
      if (anno.tagName === state.selectedTagFilterName) box.classList.add("matching-tag");
      else box.classList.add("dimmed");
    }
    box.style.left = `${anno.rect.x * 100}%`;
    box.style.top = `${anno.rect.y * 100}%`;
    box.style.width = `${anno.rect.w * 100}%`;
    box.style.height = `${anno.rect.h * 100}%`;
    box.style.setProperty("--shape-color", anno.color);
    applyBoxVisualStyle(box, anno.color, anno.borderStyle, anno.borderWidth);
    box.title = `${anno.tagPath}${parentMap.get(anno.id) ? " (子框)" : ""}`;
    box.addEventListener("click", (evt) => {
      evt.stopPropagation();
      const layerRect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - layerRect.left) / layerRect.width);
      const y = clamp01((evt.clientY - layerRect.top) / layerRect.height);
      const picked = pickTopAnnoAtPoint(img, x, y);
      if (picked) state.selectedAnnoId = picked.id;
      renderAll();
    });
    if (editable && anno.id === state.selectedAnnoId) {
      ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((dir) => {
        const handle = document.createElement("span");
        handle.className = `box-resize-handle handle-${dir}`;
        handle.dataset.dir = dir;
        handle.dataset.annoId = anno.id;
        handle.addEventListener("mousedown", (evt) => evt.stopPropagation());
        box.appendChild(handle);
      });

      const delBtn = document.createElement("button");
      delBtn.className = "box-delete";
      delBtn.textContent = "×";
      delBtn.title = "删除该框";
      delBtn.addEventListener("click", (evt) => {
        evt.stopPropagation();
        const keep = img.annotations.filter((it) => it.id !== anno.id);
        img.annotations = keep;
        state.selectedAnnoId = null;
        renderAll();
        saveState();
      });
      box.appendChild(delBtn);
    }
    el.drawLayer.appendChild(box);
  });

  if (state.draftRect) {
    const draftShape = "rect";
    const draftColor = state.glyphCreateActive ? "#8f3b2e" : el.annoColor.value;
    const draftBorderStyle = state.glyphCreateActive ? "solid" : normalizeAnnoBorderStyle(el.annoShapeSelect.value);
    const draft = document.createElement("div");
    draft.className = `box temp shape-${draftShape}`;
    draft.style.left = `${state.draftRect.x * 100}%`;
    draft.style.top = `${state.draftRect.y * 100}%`;
    draft.style.width = `${state.draftRect.w * 100}%`;
    draft.style.height = `${state.draftRect.h * 100}%`;
    draft.style.setProperty("--shape-color", draftColor);
    applyBoxVisualStyle(draft, draftColor, draftBorderStyle, 2, true);
    el.drawLayer.appendChild(draft);
  }

  state.pendingDrafts.forEach((draftItem) => {
    const draft = document.createElement("div");
    draft.className = "box temp shape-rect";
    draft.style.left = `${draftItem.rect.x * 100}%`;
    draft.style.top = `${draftItem.rect.y * 100}%`;
    draft.style.width = `${draftItem.rect.w * 100}%`;
    draft.style.height = `${draftItem.rect.h * 100}%`;
    draft.style.setProperty("--shape-color", draftItem.color);
    applyBoxVisualStyle(draft, draftItem.color, draftItem.borderStyle || "solid", 2, true);
    draft.title = `待保存: ${draftItem.tagPath}`;
    el.drawLayer.appendChild(draft);
  });
}

function renderPropsEditor() {
  const img = selectedImage();
  const anno = selectedAnno();
  el.propsEditor.innerHTML = "";
  state.propInputs = {};
  state.objectStyleInputs = {};
  if (!img) return;

  if (!anno) {
    setObjectTextFieldsVisible(false);
    el.currentTargetHint.textContent = "当前：图片";
    ["id"].forEach((key) => {
      const row = document.createElement("div");
      row.className = "prop-row";
      row.innerHTML = `<span>${key}</span>`;
      const input = document.createElement("input");
      input.value = img.meta[key] || "";
      state.propInputs[key] = input;
      row.appendChild(input);
      el.propsEditor.appendChild(row);
    });
    el.propNote.value = "";
    el.propNote.disabled = true;
    if (el.propMeaning) {
      el.propMeaning.value = "";
      el.propMeaning.disabled = true;
      el.propMeaning.placeholder = "";
    }
    if (el.propMeaningAutoTranslateBtn) el.propMeaningAutoTranslateBtn.disabled = true;
    el.propCodepoint.value = "";
    el.unicodeAllocArea.classList.remove("active");
    setUnicodeHint("仅 char 标签显示 unicode 码");
    return;
  }

  el.currentTargetHint.textContent = `当前：框 (${anno.tagPath})`;
  syncCharAnnoCodepointFromRegistry(anno);
  const templateTag = findTemplateTag(anno.tagId);
  const meaningEnabled = supportsMeaningAttrByTagId(anno.tagId);

  const tagTypeRow = document.createElement("div");
  tagTypeRow.className = "prop-row";
  tagTypeRow.innerHTML = "<span>标签类型</span>";
  const tagTypeSelect = document.createElement("select");
  const appendTagTypeOption = (tag, depth) => {
    const option = document.createElement("option");
    option.value = tag.id;
    option.textContent = `${"  ".repeat(depth)}${tag.name}`;
    tagTypeSelect.appendChild(option);
    templateChildren(tag.id).forEach((child) => appendTagTypeOption(child, depth + 1));
  };
  templateChildren(null).forEach((root) => appendTagTypeOption(root, 0));
  if (anno.tagId && state.templateTags.some((tag) => tag.id === anno.tagId)) {
    tagTypeSelect.value = anno.tagId;
  }
  tagTypeRow.appendChild(tagTypeSelect);
  el.propsEditor.appendChild(tagTypeRow);

  setObjectTextFieldsVisible(meaningEnabled);
  el.propNote.disabled = !meaningEnabled;
  const attrs = templateTag?.attrs?.length ? templateTag.attrs : ["id"];
  attrs.forEach((key) => {
    const row = document.createElement("div");
    row.className = "prop-row";
    row.innerHTML = `<span>${key}</span>`;
    const input = document.createElement("input");
    input.value = anno.attrs[key] || "";
    if (isCharTagAnno(anno) && key.toLowerCase() === "codepoint") {
      input.readOnly = true;
      input.disabled = true;
    }
    state.propInputs[key] = input;
    row.appendChild(input);
    el.propsEditor.appendChild(row);
  });

  const styleColorRow = document.createElement("div");
  styleColorRow.className = "prop-row";
  styleColorRow.innerHTML = "<span>框线颜色</span>";
  const styleColorInput = document.createElement("input");
  styleColorInput.type = "color";
  styleColorInput.value = anno.color || "#2e6f86";
  styleColorRow.appendChild(styleColorInput);
  el.propsEditor.appendChild(styleColorRow);

  const styleWidthRow = document.createElement("div");
  styleWidthRow.className = "prop-row";
  styleWidthRow.innerHTML = "<span>线宽(px)</span>";
  const styleWidthInput = document.createElement("input");
  styleWidthInput.type = "number";
  styleWidthInput.min = "1";
  styleWidthInput.max = "8";
  styleWidthInput.step = "1";
  styleWidthInput.value = String(normalizeAnnoBorderWidth(anno.borderWidth));
  styleWidthRow.appendChild(styleWidthInput);
  el.propsEditor.appendChild(styleWidthRow);

  const styleTypeRow = document.createElement("div");
  styleTypeRow.className = "prop-row";
  styleTypeRow.innerHTML = "<span>线型</span>";
  const styleTypeSelect = document.createElement("select");
  ["solid", "dashed", "dotted"].forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item === "solid" ? "实线" : item === "dashed" ? "虚线" : "点线";
    styleTypeSelect.appendChild(option);
  });
  styleTypeSelect.value = normalizeAnnoBorderStyle(anno.borderStyle);
  styleTypeRow.appendChild(styleTypeSelect);
  el.propsEditor.appendChild(styleTypeRow);

  state.objectStyleInputs = {
    tagId: tagTypeSelect,
    color: styleColorInput,
    borderWidth: styleWidthInput,
    borderStyle: styleTypeSelect
  };

  const previewCurrentAnnoStyle = () => {
    const currentAnno = selectedAnno();
    if (!currentAnno || currentAnno.id !== anno.id) return;
    syncStyleForSameTagAnnos(
      currentAnno,
      styleTypeSelect.value,
      styleColorInput.value || "#2e6f86",
      styleWidthInput.value
    );
    styleWidthInput.value = String(normalizeAnnoBorderWidth(styleWidthInput.value));
    renderBoxes();
  };
  styleColorInput.addEventListener("input", previewCurrentAnnoStyle);
  styleWidthInput.addEventListener("input", previewCurrentAnnoStyle);
  styleTypeSelect.addEventListener("change", previewCurrentAnnoStyle);

  el.propNote.value = anno.transcription || "";
  if (el.propMeaning) {
    if (meaningEnabled) {
      el.propMeaning.disabled = false;
      el.propMeaning.placeholder = "框内古文内容翻译";
      el.propMeaning.value = anno.attrs?.meaning || anno.attrs?.transcriptionMeaning || "";
    } else {
      el.propMeaning.value = "";
      el.propMeaning.disabled = true;
      el.propMeaning.placeholder = "";
    }
  }
  if (el.propMeaningAutoTranslateBtn) {
    el.propMeaningAutoTranslateBtn.disabled = !meaningEnabled;
  }

  if (isCharTagAnno(anno)) {
    el.propCodepoint.value = anno.attrs?.codepoint || "";
    el.unicodeAllocArea.classList.add("active");
    setUnicodeHint("char 标签 unicode 仅可在造字面板修改");
  } else {
    el.propCodepoint.value = "";
    el.unicodeAllocArea.classList.remove("active");
    setUnicodeHint("仅 char 标签显示 unicode 码");
  }
}

function renderEditMode() {
  if (state.versionPreview.active) {
    el.drawState.textContent = "版本差异查看中：可切换显示全部或仅显示新增/减少，编辑已禁用";
    el.startDrawBtn.textContent = "开始添加";
    setDrawTextFieldsVisible(false);
    return;
  }
  if (!canEditCurrentBook()) {
    el.drawState.textContent = "当前为仅读权限，可查看方框与标签，不能编辑";
    el.startDrawBtn.textContent = "开始添加";
    setDrawTextFieldsVisible(false);
    return;
  }
  setDrawTextFieldsVisible(drawTextFieldsEnabled());
  if (state.drawingActive) {
    const count = state.pendingDrafts.length;
    if (state.draftRect) {
      el.drawState.textContent = `当前拖拽中，待保存 ${count} 个框`;
    } else {
      el.drawState.textContent = `可连续画框，待保存 ${count} 个框`;
    }
    el.startDrawBtn.textContent = "取消添加";
  } else {
    const count = state.pendingDrafts.length;
    el.drawState.textContent = count > 0
      ? `待保存 ${count} 个框，点击保存标注统一保存（可拖动已有框微调位置）`
      : "先选择标签和颜色，再点击“开始添加”按钮（未开启添加时可拖动已有框）";
    el.startDrawBtn.textContent = "开始添加";
  }
}

function renderTemplateTagSelect() {
  el.templateTagSelect.innerHTML = "";
  const options = [];
  function walk(tag, depth) {
    options.push({ id: tag.id, label: `${"  ".repeat(depth)}${tag.name}` });
    templateChildren(tag.id).forEach((child) => walk(child, depth + 1));
  }
  templateChildren(null).forEach((root) => walk(root, 0));

  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.id;
    option.textContent = opt.label;
    el.templateTagSelect.appendChild(option);
  });

  if (!state.selectedTemplateTagId && options[0]) state.selectedTemplateTagId = options[0].id;
  if (state.selectedTemplateTagId) el.templateTagSelect.value = state.selectedTemplateTagId;
  renderTemplateAttrSelect();
}

function renderTemplateAttrSelect() {
  el.templateAttrSelect.innerHTML = "";
  const tag = findTemplateTag(state.selectedTemplateTagId);
  if (!tag) return;
  (tag.attrs || []).forEach((attr) => {
    const option = document.createElement("option");
    option.value = attr;
    option.textContent = attr;
    el.templateAttrSelect.appendChild(option);
  });
}

function renderTagTree(container, clickable) {
  function node(tag) {
    const li = document.createElement("li");
    const attrs = (tag.attrs || []).join("|");
    if (!clickable) {
      li.innerHTML = `<strong>${tag.name}</strong><span class="tag-meta">${attrs ? ` 属性:${attrs}` : ""}</span>`;
    } else {
      const line = document.createElement("div");
      line.className = "tree-node-line";
      const name = document.createElement("span");
      name.textContent = tag.name;
      const btn = document.createElement("button");
      btn.className = `tree-pick-btn ${state.activeDraftTagId === tag.id ? "active" : ""}`;
      btn.textContent = state.activeDraftTagId === tag.id ? "已选" : "选择";
      btn.addEventListener("click", () => {
        state.activeDraftTagId = tag.id;
        renderTagPickerTree();
        renderSelectedTagInfo();
      });
      line.appendChild(name);
      line.appendChild(btn);
      li.appendChild(line);
    }
    const children = templateChildren(tag.id);
    if (children.length > 0) {
      const ul = document.createElement("ul");
      children.forEach((child) => ul.appendChild(node(child)));
      li.appendChild(ul);
    }
    return li;
  }

  container.innerHTML = "";
  const rootUl = document.createElement("ul");
  templateChildren(null).forEach((root) => rootUl.appendChild(node(root)));
  container.appendChild(rootUl);
}

function renderTagPickerTree() { renderTagTree(el.tagPickerTree, true); }
function renderTemplateTagTree() { renderTagTree(el.templateTagTree, false); }

function renderImageTagTree() {
  const img = selectedImage();
  el.imageTagTree.innerHTML = "";
  if (!img) return;

  if (img.annotations.length === 0) {
    const li = document.createElement("li");
    li.textContent = "当前图片暂无标签";
    const ul = document.createElement("ul");
    ul.appendChild(li);
    el.imageTagTree.appendChild(ul);
    return;
  }

  const tagMap = new Map();
  img.annotations.forEach((anno) => {
    if (!tagMap.has(anno.tagName)) {
      tagMap.set(anno.tagName, { tagName: anno.tagName, count: 0, sampleAnnoId: anno.id, parentTagName: null, depth: 0 });
    }
    tagMap.get(anno.tagName).count += 1;
  });

  tagMap.forEach((item) => {
    const tagDef = state.templateTags.find((t) => t.name === item.tagName) || null;
    if (!tagDef || !tagDef.parentId) return;
    const parentTag = findTemplateTag(tagDef.parentId);
    if (!parentTag) return;
    if (tagMap.has(parentTag.name)) {
      item.parentTagName = parentTag.name;
    }
  });

  function computeDepth(item) {
    let d = 0;
    let cursor = item;
    const guard = new Set();
    while (cursor && cursor.parentTagName && !guard.has(cursor.parentTagName)) {
      guard.add(cursor.parentTagName);
      const parent = tagMap.get(cursor.parentTagName);
      if (!parent) break;
      d += 1;
      cursor = parent;
    }
    return d;
  }

  tagMap.forEach((item) => {
    item.depth = computeDepth(item);
  });

  const childMap = new Map();
  function pushChild(parentName, item) {
    const key = parentName || "ROOT";
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key).push(item);
  }

  tagMap.forEach((item) => {
    pushChild(item.parentTagName, item);
  });

  function sortItems(list) {
    list.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.tagName.localeCompare(b.tagName, "zh-CN");
    });
    return list;
  }

  function renderNode(item) {
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.className = "tree-node-line clickable";
    const label = document.createElement("span");
    label.textContent = `${item.tagName} (${item.count})`;
    line.addEventListener("click", () => {
      state.selectedAnnoId = item.sampleAnnoId;
      state.selectedTagFilterName = state.selectedTagFilterName === item.tagName ? "" : item.tagName;
      renderAll();
    });
    const btn = document.createElement("button");
    btn.className = `tree-pick-btn ${state.selectedTagFilterName === item.tagName ? "active" : ""}`;
    btn.textContent = state.selectedTagFilterName === item.tagName ? "已高亮" : "高亮";
    btn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.selectedTagFilterName = state.selectedTagFilterName === item.tagName ? "" : item.tagName;
      state.selectedAnnoId = item.sampleAnnoId;
      renderAll();
    });
    line.appendChild(label);
    line.appendChild(btn);
    li.appendChild(line);

    const children = sortItems([...(childMap.get(item.tagName) || [])]);
    if (children.length > 0) {
      const ul = document.createElement("ul");
      children.forEach((child) => ul.appendChild(renderNode(child)));
      li.appendChild(ul);
    }
    return li;
  }

  const ul = document.createElement("ul");
  const roots = sortItems([...(childMap.get("ROOT") || [])]);
  roots.forEach((root) => ul.appendChild(renderNode(root)));

  const clearLi = document.createElement("li");
  const clearBtn = document.createElement("button");
  clearBtn.className = "tree-pick-btn";
  clearBtn.textContent = "取消高亮";
  clearBtn.addEventListener("click", () => {
    state.selectedTagFilterName = "";
    renderAll();
  });
  clearLi.appendChild(clearBtn);
  ul.appendChild(clearLi);

  el.imageTagTree.appendChild(ul);
}

function renderSelectedTagInfo() {
  if (!el.selectedTagInfo) return;
  if (!state.activeDraftTagId) {
    el.selectedTagInfo.textContent = "";
    setDrawTextFieldsVisible(false);
    return;
  }
  const enabled = drawTextFieldsEnabled();
  const depthTip = enabled ? "" : "（第3层以下才显示简体形式/释义）";
  el.selectedTagInfo.textContent = `已选择标签：${templatePath(state.activeDraftTagId)}${depthTip}`;
  setDrawTextFieldsVisible(enabled);
  syncPickerFromActiveTag();
}

function renderDraftTagParentOptions() {
  el.draftTagParent.innerHTML = "";
  function append(select, tag, depth) {
    const option = document.createElement("option");
    option.value = tag.id;
    option.textContent = `${"  ".repeat(depth)}${tag.name}`;
    select.appendChild(option);
  }
  function walk(tag, depth) {
    append(el.draftTagParent, tag, depth);
    templateChildren(tag.id).forEach((child) => walk(child, depth + 1));
  }
  templateChildren(null).forEach((root) => walk(root, 0));
}

function containsRect(outer, inner) {
  const eps = 0.0001;
  return (
    outer.x <= inner.x + eps &&
    outer.y <= inner.y + eps &&
    outer.x + outer.w >= inner.x + inner.w - eps &&
    outer.y + outer.h >= inner.y + inner.h - eps
  );
}

function findParentByIdOrContainment(img, newRect, currentId, currentAttrId) {
  const others = img.annotations.filter((anno) => anno.id !== currentId);
  if (currentAttrId) {
    const sameId = others.filter((anno) => (anno.attrs.id || "") === currentAttrId);
    if (sameId.length > 0) return sameId[0].id;
    return null;
  }
  const containing = others.filter((anno) => containsRect(anno.rect, newRect));
  if (containing.length === 0) return null;
  containing.sort((a, b) => (a.rect.w * a.rect.h) - (b.rect.w * b.rect.h));
  return containing[0].id;
}

function renderAll() {
  const img = selectedImage();
  if (img) {
    const idx = state.images.findIndex((it) => it.id === img.id);
    ensureImageMeta(img, idx);
  }
  renderThumbs();
  renderMainImage();
  renderBoxes();
  renderPropsEditor();
  renderEditMode();
  renderTagPickerTree();
  renderSelectedTagInfo();
  renderImageTagTree();
  renderTemplateTagTree();
  renderTemplateTagSelect();
  renderDraftTagParentOptions();
  renderMainPanelTabs();
  renderRightPanelTabs();
  renderGlyphPanel();
  renderPresenceLayer();
  renderLivePresenceHint();
  syncReviewToolbarUi();
  syncEditorPermissionUi();
}

function syncEditorPermissionUi() {
  const editable = canEditCurrentBook();
  const isViewerReadOnly = getCurrentBookRole() === "viewer";
  const disableWhenReadOnly = [
    el.uploadBtn,
    el.deleteSelectedImagesBtn,
    el.renameImageBtn,
    el.startDrawBtn,
    el.clearDraftBtn,
    el.saveAnnoBtn,
    el.saveCurrentPropsBtn,
    el.createDraftTagBtn,
    el.glyphStartCreateBtn,
    el.glyphReselectBtn,
    el.glyphAssignSaveBtn,
    el.autoDrawByAiBtn,
    el.annoAutoSuggestBtn,
    el.propMeaningAutoTranslateBtn,
    el.tagMoveUpBtn,
    el.tagMoveDownBtn,
    el.deleteTagBtn,
    el.addAttrBtn,
    el.deleteAttrBtn
  ];

  disableWhenReadOnly.forEach((node) => {
    if (!node) return;
    node.disabled = !editable;
    node.classList.toggle("readonly-hidden", isViewerReadOnly && !editable);
  });

  [
    el.viewerTitleInput,
    el.annoTranscription,
    el.annoMeaning,
    el.propNote,
    el.propMeaning,
    el.draftTagName,
    el.draftTagParent,
    el.draftTagAttrs,
    el.templateTagSelect,
    el.newAttrForTemplateTag,
    el.annoShapeSelect,
    el.annoColor
  ].forEach((node) => {
    if (!node) return;
    node.disabled = !editable;
    const isTextInput =
      node.tagName === "INPUT" ||
      node.tagName === "TEXTAREA";
    if (isTextInput) {
      node.classList.toggle("readonly-hidden", isViewerReadOnly && !editable);
    }
  });

  if (!editable) {
    state.drawingActive = false;
    state.glyphCreateActive = false;
    state.draftRect = null;
    state.pendingDrafts = [];
  }

  if (el.drawLayer) {
    el.drawLayer.classList.toggle("readonly-layer", !editable);
  }
}

function bindDrawEvents() {
  let drawing = false;
  let start = null;
  let movingAnnoId = null;
  let moveOffset = null;
  let moveStartRect = null;
  let movedDuringDrag = false;
  let resizingAnnoId = null;
  let resizeDir = "";
  let resizeStartRect = null;
  let overlapBeforeIds = new Set();
  let suppressLayerClick = false;

  el.drawLayer.addEventListener("mousedown", (evt) => {
    const img = selectedImage();
    if (!img) return;
    const editable = canEditCurrentBook();
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((evt.clientX - rect.left) / rect.width);
    const y = clamp01((evt.clientY - rect.top) / rect.height);
    const allowAdjustExisting = editable && !state.glyphCreateActive && (!state.drawingActive || evt.altKey);

    if (allowAdjustExisting) {
      if (evt.target instanceof Element && evt.target.closest(".box-delete")) return;
      if (evt.target instanceof Element) {
        const resizeHandle = evt.target.closest(".box-resize-handle");
        if (resizeHandle) {
          const handleAnnoId = resizeHandle.getAttribute("data-anno-id") || state.selectedAnnoId;
          const resizeAnno = img.annotations.find((it) => it.id === handleAnnoId);
          if (!resizeAnno) return;
          state.selectedAnnoId = resizeAnno.id;
          resizingAnnoId = resizeAnno.id;
          resizeDir = resizeHandle.getAttribute("data-dir") || "se";
          resizeStartRect = { ...resizeAnno.rect };
          overlapBeforeIds = getCoveredAnnoIds(img, resizeAnno.id, resizeAnno.rect);
          movedDuringDrag = false;
          evt.preventDefault();
          renderAll();
          return;
        }
      }

      const picked = pickTopAnnoAtPoint(img, x, y);
      if (picked) {
        state.selectedAnnoId = picked.id;
        movingAnnoId = picked.id;
        moveOffset = { x: x - picked.rect.x, y: y - picked.rect.y };
        moveStartRect = { ...picked.rect };
        overlapBeforeIds = getCoveredAnnoIds(img, picked.id, picked.rect);
        movedDuringDrag = false;
        evt.preventDefault();
        renderAll();
        return;
      }

      if (!state.drawingActive) {
        return;
      }
    }

    if (!editable) {
      const picked = pickTopAnnoAtPoint(img, x, y);
      if (picked) {
        state.selectedAnnoId = picked.id;
        renderAll();
      }
      return;
    }

    if (state.glyphCreateActive) {
      clearGlyphInputFields();
    } else if (el.annoTranscription) {
      el.annoTranscription.value = "";
    }
    evt.preventDefault();
    drawing = true;
    start = { x, y };
  }, true);

  window.addEventListener("mousemove", (evt) => {
    if (resizingAnnoId && resizeStartRect) {
      const img = selectedImage();
      if (!img) return;
      const resizeAnno = img.annotations.find((it) => it.id === resizingAnnoId);
      if (!resizeAnno) return;
      const rect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - rect.left) / rect.width);
      const y = clamp01((evt.clientY - rect.top) / rect.height);

      let x1 = resizeStartRect.x;
      let y1 = resizeStartRect.y;
      let x2 = resizeStartRect.x + resizeStartRect.w;
      let y2 = resizeStartRect.y + resizeStartRect.h;

      if (resizeDir.includes("w")) x1 = x;
      if (resizeDir.includes("e")) x2 = x;
      if (resizeDir.includes("n")) y1 = y;
      if (resizeDir.includes("s")) y2 = y;

      const base = normalizeRect({ x1, y1, x2, y2 });
      const nextRect = normalizeAnnoRectForShape(base, resizeAnno.shape || "rect");
      const changed =
        Math.abs(nextRect.x - resizeAnno.rect.x) > 0.00001 ||
        Math.abs(nextRect.y - resizeAnno.rect.y) > 0.00001 ||
        Math.abs(nextRect.w - resizeAnno.rect.w) > 0.00001 ||
        Math.abs(nextRect.h - resizeAnno.rect.h) > 0.00001;
      if (changed) {
        resizeAnno.rect = nextRect;
        movedDuringDrag = true;
        renderBoxes();
      }
      return;
    }

    if (movingAnnoId && moveOffset) {
      const img = selectedImage();
      if (!img) return;
      const movingAnno = img.annotations.find((it) => it.id === movingAnnoId);
      if (!movingAnno) return;
      const rect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - rect.left) / rect.width);
      const y = clamp01((evt.clientY - rect.top) / rect.height);
      const nextX = Math.max(0, Math.min(1 - movingAnno.rect.w, x - moveOffset.x));
      const nextY = Math.max(0, Math.min(1 - movingAnno.rect.h, y - moveOffset.y));
      const changed = Math.abs(nextX - movingAnno.rect.x) > 0.00001 || Math.abs(nextY - movingAnno.rect.y) > 0.00001;
      if (changed) {
        movingAnno.rect.x = nextX;
        movingAnno.rect.y = nextY;
        movedDuringDrag = true;
        renderBoxes();
      }
      return;
    }

    if (drawing && start) {
      const rect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - rect.left) / rect.width);
      const y = clamp01((evt.clientY - rect.top) / rect.height);
      const base = normalizeRect({ x1: start.x, y1: start.y, x2: x, y2: y });
      state.draftRect = toShapeRect(base, "rect");
      renderBoxes();
      renderEditMode();
    }
  });

  window.addEventListener("mouseup", () => {
    if (resizingAnnoId) {
      const img = selectedImage();
      const resizeAnno = img ? img.annotations.find((it) => it.id === resizingAnnoId) : null;
      if (resizeAnno && movedDuringDrag) {
        if (hasSameTagOverlapInAnnotations(img, resizeAnno.tagId, resizeAnno.rect, resizeAnno.id)) {
          resizeAnno.rect = { ...resizeStartRect };
          alert("同类型方框不能重叠，已撤销本次缩放");
          resizingAnnoId = null;
          resizeDir = "";
          resizeStartRect = null;
          overlapBeforeIds = new Set();
          movedDuringDrag = false;
          renderAll();
          return;
        }
        const currentAttrId = String(resizeAnno.attrs?.id || "").trim();
        resizeAnno.parentAnnoId = findParentByIdOrContainment(img, resizeAnno.rect, resizeAnno.id, currentAttrId);
        const overlapAfterIds = getCoveredAnnoIds(img, resizeAnno.id, resizeAnno.rect);
        notifyNewCoveredAnnos(overlapBeforeIds, overlapAfterIds);
        saveState();
        suppressLayerClick = true;
      }
      resizingAnnoId = null;
      resizeDir = "";
      resizeStartRect = null;
      overlapBeforeIds = new Set();
      movedDuringDrag = false;
      renderAll();
      return;
    }

    if (movingAnnoId) {
      const img = selectedImage();
      const movingAnno = img ? img.annotations.find((it) => it.id === movingAnnoId) : null;
      if (movingAnno && movedDuringDrag) {
        if (hasSameTagOverlapInAnnotations(img, movingAnno.tagId, movingAnno.rect, movingAnno.id)) {
          movingAnno.rect = moveStartRect ? { ...moveStartRect } : movingAnno.rect;
          alert("同类型方框不能重叠，已撤销本次移动");
          movingAnnoId = null;
          moveOffset = null;
          moveStartRect = null;
          overlapBeforeIds = new Set();
          movedDuringDrag = false;
          renderAll();
          return;
        }
        const currentAttrId = String(movingAnno.attrs?.id || "").trim();
        movingAnno.parentAnnoId = findParentByIdOrContainment(img, movingAnno.rect, movingAnno.id, currentAttrId);
        const overlapAfterIds = getCoveredAnnoIds(img, movingAnno.id, movingAnno.rect);
        notifyNewCoveredAnnos(overlapBeforeIds, overlapAfterIds);
        saveState();
        suppressLayerClick = true;
      }
      movingAnnoId = null;
      moveOffset = null;
      moveStartRect = null;
      overlapBeforeIds = new Set();
      movedDuringDrag = false;
      renderAll();
      return;
    }

    if (drawing && start && state.draftRect) {
      if (state.glyphCreateActive) {
        if (state.draftRect.w >= 0.003 && state.draftRect.h >= 0.003) {
          try {
            captureGlyphDraft(state.draftRect);
            state.glyphCreateActive = false;
            saveState();
            renderAll();
          } catch (err) {
            alert(err?.message || "造字失败");
          }
        }
      } else {
        const tag = findTemplateTag(state.activeDraftTagId);
        if (tag && state.draftRect.w >= 0.003 && state.draftRect.h >= 0.003) {
          const style = getTagStyle(tag) || {
            shape: "rect",
            color: el.annoColor.value,
            borderStyle: normalizeAnnoBorderStyle(el.annoShapeSelect.value),
            borderWidth: 2
          };
          if (!getTagStyle(tag)) syncStyleToTag(tag.id, style.borderStyle, style.color);
          state.pendingDrafts.push({
            rect: { ...state.draftRect },
            tagId: tag.id,
            tagName: tag.name,
            tagPath: templatePath(tag.id),
            shape: "rect",
            color: style.color,
            borderStyle: normalizeAnnoBorderStyle(style.borderStyle || el.annoShapeSelect.value),
            borderWidth: normalizeAnnoBorderWidth(style.borderWidth || 2)
          });
        }
      }
      state.draftRect = null;
      renderBoxes();
      renderEditMode();
    }
    drawing = false;
    start = null;
  });

  el.drawLayer.addEventListener("click", (evt) => {
    if (!state.drawingActive && !state.glyphCreateActive) {
      if (suppressLayerClick) {
        suppressLayerClick = false;
        return;
      }
      const img = selectedImage();
      if (!img) return;
      const rect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - rect.left) / rect.width);
      const y = clamp01((evt.clientY - rect.top) / rect.height);
      const picked = pickTopAnnoAtPoint(img, x, y);
      state.selectedAnnoId = picked ? picked.id : null;
      renderAll();
    }
  });

  el.drawLayer.addEventListener("mousemove", (evt) => {
    const rect = el.drawLayer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = clamp01((evt.clientX - rect.left) / rect.width);
    const y = clamp01((evt.clientY - rect.top) / rect.height);
    sendPresenceCursor(x, y);
  });
}

function bindEvents() {
  if (el.mainPanelBtnEdit) {
    el.mainPanelBtnEdit.addEventListener("click", () => {
      state.activeMainPanel = "edit";
      renderAll();
      saveState();
    });
  }

  if (el.mainPanelBtnGlyph) {
    el.mainPanelBtnGlyph.addEventListener("click", () => {
      state.activeMainPanel = "glyph";
      renderAll();
      saveState();
    });
  }

  el.panelBtnObject.addEventListener("click", () => {
    state.activeRightPanel = "object";
    renderRightPanelTabs();
    saveState();
  });

  el.panelBtnDraw.addEventListener("click", () => {
    state.activeRightPanel = "draw";
    renderRightPanelTabs();
    saveState();
  });

  el.panelBtnTags.addEventListener("click", () => {
    state.activeRightPanel = "tags";
    renderRightPanelTabs();
    saveState();
  });

  el.uploadBtn.addEventListener("click", () => {
    el.uploadInput.click();
  });

  if (el.newBookBtn && el.libraryImportInput) {
    el.newBookBtn.addEventListener("click", () => {
      if (!collabState.user) {
        showAuthModal();
        return;
      }
      el.libraryImportInput.click();
    });
  }

  if (el.backToLibraryBtn) {
    el.backToLibraryBtn.addEventListener("click", async () => {
      if (hasUnsubmittedEditorChanges()) {
        alert("请先提交改动");
        return;
      }
      await saveState({ wait: true });
      await setLastView("library");
      renderBooksList();
      showLibraryView();
      updateAuthUi();
    });
  }

  if (el.submitOrReviewBtn) {
    el.submitOrReviewBtn.addEventListener("click", () => {
      const role = getCurrentBookRole();
      if (role === "owner" || role === "editor") {
        if (state.versionPreview.active) exitVersionPreview();
        submitCurrentChangesForReview();
      }
    });
  }

  if (el.versionPreviewToggleBtn) {
    el.versionPreviewToggleBtn.addEventListener("click", () => {
      if (!state.versionPreview.active) return;
      state.versionPreview.showDiffOnly = !state.versionPreview.showDiffOnly;
      renderAll();
    });
  }

  if (el.versionPreviewExitBtn) {
    el.versionPreviewExitBtn.addEventListener("click", () => {
      if (!state.versionPreview.active) return;
      exitVersionPreview();
    });
  }

  if (el.versionHistoryBtn) {
    el.versionHistoryBtn.addEventListener("click", () => {
      openVersionModal();
    });
  }

  if (el.versionModalCloseBtn) {
    el.versionModalCloseBtn.addEventListener("click", () => {
      closeVersionModal();
    });
  }

  if (el.versionModal) {
    el.versionModal.addEventListener("click", (evt) => {
      if (evt.target === el.versionModal) closeVersionModal();
    });
  }

  if (el.authOpenBtn) {
    el.authOpenBtn.addEventListener("click", () => {
      showAuthModal();
    });
  }

  if (el.authCancelBtn) {
    el.authCancelBtn.addEventListener("click", () => {
      hideAuthModal();
    });
  }

  if (el.authLogoutBtn) {
    el.authLogoutBtn.addEventListener("click", async () => {
      setCollabToken("");
      collabState.user = null;
      closeCollabSocket();
      collabState.currentBookVersion = 0;
      hideAuthModal();
      await reloadWorkspaceByMode();
    });
  }

  if (el.authRenameBtn) {
    el.authRenameBtn.addEventListener("click", async () => {
      if (!collabState.user) {
        showAuthModal();
        return;
      }
      const currentName = String(collabState.user.displayName || "").trim();
      const input = window.prompt("请输入新的昵称", currentName);
      if (input == null) return;
      const nextName = String(input || "").trim();
      if (!nextName) {
        alert("昵称不能为空");
        return;
      }
      if (nextName === currentName) return;

      const originalText = el.authRenameBtn.textContent || "修改昵称";
      el.authRenameBtn.disabled = true;
      el.authRenameBtn.textContent = "保存中...";
      try {
        const data = await collabFetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: nextName })
        });
        if (data?.token) setCollabToken(data.token);
        if (data?.user) {
          collabState.user = data.user;
        } else {
          const me = await collabFetch("/api/auth/me");
          collabState.user = me?.user || collabState.user;
        }
        updateAuthUi();
        alert("昵称已更新");
      } catch (err) {
        alert(err?.message || "更新昵称失败");
      } finally {
        el.authRenameBtn.disabled = false;
        el.authRenameBtn.textContent = originalText;
      }
    });
  }

  if (el.authModal) {
    el.authModal.addEventListener("click", (evt) => {
      if (evt.target === el.authModal) {
        hideAuthModal();
      }
    });
  }

  async function submitAuth(kind) {
    const email = String(el.authEmailInput?.value || "").trim();
    const password = String(el.authPasswordInput?.value || "");
    const displayName = String(el.authDisplayNameInput?.value || "").trim();
    if (!email || !password) {
      alert("请输入邮箱和密码");
      return;
    }
    const targetBtn = kind === "login" ? el.authLoginSubmitBtn : el.authRegisterSubmitBtn;
    const originalText = targetBtn?.textContent || "提交";
    if (targetBtn) {
      targetBtn.disabled = true;
      targetBtn.textContent = kind === "login" ? "登录中..." : "注册中...";
    }

    try {
      const body = { email, password };
      if (kind === "register" && displayName) body.displayName = displayName;
      const data = await collabFetch(`/api/auth/${kind === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      setCollabToken(data?.token || "");
      collabState.user = data?.user || null;
      if (!collabState.token || !collabState.user) {
        throw new Error("登录状态无效，请重试");
      }
      connectCollabSocket();
      hideAuthModal();
      await reloadWorkspaceByMode();
    } catch (err) {
      alert(err?.message || (kind === "login" ? "登录失败" : "注册失败"));
    } finally {
      if (targetBtn) {
        targetBtn.disabled = false;
        targetBtn.textContent = originalText;
      }
    }
  }

  if (el.authLoginSubmitBtn) {
    el.authLoginSubmitBtn.addEventListener("click", async () => {
      await submitAuth("login");
    });
  }

  if (el.authRegisterSubmitBtn) {
    el.authRegisterSubmitBtn.addEventListener("click", async () => {
      await submitAuth("register");
    });
  }

  if (el.shareBookBtn) {
    el.shareBookBtn.addEventListener("click", async () => {
      if (!currentBookId) {
        alert("请先打开一本书籍");
        return;
      }
      if (!isCollabMode()) {
        alert("请先登录协作账号");
        return;
      }
      try {
        const meta = getBookMetaById(currentBookId);
        await openCollabMembersModal(meta || { id: currentBookId, name: "当前书籍", role: getCurrentBookRole() });
      } catch (err) {
        alert(err?.message || "打开协作面板失败");
      }
    });
  }

  if (el.collabMembersCloseBtn) {
    el.collabMembersCloseBtn.addEventListener("click", () => {
      closeCollabMembersModal();
    });
  }

  if (el.collabMembersModal) {
    el.collabMembersModal.addEventListener("click", (evt) => {
      if (evt.target === el.collabMembersModal) {
        closeCollabMembersModal();
      }
    });
  }

  if (el.collabAddOwnerBtn) {
    el.collabAddOwnerBtn.addEventListener("click", async () => {
      try {
        await inviteBookMember("owner");
      } catch (err) {
        alert(err?.message || "邀请失败");
      }
    });
  }

  if (el.collabAddEditorBtn) {
    el.collabAddEditorBtn.addEventListener("click", async () => {
      try {
        await inviteBookMember("editor");
      } catch (err) {
        alert(err?.message || "邀请失败");
      }
    });
  }

  if (el.collabAddViewerBtn) {
    el.collabAddViewerBtn.addEventListener("click", async () => {
      try {
        await inviteBookMember("viewer");
      } catch (err) {
        alert(err?.message || "邀请失败");
      }
    });
  }

  if (el.renameImageBtn) {
    el.renameImageBtn.addEventListener("click", () => {
      startRenameSelectedImage();
    });
  }

  if (el.imageEditNameSaveBtn) {
    el.imageEditNameSaveBtn.addEventListener("click", () => {
      saveSelectedImageNameFromModal();
    });
  }

  if (el.imageEditIdSaveBtn) {
    el.imageEditIdSaveBtn.addEventListener("click", () => {
      saveSelectedImageIdFromModal();
    });
  }

  if (el.imageEditNameInput) {
    el.imageEditNameInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        saveSelectedImageNameFromModal();
      }
    });
  }

  if (el.imageEditIdInput) {
    el.imageEditIdInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        saveSelectedImageIdFromModal();
      }
    });
  }

  if (el.imageEditModalCloseBtn) {
    el.imageEditModalCloseBtn.addEventListener("click", () => {
      closeImageEditModal();
    });
  }

  if (el.imageEditModal) {
    el.imageEditModal.addEventListener("click", (evt) => {
      if (evt.target === el.imageEditModal) {
        closeImageEditModal();
      }
    });
  }

  if (el.viewerTitleInput) {
    el.viewerTitleInput.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        confirmRenameSelectedImage();
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        cancelRenameSelectedImage();
      }
    });
  }

  if (el.exportXmlBtn) {
    el.exportXmlBtn.addEventListener("click", () => {
      openExportFormatModal();
    });
  }

  if (el.exportAsXmlBtn) {
    el.exportAsXmlBtn.addEventListener("click", () => {
      try {
        exportProjectAsXml();
        closeExportFormatModal();
      } catch (err) {
        alert(err?.message || "导出失败");
      }
    });
  }

  if (el.exportAsCsvBtn) {
    el.exportAsCsvBtn.addEventListener("click", () => {
      try {
        exportGlyphRegistryCsv();
        closeExportFormatModal();
      } catch (err) {
        alert(err?.message || "导出失败");
      }
    });
  }

  if (el.cancelExportFormatBtn) {
    el.cancelExportFormatBtn.addEventListener("click", () => {
      closeExportFormatModal();
    });
  }

  if (el.exportFormatModal) {
    el.exportFormatModal.addEventListener("click", (evt) => {
      if (evt.target === el.exportFormatModal) closeExportFormatModal();
    });
  }

  window.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") {
      closeExportFormatModal();
      closeXmlHintsModal();
      closeCollabMembersModal();
      closeVersionModal();
      closeImageEditModal();
    }
  });

  if (el.autoDrawByAiBtn) {
    el.autoDrawByAiBtn.addEventListener("click", async () => {
      const original = el.autoDrawByAiBtn.textContent;
      el.autoDrawByAiBtn.disabled = true;
      el.autoDrawByAiBtn.textContent = "识别中";
      try {
        await autoDrawLayoutByAI();
        renderAll();
        saveState();
      } catch (err) {
        alert(err?.message || "自动画框失败");
      } finally {
        el.autoDrawByAiBtn.disabled = false;
        el.autoDrawByAiBtn.textContent = original;
      }
    });
  }

  if (el.feedXmlHintsBtn && el.feedXmlHintsInput) {
    el.feedXmlHintsBtn.addEventListener("click", () => {
      openXmlHintsModal();
    });

    if (el.xmlHintsAddBtn) {
      el.xmlHintsAddBtn.addEventListener("click", () => {
        el.feedXmlHintsInput.click();
      });
    }

    if (el.xmlHintsCloseBtn) {
      el.xmlHintsCloseBtn.addEventListener("click", () => {
        closeXmlHintsModal();
      });
    }

    if (el.xmlHintsModal) {
      el.xmlHintsModal.addEventListener("click", (evt) => {
        if (evt.target === el.xmlHintsModal) closeXmlHintsModal();
      });
    }

    el.feedXmlHintsInput.addEventListener("change", (evt) => {
      const files = evt.target.files;
      if (!files || files.length === 0) return;
      Promise.resolve()
        .then(async () => {
          await ingestXmlHintFiles(files);
          renderXmlHintsModalList();
          renderXmlHintInfo();
          renderAll();
          await saveState();
        })
        .catch((err) => {
          alert(err?.message || "XML 示例投喂失败");
        })
        .finally(() => {
          evt.target.value = "";
        });
    });
  }

  function bindUploadInput(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("change", (evt) => {
      if (!ensureCanEdit("上传图片")) {
        evt.target.value = "";
        return;
      }
      const file = evt.target.files?.[0];
      if (!file) return;
      Promise.resolve()
        .then(async () => {
          await importSelectedFile(file);
        })
        .catch((err) => {
          alert(err?.message || "导入失败");
        });
      evt.target.value = "";
    });
  }

  bindUploadInput(el.uploadInput);

  if (el.libraryImportInput) {
    el.libraryImportInput.addEventListener("change", (evt) => {
      const file = evt.target.files?.[0];
      if (!file) return;
      Promise.resolve()
        .then(async () => {
          await createBookFromImportedFile(file);
        })
        .catch((err) => {
          alert(err?.message || "新建书籍失败");
        });
      evt.target.value = "";
    });
  }

  el.startDrawBtn.addEventListener("click", () => {
    if (!ensureCanEdit("新增方框")) return;
    const activeTag = findTemplateTag(state.activeDraftTagId);
    const activeStyle = activeTag ? getTagStyle(activeTag) : null;
    if (!state.drawingActive && !state.glyphCreateActive && (!activeStyle || !activeStyle.color)) {
      alert("请先选择颜色");
      return;
    }

    state.glyphCreateActive = false;
    state.drawingActive = !state.drawingActive;
    state.draftRect = null;
    renderAll();
  });

  if (el.glyphStartCreateBtn) {
    el.glyphStartCreateBtn.addEventListener("click", () => {
      if (!ensureCanEdit("开始造字")) return;
      state.activeMainPanel = "glyph";
      if (state.glyphCreateActive) {
        state.glyphCreateActive = false;
        state.draftRect = null;
        state.glyphDraft = null;
      } else {
        state.drawingActive = false;
        state.pendingDrafts = [];
        state.draftRect = null;
        state.glyphCreateActive = true;
      }
      renderAll();
      saveState();
    });
  }

  if (el.glyphRuleBtn) {
    el.glyphRuleBtn.addEventListener("click", () => {
      showGlyphAllocationRules();
    });
  }

  if (el.glyphReselectBtn) {
    el.glyphReselectBtn.addEventListener("click", () => {
      if (!ensureCanEdit("重新框选")) return;
      state.activeMainPanel = "glyph";
      state.drawingActive = false;
      state.pendingDrafts = [];
      state.draftRect = null;
      state.glyphDraft = null;
      state.glyphCreateActive = true;
      renderAll();
      saveState();
    });
  }

  if (el.glyphAutoSuggestBtn) {
    el.glyphAutoSuggestBtn.addEventListener("click", async () => {
      const original = el.glyphAutoSuggestBtn.textContent;
      el.glyphAutoSuggestBtn.disabled = true;
      el.glyphAutoSuggestBtn.textContent = "识别中...";
      try {
        await suggestGlyphByAI();
      } catch (err) {
        alert(err?.message || "自动识别失败");
      } finally {
        el.glyphAutoSuggestBtn.disabled = false;
        el.glyphAutoSuggestBtn.textContent = original;
      }
    });
  }

  if (el.glyphIdsPatternApplyBtn) {
    el.glyphIdsPatternApplyBtn.addEventListener("click", () => {
      const pattern = el.glyphIdsPatternSelect?.value || "";
      if (!pattern || !el.glyphIdsInput) return;
      el.glyphIdsInput.value = `${el.glyphIdsInput.value || ""}${pattern}`;
      el.glyphIdsInput.focus();
    });
  }

  if (el.glyphAssignSaveBtn) {
    el.glyphAssignSaveBtn.addEventListener("click", async () => {
      if (!ensureCanEdit("保存造字")) return;
      const original = el.glyphAssignSaveBtn.textContent;
      el.glyphAssignSaveBtn.disabled = true;
      el.glyphAssignSaveBtn.textContent = "保存中...";
      try {
        const createdAnno = createGlyphAnnoFromDraft();
        await persistGlyphRecordToServer(createdAnno);
        renderAll();
        saveState();
        if (el.glyphCreateHint) {
          el.glyphCreateHint.textContent = "已保存到本地和数据库";
        }
      } catch (err) {
        alert(err?.message || "保存造字失败");
      } finally {
        el.glyphAssignSaveBtn.disabled = false;
        el.glyphAssignSaveBtn.textContent = original;
      }
    });
  }

  if (el.annoAutoSuggestBtn) {
    el.annoAutoSuggestBtn.addEventListener("click", async () => {
      const original = el.annoAutoSuggestBtn.textContent;
      el.annoAutoSuggestBtn.disabled = true;
      el.annoAutoSuggestBtn.textContent = "识别中";
      try {
        await suggestTranscriptionByAI();
      } catch (err) {
        alert(err?.message || "自动识别失败");
      } finally {
        el.annoAutoSuggestBtn.disabled = false;
        el.annoAutoSuggestBtn.textContent = original;
      }
    });
  }

  if (el.propMeaningAutoTranslateBtn) {
    el.propMeaningAutoTranslateBtn.addEventListener("click", async () => {
      const anno = selectedAnno();
      if (!anno) {
        alert("请先选中一个框");
        return;
      }
      if (!supportsMeaningAttrByTagId(anno.tagId)) {
        alert("仅模板树第3层及以下标签支持释义");
        return;
      }

      const original = el.propMeaningAutoTranslateBtn.textContent;
      el.propMeaningAutoTranslateBtn.disabled = true;
      el.propMeaningAutoTranslateBtn.textContent = "翻译中...";
      try {
        const imageDataUrl = cropRectToDataUrl(anno.rect);
        if (!imageDataUrl) {
          throw new Error("无法读取当前框对应图片");
        }
        const sourceText = await requestTranscriptionSuggestion(imageDataUrl);
        if (el.propNote) el.propNote.value = sourceText;
        const meaning = await suggestAttributeMeaning(
          "meaning",
          sourceText,
          anno.tagPath,
          sourceText
        );
        if (el.propMeaning) {
          el.propMeaning.value = meaning;
        }
      } catch (err) {
        alert(err?.message || "自动翻译失败");
      } finally {
        el.propMeaningAutoTranslateBtn.disabled = false;
        el.propMeaningAutoTranslateBtn.textContent = original;
      }
    });
  }

  el.deleteSelectedImagesBtn.addEventListener("click", () => {
    if (!ensureCanEdit("删除图片")) return;
    const selectedIds = new Set(state.batchDeleteImageIds);
    if (selectedIds.size === 0) {
      alert("请先勾选要删除的图片");
      return;
    }
    const remaining = state.images.filter((img) => !selectedIds.has(img.id));
    if (remaining.length === 0) {
      alert("至少保留一张图片");
      return;
    }
    if (!window.confirm(`确定批量删除 ${selectedIds.size} 张图片吗？`)) return;
    state.images = remaining;
    state.batchDeleteImageIds = [];
    if (!state.images.some((img) => img.id === state.selectedImageId)) {
      state.selectedImageId = state.images[0]?.id || null;
      state.selectedAnnoId = null;
      state.selectedTagFilterName = "";
    }
    renderAll();
    saveState();
  });

  el.clearDraftBtn.addEventListener("click", () => {
    if (!ensureCanEdit("清空草稿")) return;
    state.draftRect = null;
    state.pendingDrafts = [];
    state.drawingActive = false;
    state.glyphCreateActive = false;
    if (el.annoTranscription) el.annoTranscription.value = "";
    renderAll();
  });

  el.annoColor.addEventListener("input", () => {
    if (!canEditCurrentBook()) return;
    renderColorPreview(el.annoColor.value);
    if (!state.activeDraftTagId) return;
    syncStyleToTag(state.activeDraftTagId, el.annoShapeSelect.value, el.annoColor.value);
    renderBoxes();
    saveState();
  });

  el.annoColorPreview.addEventListener("click", () => {
    el.annoColor.click();
  });

  el.annoShapeSelect.addEventListener("change", () => {
    if (!canEditCurrentBook()) return;
    if (!state.activeDraftTagId) return;
    syncStyleToTag(state.activeDraftTagId, el.annoShapeSelect.value, el.annoColor.value);
    renderBoxes();
    saveState();
  });

  el.createDraftTagBtn.addEventListener("click", () => {
    if (!ensureCanEdit("新增标签")) return;
    const name = el.draftTagName.value.trim();
    const parentId = el.draftTagParent.value || null;
    const attrs = el.draftTagAttrs.value.trim();
    if (!name) {
      alert("请填写标签名称");
      return;
    }
    const newTag = { id: uid("tag"), name, parentId, attrs: attrs ? attrs.split(",").map((x) => x.trim()).filter(Boolean) : [], order: templateChildren(parentId).length + 1 };
    state.templateTags.push(newTag);
    ensureTemplateOrder();
    state.activeDraftTagId = newTag.id;
    if (el.addDraftTagToTemplate.checked) state.selectedTemplateTagId = newTag.id;
    el.draftTagName.value = "";
    el.draftTagAttrs.value = "";
    renderAll();
    saveState();
  });

  el.saveAnnoBtn.addEventListener("click", () => {
    if (!ensureCanEdit("保存标注")) return;
    const img = selectedImage();
    if (!img) return;
    if (state.pendingDrafts.length === 0) { alert("请先画至少一个框"); return; }
    const overlapCheck = validatePendingDraftsNoSameTagOverlap(img, state.pendingDrafts);
    if (!overlapCheck.ok) {
      alert(`保存失败：${overlapCheck.message}`);
      return;
    }

    const textEnabled = drawTextFieldsEnabled();
    const draftTranscription = textEnabled ? String(el.annoTranscription?.value || "").trim() : "";
    const draftMeaning = textEnabled ? String(el.annoMeaning?.value || "").trim() : "";

    const { lastAnnoId } = appendDraftsToAnnotations(img, state.pendingDrafts, {
      defaultTranscription: textEnabled ? draftTranscription : "",
      defaultMeaning: textEnabled ? draftMeaning : "",
      preferDraftText: false
    });

    state.selectedAnnoId = lastAnnoId;
    state.pendingDrafts = [];
    state.draftRect = null;
    state.drawingActive = false;
    if (el.annoTranscription) el.annoTranscription.value = "";
    if (el.annoMeaning) el.annoMeaning.value = "";
    renderAll();
    saveState();
  });

  el.saveCurrentPropsBtn.addEventListener("click", () => {
    if (!ensureCanEdit("保存属性")) return;
    const img = selectedImage();
    if (!img) return;
    const anno = selectedAnno();
    if (!anno) {
      Object.keys(state.propInputs).forEach((key) => { img.meta[key] = state.propInputs[key].value.trim(); });
      renderAll();
      saveState();
      return;
    }

    const nextTagId = String(state.objectStyleInputs?.tagId?.value || anno.tagId || "");
    if (nextTagId && nextTagId !== anno.tagId) {
      anno.tagId = nextTagId;
      const nextTag = findTemplateTag(nextTagId);
      anno.tagName = nextTag?.name || anno.tagName;
      anno.tagPath = templatePath(nextTagId) || anno.tagPath;
    }

    const nextAttrs = {};
    Object.keys(state.propInputs).forEach((key) => {
      setIfNotEmpty(nextAttrs, key, state.propInputs[key].value);
    });
    const nextMeaningEnabled = supportsMeaningAttrByTagId(anno.tagId);
    if (nextMeaningEnabled) {
      setIfNotEmpty(nextAttrs, "meaning", el.propMeaning?.value || "");
    }
    const prevAttrs = { ...(anno.attrs || {}) };
    anno.attrs = nextAttrs;
    ["codepoint", "codepointMap", "codepointSourceMap", "glyphChar", "glyphIds", "glyphNote", "meaning", "transcriptionMeaning"].forEach((key) => {
      if (prevAttrs[key]) anno.attrs[key] = prevAttrs[key];
    });
    if (nextMeaningEnabled) {
      anno.transcription = el.propNote.value.trim();
    }
    if (state.objectStyleInputs) {
      syncStyleForSameTagAnnos(
        anno,
        state.objectStyleInputs.borderStyle?.value || "solid",
        state.objectStyleInputs.color?.value || "#2e6f86",
        state.objectStyleInputs.borderWidth?.value || 2
      );
    }
    const idValue = (anno.attrs.id || "").trim();
    anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);
    renderAll();
    saveState();
  });

  el.templateTagSelect.addEventListener("change", () => {
    if (!canEditCurrentBook()) return;
    state.selectedTemplateTagId = el.templateTagSelect.value;
    renderTemplateAttrSelect();
    saveState();
  });

  el.addAttrBtn.addEventListener("click", () => {
    if (!ensureCanEdit("新增模板属性")) return;
    const tag = findTemplateTag(state.selectedTemplateTagId);
    const attr = el.newAttrForTemplateTag.value.trim();
    if (!tag || !attr) return;
    tag.attrs = tag.attrs || [];
    if (!tag.attrs.includes(attr)) {
      tag.attrs.push(attr);
      saveState();
      renderAll();
    }
    el.newAttrForTemplateTag.value = "";
  });

  el.deleteAttrBtn.addEventListener("click", () => {
    if (!ensureCanEdit("删除模板属性")) return;
    const tag = findTemplateTag(state.selectedTemplateTagId);
    const attr = el.templateAttrSelect.value;
    if (!tag || !attr) return;
    tag.attrs = (tag.attrs || []).filter((a) => a !== attr);
    saveState();
    renderAll();
  });

  el.deleteTagBtn.addEventListener("click", () => {
    if (!ensureCanEdit("删除模板标签")) return;
    const tag = findTemplateTag(state.selectedTemplateTagId);
    if (!tag) return;
    if (!window.confirm(`确定删除模板标签 ${tag.name} 及其子标签？`)) return;
    const removeIds = new Set();
    function collect(id) { removeIds.add(id); templateChildren(id).forEach((child) => collect(child.id)); }
    collect(tag.id);
    state.templateTags = state.templateTags.filter((item) => !removeIds.has(item.id));
    ensureTemplateOrder();
    state.selectedTemplateTagId = state.templateTags[0]?.id || null;
    saveState();
    renderAll();
  });

  function swapSibling(tagId, direction) {
    if (!canEditCurrentBook()) return;
    const tag = findTemplateTag(tagId);
    if (!tag) return;
    const siblings = templateChildren(tag.parentId);
    const idx = siblings.findIndex((s) => s.id === tag.id);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[nextIdx];
    const tempOrder = a.order;
    a.order = b.order;
    b.order = tempOrder;
    ensureTemplateOrder();
    saveState();
    renderAll();
  }

  el.tagMoveUpBtn.addEventListener("click", () => swapSibling(state.selectedTemplateTagId, -1));
  el.tagMoveDownBtn.addEventListener("click", () => swapSibling(state.selectedTemplateTagId, 1));
}

async function initApp() {
  bindDrawEvents();
  bindEvents();
  await bootstrapAuthUser();
  if (collabState.token) {
    connectCollabSocket();
  }
  await loadState();
  el.mainImage.addEventListener("load", () => {
    syncDrawLayerSize();
    renderBoxes();
  });
  window.addEventListener("resize", syncDrawLayerSize);
}

initApp().catch((err) => {
  alert(err?.message || "初始化失败");
});
renderColorPreview();
renderXmlHintInfo();
renderAll();
