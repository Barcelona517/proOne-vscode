const STORAGE_KEY = "guji_editor_v4";
const UNICODE_ALLOC_STORAGE_KEY = "guji_unicode_alloc_v1";
const LOCAL_PUA_START = 0xE000;
const LOCAL_PUA_END = 0xF8FF;
const UNICODE_ALLOC_API_CANDIDATES = [
  "/api/glyph/allocate",
  "/api/unicode/allocate",
  "http://localhost:3000/api/glyph/allocate"
];

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
  draftRect: null,
  recognizeRect: null,
  pendingDrafts: [],
  recognizeSelecting: false,
  activeDraftTagId: null,
  activeRightPanel: "object",
  pendingUnicodeAfterSave: false,
  propInputs: {},
  draggingThumbId: null,
  batchDeleteImageIds: []
};

const el = {
  thumbList: document.getElementById("thumbList"),
  mainImage: document.getElementById("mainImage"),
  drawLayer: document.getElementById("drawLayer"),
  viewerTitle: document.getElementById("viewerTitle"),
  panelBtnObject: document.getElementById("panelBtnObject"),
  panelBtnDraw: document.getElementById("panelBtnDraw"),
  panelBtnTags: document.getElementById("panelBtnTags"),
  sectionProps: document.getElementById("sectionProps"),
  sectionDraw: document.getElementById("sectionDraw"),
  sectionTags: document.getElementById("sectionTags"),
  currentTargetHint: document.getElementById("currentTargetHint"),
  propsEditor: document.getElementById("propsEditor"),
  propNote: document.getElementById("propNote"),
  unicodeAllocArea: document.getElementById("unicodeAllocArea"),
  propCodepoint: document.getElementById("propCodepoint"),
  allocateUnicodeBtn: document.getElementById("allocateUnicodeBtn"),
  unicodeHint: document.getElementById("unicodeHint"),
  saveCurrentPropsBtn: document.getElementById("saveCurrentPropsBtn"),
  editModeArea: document.getElementById("editModeArea"),
  drawState: document.getElementById("drawState"),
  startDrawBtn: document.getElementById("startDrawBtn"),
  clearDraftBtn: document.getElementById("clearDraftBtn"),
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
  annoTranscription: document.getElementById("annoTranscription"),
  recognizeResult: document.getElementById("recognizeResult"),
  startRecognizeRectBtn: document.getElementById("startRecognizeRectBtn"),
  recognizeSingleBtn: document.getElementById("recognizeSingleBtn"),
  recognizeHint: document.getElementById("recognizeHint"),
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
  uploadInput: document.getElementById("uploadInput"),
  uploadBtn: document.getElementById("uploadBtn")
};

function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function encodePath(path) { return path.split("/").map((part) => encodeURIComponent(part)).join("/"); }
function fileToDisplayName(path) { return path.split("/").pop() || path; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function normalizeRect(rect) {
  const x1 = Math.min(rect.x1, rect.x2);
  const y1 = Math.min(rect.y1, rect.y2);
  const x2 = Math.max(rect.x1, rect.x2);
  const y2 = Math.max(rect.y1, rect.y2);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function toShapeRect(base, shape) {
  const rect = { ...base };
  if (shape === "line" || shape === "wave") {
    rect.h = Math.max(rect.h, 0.006);
  }
  return rect;
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
      anno.shape = tag.style.shape;
      anno.color = tag.style.color;
    }
    anno.color = anno.color || "#2e6f86";
    anno.shape = anno.shape || "rect";
    anno.id = anno.id || `anno_${index + 1}`;
    anno.transcription = anno.transcription || "";
    anno.parentAnnoId = anno.parentAnnoId || null;
  });
}

function setIfNotEmpty(obj, key, value) {
  const trimmed = (value || "").trim();
  if (trimmed) obj[key] = trimmed;
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
  el.unicodeHint.textContent = message || "选中框后可为未收录字分配编码";
}

function setRecognizeHint(message) {
  if (!el.recognizeHint) return;
  el.recognizeHint.textContent = message || "用于识别单字并填入简体转写";
}

function isCjkChar(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x3400 && cp <= 0x4DBF) || (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0xF900 && cp <= 0xFAFF);
}

function extractFirstSingleChar(text) {
  const chars = [...(text || "")].filter((ch) => isCjkChar(ch) || isPuaChar(ch));
  return chars[0] || "";
}

function resolveCollectedSimplifiedChar(ch) {
  if (!ch) return null;
  if (TRADITIONAL_CHAR_MAP[ch]) return TRADITIONAL_CHAR_MAP[ch];
  if (isPuaChar(ch)) return null;
  if (isCjkChar(ch)) return ch;
  return null;
}

function cpToUPlus(cp) {
  return `U+${cp.toString(16).toUpperCase()}`;
}

function parseJsonSafely(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function isPuaChar(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0xE000 && cp <= 0xF8FF) || (cp >= 0xF0000 && cp <= 0xFFFFD) || (cp >= 0x100000 && cp <= 0x10FFFD);
}

function getUnallocatedRareChars(anno) {
  const text = (anno?.transcription || "").trim();
  if (!text) return [];
  const map = parseJsonSafely(anno?.attrs?.codepointMap || "{}", {});
  return [...new Set([...text].filter((ch) => isPuaChar(ch) && !map[ch]))];
}

function getLocalAllocStore() {
  const raw = localStorage.getItem(UNICODE_ALLOC_STORAGE_KEY);
  const parsed = parseJsonSafely(raw, null);
  if (!parsed || typeof parsed !== "object") {
    return { charToCodepoint: {}, nextCp: LOCAL_PUA_START };
  }
  parsed.charToCodepoint = parsed.charToCodepoint || {};
  if (!Number.isInteger(parsed.nextCp)) parsed.nextCp = LOCAL_PUA_START;
  return parsed;
}

function saveLocalAllocStore(store) {
  localStorage.setItem(UNICODE_ALLOC_STORAGE_KEY, JSON.stringify(store));
}

function allocateLocalPuaForChar(ch) {
  const store = getLocalAllocStore();
  const existing = store.charToCodepoint[ch];
  if (existing) return { codepoint: existing, allocatedFrom: "local-cache" };

  let cp = store.nextCp;
  while (cp <= LOCAL_PUA_END) {
    const candidate = cpToUPlus(cp);
    const used = Object.values(store.charToCodepoint).includes(candidate);
    if (!used) {
      store.charToCodepoint[ch] = candidate;
      store.nextCp = cp + 1;
      saveLocalAllocStore(store);
      return { codepoint: candidate, allocatedFrom: "local-pua" };
    }
    cp += 1;
  }
  throw new Error("本地 PUA 编码池已耗尽");
}

async function tryAllocateFromApi(ch, anno) {
  const img = selectedImage();
  for (const url of UNICODE_ALLOC_API_CANDIDATES) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glyph: ch,
          normalizedKey: `char-${ch.codePointAt(0).toString(16)}`,
          ids: anno.attrs?.ids || null,
          radicalId: Number.parseInt(anno.attrs?.radicalId || "", 10) || 1,
          pronunciation: anno.attrs?.pronunciation || null,
          sourcePage: img?.name || null,
          confidenceScore: 0.6
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const cp = data?.codepoint || data?.allocated_cp || data?.ucode || null;
      if (cp && /^U\+[0-9A-Fa-f]+$/.test(cp)) {
        return { codepoint: cp.toUpperCase(), allocatedFrom: data?.allocated_from || "api" };
      }
    } catch (_) {
      // Try next candidate endpoint.
    }
  }
  return null;
}

async function allocateUnicodeForCurrentAnno() {
  const anno = selectedAnno();
  if (!anno) throw new Error("请先选中一个已保存框");

  const text = (anno.transcription || "").trim();
  if (!text) throw new Error("当前框“简体形式”为空，无法分配编码");

  const targets = [...new Set([...text].filter((ch) => isPuaChar(ch)))];
  if (targets.length === 0) {
    throw new Error("当前框没有未收录字（PUA字符），无需分配");
  }

  const allocMap = parseJsonSafely(anno.attrs?.codepointMap || "{}", {});
  const sourceMap = parseJsonSafely(anno.attrs?.codepointSourceMap || "{}", {});

  for (const ch of targets) {
    if (allocMap[ch]) continue;
    const apiAllocated = await tryAllocateFromApi(ch, anno);
    if (apiAllocated) {
      allocMap[ch] = apiAllocated.codepoint;
      sourceMap[ch] = apiAllocated.allocatedFrom;
      continue;
    }
    const localAllocated = allocateLocalPuaForChar(ch);
    allocMap[ch] = localAllocated.codepoint;
    sourceMap[ch] = localAllocated.allocatedFrom;
  }

  anno.attrs = anno.attrs || {};
  anno.attrs.codepointMap = JSON.stringify(allocMap);
  anno.attrs.codepointSourceMap = JSON.stringify(sourceMap);
  anno.attrs.codepoint = allocMap[targets[0]] || "";

  const summary = targets.map((ch) => `${ch}:${allocMap[ch]}`).join("; ");
  return summary;
}

function getRecognitionTargetRect() {
  if (state.recognizeRect) {
    return { rect: state.recognizeRect, source: "recognize" };
  }
  return null;
}

function rectToCanvasCrop(rect) {
  const imgEl = el.mainImage;
  if (!imgEl || !imgEl.complete || !imgEl.naturalWidth || !imgEl.naturalHeight) return null;

  const sx = Math.max(0, Math.floor(rect.x * imgEl.naturalWidth));
  const sy = Math.max(0, Math.floor(rect.y * imgEl.naturalHeight));
  const sw = Math.max(1, Math.floor(rect.w * imgEl.naturalWidth));
  const sh = Math.max(1, Math.floor(rect.h * imgEl.naturalHeight));

  const maxW = imgEl.naturalWidth - sx;
  const maxH = imgEl.naturalHeight - sy;
  const cw = Math.max(1, Math.min(sw, maxW));
  const ch = Math.max(1, Math.min(sh, maxH));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(imgEl, sx, sy, cw, ch, 0, 0, cw, ch);
  return canvas;
}

function buildOcrVariants(baseCanvas) {
  const variants = [{ canvas: baseCanvas, name: "raw" }];

  const scaleCanvas = document.createElement("canvas");
  scaleCanvas.width = Math.max(1, baseCanvas.width * 2);
  scaleCanvas.height = Math.max(1, baseCanvas.height * 2);
  const sctx = scaleCanvas.getContext("2d");
  if (!sctx) return variants;

  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(baseCanvas, 0, 0, scaleCanvas.width, scaleCanvas.height);

  const imgData = sctx.getImageData(0, 0, scaleCanvas.width, scaleCanvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.35 + data[i + 1] * 0.5 + data[i + 2] * 0.15);
    const boosted = gray > 150 ? 255 : 0;
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }
  sctx.putImageData(imgData, 0, 0);
  variants.push({ canvas: scaleCanvas, name: "binary2x" });

  const likelyVertical = baseCanvas.height > baseCanvas.width * 1.15;
  if (likelyVertical) {
    variants.push({ canvas: rotateCanvas(baseCanvas, 90), name: "raw-r90" });
    variants.push({ canvas: rotateCanvas(baseCanvas, -90), name: "raw-r270" });
    variants.push({ canvas: rotateCanvas(scaleCanvas, 90), name: "binary2x-r90" });
    variants.push({ canvas: rotateCanvas(scaleCanvas, -90), name: "binary2x-r270" });
  }

  return variants;
}

function rotateCanvas(srcCanvas, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));

  const outW = Math.max(1, Math.round(srcCanvas.width * absCos + srcCanvas.height * absSin));
  const outH = Math.max(1, Math.round(srcCanvas.width * absSin + srcCanvas.height * absCos));
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;

  const ctx = out.getContext("2d");
  if (!ctx) return srcCanvas;
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(rad);
  ctx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);
  return out;
}

function normalizeOcrCandidateText(text) {
  return (text || "")
    .replace(/\s+/g, "")
    .replace(/[|｜]/g, "一")
    .replace(/[“”]/g, "")
    .trim();
}

function scoreOcrText(text) {
  const cjk = (text.match(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g) || []).length;
  const dash = (text.match(/-/g) || []).length;
  return cjk * 4 + text.length - dash;
}

async function recognizeBestTextFromCanvas(cropCanvas) {
  const variants = buildOcrVariants(cropCanvas);
  const languages = ["chi_tra", "chi_tra+chi_sim", "chi_sim+chi_tra"];
  const configs = [
    { tessedit_pageseg_mode: "5", preserve_interword_spaces: "1" },
    { tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" },
    { tessedit_pageseg_mode: "11", preserve_interword_spaces: "1" }
  ];

  let best = "";
  let bestScore = -1;

  for (const variant of variants) {
    for (const lang of languages) {
      for (const cfg of configs) {
        try {
          const res = await window.Tesseract.recognize(variant.canvas, lang, {
            tessedit_pageseg_mode: cfg.tessedit_pageseg_mode,
            preserve_interword_spaces: cfg.preserve_interword_spaces
          });
          const candidate = normalizeOcrCandidateText(res?.data?.text || "");
          const confidence = Number(res?.data?.confidence || 0);
          const score = scoreOcrText(candidate) + confidence / 25;
          if (score > bestScore) {
            bestScore = score;
            best = candidate;
          }
        } catch (_) {
          // Continue trying other OCR variants.
        }
      }
    }
  }

  return best;
}

async function recognizeTextFromCurrentRect() {
  const target = getRecognitionTargetRect();
  if (!target) {
    throw new Error("请先点击开始勾选，在图片上框选后再识别");
  }

  if (!window.Tesseract) {
    throw new Error("OCR 组件未加载，请检查网络后刷新页面");
  }

  const cropCanvas = rectToCanvasCrop(target.rect);
  if (!cropCanvas) {
    throw new Error("当前图片尚未加载完成，请稍后重试");
  }

  const text = await recognizeBestTextFromCanvas(cropCanvas);
  if (!text) {
    throw new Error("未识别到文字，请调整框选范围后重试");
  }
  return text;
}

function renderRightPanelTabs() {
  const active = ["object", "draw", "tags"].includes(state.activeRightPanel) ? state.activeRightPanel : "object";
  state.activeRightPanel = active;

  el.panelBtnObject.classList.toggle("active", active === "object");
  el.panelBtnDraw.classList.toggle("active", active === "draw");
  el.panelBtnTags.classList.toggle("active", active === "tags");

  el.sectionProps.classList.toggle("active", active === "object");
  el.sectionDraw.classList.toggle("active", active === "draw");
  el.sectionTags.classList.toggle("active", active === "tags");

}

function syncDrawLayerSize() {
  const w = el.mainImage.clientWidth || 0;
  const h = el.mainImage.clientHeight || 0;
  el.drawLayer.style.width = `${w}px`;
  el.drawLayer.style.height = `${h}px`;
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

function pointInRect(rect, x, y) {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
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
  return tag.style || null;
}

function syncStyleToTag(tagId, shape, color) {
  const tag = findTemplateTag(tagId);
  if (!tag) return;
  tag.style = { shape, color };
  state.images.forEach((img) => {
    img.annotations.forEach((anno) => {
      if (anno.tagId === tagId) {
        anno.shape = shape;
        anno.color = color;
      }
    });
  });
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
  el.annoShapeSelect.value = style.shape;
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
  hits.sort((a, b) => {
    const depthDiff = templateDepth(b.tagId) - templateDepth(a.tagId);
    if (depthDiff !== 0) return depthDiff;
    return annoArea(a) - annoArea(b);
  });
  return hits[0];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    images: state.images,
    templateTags: state.templateTags,
    selectedImageId: state.selectedImageId,
    selectedTemplateTagId: state.selectedTemplateTagId,
    activeRightPanel: state.activeRightPanel
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.images) && parsed.images.length > 0 && Array.isArray(parsed.templateTags)) {
        state.images = parsed.images;
        state.templateTags = parsed.templateTags;
        state.selectedImageId = parsed.selectedImageId || parsed.images[0].id;
        state.selectedTemplateTagId = parsed.selectedTemplateTagId || parsed.templateTags[0]?.id || null;
        state.activeRightPanel = parsed.activeRightPanel || "object";
        ensureTemplateOrder();
        state.images.forEach((img, idx) => ensureImageMeta(img, idx));
        return;
      }
    } catch (_) {}
  }

  state.images = seedImages.map((item, idx) => ({
    id: `seed_${idx + 1}`,
    name: fileToDisplayName(item.path),
    src: encodePath(item.path),
    category: item.category,
    contentElement: item.element,
    contentKind: item.kind,
    meta: { id: `img_${idx + 1}` },
    annotations: []
  }));
  state.templateTags = templateDefaults.map((tag, idx) => ({ ...tag, order: idx + 1 }));
  ensureTemplateOrder();
  state.selectedImageId = state.images[0]?.id || null;
  state.selectedTemplateTagId = state.templateTags[0]?.id || null;
  state.activeRightPanel = "object";
}

function renderThumbs() {
  el.thumbList.innerHTML = "";
  const selectedForDelete = new Set(state.batchDeleteImageIds);
  state.images.forEach((img) => {
    const card = document.createElement("div");
    card.className = `thumb-item ${img.id === state.selectedImageId ? "active" : ""}`;
    card.draggable = true;
    card.dataset.imageId = img.id;
    card.innerHTML = `
      <div class="thumb-head">
        <label class="thumb-select"><input type="checkbox" data-select-id="${img.id}" ${selectedForDelete.has(img.id) ? "checked" : ""} />选中</label>
        <button class="thumb-delete-btn" data-id="${img.id}">删除</button>
      </div>
      <img src="${img.src}" alt="${img.name}" />
      <div class="thumb-meta">${img.name}</div>
      <div class="thumb-meta">id:${img.meta.id}</div>
    `;

    card.addEventListener("dragstart", (evt) => {
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
      renderAll();
    });

    const selectCheckbox = card.querySelector(`input[data-select-id="${img.id}"]`);
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

    card.querySelector("button[data-id]").addEventListener("click", (evt) => {
      evt.stopPropagation();
      if (state.images.length <= 1) {
        alert("至少保留一张图片");
        return;
      }
      if (!window.confirm(`确定删除图片：${img.name}?`)) return;
      state.images = state.images.filter((it) => it.id !== img.id);
      state.batchDeleteImageIds = state.batchDeleteImageIds.filter((id) => id !== img.id);
      if (state.selectedImageId === img.id) state.selectedImageId = state.images[0]?.id || null;
      state.selectedAnnoId = null;
      state.selectedTagFilterName = "";
      renderAll();
      saveState();
    });

    el.thumbList.appendChild(card);
  });
}

function renderMainImage() {
  const img = selectedImage();
  if (!img) {
    el.mainImage.removeAttribute("src");
    el.viewerTitle.textContent = "未选择图片";
    syncDrawLayerSize();
    return;
  }
  if (el.mainImage.src !== img.src) {
    el.mainImage.src = img.src;
  }
  el.viewerTitle.textContent = `${img.name} | id:${img.meta.id}`;
  syncDrawLayerSize();
}

function renderBoxes() {
  const img = selectedImage();
  el.drawLayer.innerHTML = "";
  if (!img) return;
  const parentMap = getParentMap(img);

  img.annotations.forEach((anno) => {
    const box = document.createElement("div");
    box.className = `box shape-${anno.shape}`;
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
    if (anno.shape === "rect") {
      box.style.borderColor = anno.color;
      box.style.background = hexToRgba(anno.color, 0.18);
    } else if (anno.shape === "line") {
      box.style.background = "none";
      box.style.borderTop = `3px solid ${anno.color}`;
    } else {
      box.style.background = `repeating-linear-gradient(-45deg, ${anno.color} 0 4px, transparent 4px 8px)`;
    }
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
    if (anno.id === state.selectedAnnoId) {
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
    const draft = document.createElement("div");
    draft.className = `box temp shape-${el.annoShapeSelect.value}`;
    draft.style.left = `${state.draftRect.x * 100}%`;
    draft.style.top = `${state.draftRect.y * 100}%`;
    draft.style.width = `${state.draftRect.w * 100}%`;
    draft.style.height = `${state.draftRect.h * 100}%`;
    draft.style.setProperty("--shape-color", el.annoColor.value);
    if (el.annoShapeSelect.value === "rect") {
      draft.style.borderColor = el.annoColor.value;
      draft.style.background = hexToRgba(el.annoColor.value, 0.18);
    } else if (el.annoShapeSelect.value === "line") {
      draft.style.background = "none";
      draft.style.borderTop = `3px dashed ${el.annoColor.value}`;
    } else {
      draft.style.background = `repeating-linear-gradient(-45deg, ${el.annoColor.value} 0 4px, transparent 4px 8px)`;
    }
    el.drawLayer.appendChild(draft);
  }

  state.pendingDrafts.forEach((draftItem) => {
    const draft = document.createElement("div");
    draft.className = `box temp shape-${draftItem.shape}`;
    draft.style.left = `${draftItem.rect.x * 100}%`;
    draft.style.top = `${draftItem.rect.y * 100}%`;
    draft.style.width = `${draftItem.rect.w * 100}%`;
    draft.style.height = `${draftItem.rect.h * 100}%`;
    draft.style.setProperty("--shape-color", draftItem.color);
    if (draftItem.shape === "rect") {
      draft.style.borderColor = draftItem.color;
      draft.style.background = hexToRgba(draftItem.color, 0.18);
    } else if (draftItem.shape === "line") {
      draft.style.background = "none";
      draft.style.borderTop = `3px dashed ${draftItem.color}`;
    } else {
      draft.style.background = `repeating-linear-gradient(-45deg, ${draftItem.color} 0 4px, transparent 4px 8px)`;
    }
    draft.title = `待保存: ${draftItem.tagPath}`;
    el.drawLayer.appendChild(draft);
  });

  if (state.recognizeRect) {
    const r = document.createElement("div");
    r.className = "box recognize-box";
    r.style.left = `${state.recognizeRect.x * 100}%`;
    r.style.top = `${state.recognizeRect.y * 100}%`;
    r.style.width = `${state.recognizeRect.w * 100}%`;
    r.style.height = `${state.recognizeRect.h * 100}%`;
    r.title = "自动识别框（单字）";
    el.drawLayer.appendChild(r);
  }
}

function renderPropsEditor() {
  const img = selectedImage();
  const anno = selectedAnno();
  el.propsEditor.innerHTML = "";
  state.propInputs = {};
  if (!img) return;

  if (!anno) {
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
    el.propCodepoint.value = "";
    el.allocateUnicodeBtn.disabled = true;
    el.allocateUnicodeBtn.classList.remove("active");
    el.unicodeAllocArea.classList.remove("active");
    setUnicodeHint("");
    return;
  }

  el.propNote.disabled = false;
  el.currentTargetHint.textContent = `当前：框 (${anno.tagPath})`;
  const templateTag = findTemplateTag(anno.tagId);
  const attrs = templateTag?.attrs?.length ? templateTag.attrs : ["id"];
  attrs.forEach((key) => {
    const row = document.createElement("div");
    row.className = "prop-row";
    row.innerHTML = `<span>${key}</span>`;
    const input = document.createElement("input");
    input.value = anno.attrs[key] || "";
    state.propInputs[key] = input;
    row.appendChild(input);
    el.propsEditor.appendChild(row);
  });
  el.propNote.value = anno.transcription || "";
  el.propCodepoint.value = anno.attrs?.codepoint || "";

  const unallocatedRareChars = getUnallocatedRareChars(anno);
  if (unallocatedRareChars.length > 0) {
    el.unicodeAllocArea.classList.add("active");
    el.allocateUnicodeBtn.classList.add("active");
    el.allocateUnicodeBtn.disabled = false;
    setUnicodeHint(`检测到未收录字：${unallocatedRareChars.join(" ")}，可分配编码`);
  } else {
    el.unicodeAllocArea.classList.remove("active");
    el.allocateUnicodeBtn.classList.remove("active");
    el.allocateUnicodeBtn.disabled = true;
    el.propCodepoint.value = "";
    setUnicodeHint("当前框无未收录生僻字，无需分配编码");
  }
}

function renderEditMode() {
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
    el.drawState.textContent = count > 0 ? `待保存 ${count} 个框，点击保存标注统一保存` : "先选择标签和画框样式，再点击“开始添加”按钮";
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
  if (!state.activeDraftTagId) {
    el.selectedTagInfo.textContent = "未选择标签";
    return;
  }
  el.selectedTagInfo.textContent = `已选择标签：${templatePath(state.activeDraftTagId)}`;
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
  renderRightPanelTabs();
}

function bindDrawEvents() {
  let drawing = false;
  let start = null;
  let mode = null;

  el.drawLayer.addEventListener("mousedown", (evt) => {
    if (!selectedImage()) return;
    if (!state.drawingActive && !state.recognizeSelecting) return;
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((evt.clientX - rect.left) / rect.width);
    const y = clamp01((evt.clientY - rect.top) / rect.height);
    drawing = true;
    mode = state.recognizeSelecting ? "recognize" : "draw";
    start = { x, y };
  });

  window.addEventListener("mousemove", (evt) => {
    if (drawing && start) {
      const rect = el.drawLayer.getBoundingClientRect();
      const x = clamp01((evt.clientX - rect.left) / rect.width);
      const y = clamp01((evt.clientY - rect.top) / rect.height);
      const base = normalizeRect({ x1: start.x, y1: start.y, x2: x, y2: y });
      if (mode === "recognize") {
        state.recognizeRect = toShapeRect(base, "rect");
      } else {
        state.draftRect = toShapeRect(base, el.annoShapeSelect.value);
      }
      renderBoxes();
      renderEditMode();
    }
  });

  window.addEventListener("mouseup", () => {
    if (drawing && start) {
      if (mode === "recognize" && state.recognizeRect && state.recognizeRect.w >= 0.003 && state.recognizeRect.h >= 0.003) {
        state.recognizeSelecting = false;
        if (el.startRecognizeRectBtn) el.startRecognizeRectBtn.textContent = "重新勾选";
        setRecognizeHint("识别框已就绪，点击自动识别");
      }

      if (mode === "draw" && state.draftRect) {
        const tag = findTemplateTag(state.activeDraftTagId);
        if (tag && state.draftRect.w >= 0.003 && state.draftRect.h >= 0.003) {
          const style = getTagStyle(tag) || { shape: el.annoShapeSelect.value, color: el.annoColor.value };
          if (!getTagStyle(tag)) syncStyleToTag(tag.id, style.shape, style.color);
          state.pendingDrafts.push({
            rect: { ...state.draftRect },
            tagId: tag.id,
            tagName: tag.name,
            tagPath: templatePath(tag.id),
            shape: style.shape,
            color: style.color
          });
        }
        state.draftRect = null;
      }

      renderBoxes();
      renderEditMode();
    }
    drawing = false;
    start = null;
    mode = null;
  });

  el.drawLayer.addEventListener("click", (evt) => {
    if (!state.drawingActive) {
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
}

function bindEvents() {
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

  el.uploadBtn.addEventListener("click", () => el.uploadInput.click());

  el.uploadInput.addEventListener("change", (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = {
        id: uid("upload"),
        name: file.name,
        src: reader.result,
        category: "用户上传",
        contentElement: "page",
        contentKind: "图片",
        meta: { id: uid("img") },
        annotations: []
      };
      state.images.push(img);
      state.selectedImageId = img.id;
      state.selectedAnnoId = null;
      state.selectedTagFilterName = "";
      renderAll();
      saveState();
    };
    reader.readAsDataURL(file);
    evt.target.value = "";
  });

  el.startDrawBtn.addEventListener("click", () => {
    state.drawingActive = !state.drawingActive;
    state.draftRect = null;
    renderAll();
  });

  el.deleteSelectedImagesBtn.addEventListener("click", () => {
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
    state.draftRect = null;
    state.pendingDrafts = [];
    state.drawingActive = false;
    state.pendingUnicodeAfterSave = false;
    state.recognizeSelecting = false;
    state.recognizeRect = null;
    el.annoTranscription.value = "";
    if (el.recognizeResult) el.recognizeResult.value = "";
    if (el.startRecognizeRectBtn) el.startRecognizeRectBtn.textContent = "开始勾选";
    setRecognizeHint("");
    renderAll();
  });

  if (el.startRecognizeRectBtn) {
    el.startRecognizeRectBtn.addEventListener("click", () => {
      state.recognizeSelecting = !state.recognizeSelecting;
      state.recognizeRect = null;
      el.startRecognizeRectBtn.textContent = state.recognizeSelecting ? "取消勾选" : "开始勾选";
      setRecognizeHint(state.recognizeSelecting ? "请在图片上拖拽框选单字" : "点击开始勾选后，在图片上框选单字，再点自动识别");
      renderBoxes();
    });
  }

  if (el.recognizeSingleBtn) {
    el.recognizeSingleBtn.addEventListener("click", async () => {
      const original = el.recognizeSingleBtn.textContent;
      el.recognizeSingleBtn.disabled = true;
      el.recognizeSingleBtn.textContent = "识别中...";
      setRecognizeHint("正在识别单字...");
      try {
        const recognizedText = await recognizeTextFromCurrentRect();
        const pickedChar = extractFirstSingleChar(recognizedText);
        if (!pickedChar) {
          setRecognizeHint("未识别到可用单字，请调整框选后重试");
          return;
        }

        const simplifiedChar = resolveCollectedSimplifiedChar(pickedChar);
        if (simplifiedChar) {
          el.recognizeResult.value = simplifiedChar;
          el.annoTranscription.value = simplifiedChar;
          state.pendingUnicodeAfterSave = false;
          setRecognizeHint(`识别成功：${pickedChar} -> ${simplifiedChar}`);
        } else {
          el.recognizeResult.value = pickedChar;
          el.annoTranscription.value = pickedChar;
          state.pendingUnicodeAfterSave = true;
          setRecognizeHint("该字未被收录，请先保存标注，随后进入分配unicode环节");
        }
      } catch (err) {
        setRecognizeHint(err?.message || "识别失败，请重试");
      } finally {
        el.recognizeSingleBtn.disabled = false;
        el.recognizeSingleBtn.textContent = original;
      }
    });
  }

  if (el.allocateUnicodeBtn) {
    el.allocateUnicodeBtn.addEventListener("click", async () => {
      const original = el.allocateUnicodeBtn.textContent;
      el.allocateUnicodeBtn.disabled = true;
      el.allocateUnicodeBtn.textContent = "分配中...";
      setUnicodeHint("正在分配编码...");
      try {
        const summary = await allocateUnicodeForCurrentAnno();
        const anno = selectedAnno();
        if (anno) el.propCodepoint.value = anno.attrs?.codepoint || "";
        setUnicodeHint(`分配完成：${summary}`);
        saveState();
        renderPropsEditor();
      } catch (err) {
        setUnicodeHint(err?.message || "编码分配失败");
      } finally {
        el.allocateUnicodeBtn.disabled = !selectedAnno() || !el.allocateUnicodeBtn.classList.contains("active");
        el.allocateUnicodeBtn.textContent = original;
      }
    });
  }

  el.annoColor.addEventListener("input", () => {
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
    if (!state.activeDraftTagId) return;
    syncStyleToTag(state.activeDraftTagId, el.annoShapeSelect.value, el.annoColor.value);
    renderBoxes();
    saveState();
  });

  el.createDraftTagBtn.addEventListener("click", () => {
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
    const img = selectedImage();
    if (!img) return;
    if (state.pendingDrafts.length === 0) { alert("请先画至少一个框"); return; }

    let lastAnnoId = null;
    state.pendingDrafts.forEach((draftItem) => {
      const attrs = {};
      const anno = {
        id: uid("anno"),
        tagId: draftItem.tagId,
        tagName: draftItem.tagName,
        tagPath: draftItem.tagPath,
        shape: draftItem.shape,
        color: draftItem.color,
        transcription: el.annoTranscription.value.trim(),
        rect: { ...draftItem.rect },
        attrs,
        parentAnnoId: null
      };
      const idValue = (anno.attrs.id || "").trim();
      anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);
      img.annotations.push(anno);
      lastAnnoId = anno.id;
    });

    state.selectedAnnoId = lastAnnoId;
    state.pendingDrafts = [];
    state.draftRect = null;
    state.drawingActive = false;
    const shouldEnterUnicodeFlow = state.pendingUnicodeAfterSave;
    el.annoTranscription.value = "";
    if (el.recognizeResult) el.recognizeResult.value = "";
    state.pendingUnicodeAfterSave = false;
    if (shouldEnterUnicodeFlow) {
      state.activeRightPanel = "object";
    }
    renderAll();
    saveState();
  });

  el.saveCurrentPropsBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) return;
    const anno = selectedAnno();
    if (!anno) {
      Object.keys(state.propInputs).forEach((key) => { img.meta[key] = state.propInputs[key].value.trim(); });
      renderAll();
      saveState();
      return;
    }

    const nextAttrs = {};
    Object.keys(state.propInputs).forEach((key) => {
      setIfNotEmpty(nextAttrs, key, state.propInputs[key].value);
    });
    anno.attrs = nextAttrs;
    anno.transcription = el.propNote.value.trim();
    if (el.propCodepoint.value.trim()) {
      anno.attrs.codepoint = el.propCodepoint.value.trim();
    }
    const idValue = (anno.attrs.id || "").trim();
    anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);
    renderAll();
    saveState();
  });

  el.templateTagSelect.addEventListener("change", () => {
    state.selectedTemplateTagId = el.templateTagSelect.value;
    renderTemplateAttrSelect();
    saveState();
  });

  el.addAttrBtn.addEventListener("click", () => {
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
    const tag = findTemplateTag(state.selectedTemplateTagId);
    const attr = el.templateAttrSelect.value;
    if (!tag || !attr) return;
    tag.attrs = (tag.attrs || []).filter((a) => a !== attr);
    saveState();
    renderAll();
  });

  el.deleteTagBtn.addEventListener("click", () => {
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

loadState();
bindDrawEvents();
bindEvents();
el.mainImage.addEventListener("load", () => {
  syncDrawLayerSize();
  renderBoxes();
});
window.addEventListener("resize", syncDrawLayerSize);
renderColorPreview();
renderAll();
