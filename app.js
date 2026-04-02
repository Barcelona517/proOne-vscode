const STORAGE_KEY = "guji_editor_v4";

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
  { id: "t_article", name: "article", parentId: null, attrs: ["id", "type", "version"] },
  { id: "t_head", name: "head", parentId: "t_article", attrs: ["id"] },
  { id: "t_content", name: "content", parentId: "t_article", attrs: ["id"] },
  { id: "t_view", name: "view", parentId: "t_article", attrs: ["id"] },
  { id: "t_title", name: "title", parentId: "t_head", attrs: ["id", "type", "name", "note"] },
  { id: "t_subtitle", name: "subtitle", parentId: "t_head", attrs: ["id", "name", "note"] },
  { id: "t_authors", name: "authors", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_book", name: "book", parentId: "t_head", attrs: ["id", "name"] },
  { id: "t_date", name: "date", parentId: "t_head", attrs: ["id", "value"] },
  { id: "t_text", name: "text", parentId: "t_content", attrs: ["id", "type", "column", "direction"] },
  { id: "t_page", name: "page", parentId: "t_content", attrs: ["id", "type", "src", "name", "position", "note"] },
  { id: "t_div", name: "div", parentId: "t_content", attrs: ["id", "type", "column", "direction"] },
  { id: "t_sources", name: "sources", parentId: "t_view", attrs: ["id", "name"] }
];

const state = {
  images: [],
  templateTags: [],
  selectedImageId: null,
  selectedAnnoId: null,
  selectedTemplateTagId: null,
  selectedTagFilterName: "",
  showTemplateTree: false,
  drawMode: false,
  drawingActive: false,
  draftRect: null,
  activeDraftTagId: null,
  propInputs: {}
};

const el = {
  thumbList: document.getElementById("thumbList"),
  mainImage: document.getElementById("mainImage"),
  drawLayer: document.getElementById("drawLayer"),
  viewerTitle: document.getElementById("viewerTitle"),
  currentTargetHint: document.getElementById("currentTargetHint"),
  propsEditor: document.getElementById("propsEditor"),
  propNote: document.getElementById("propNote"),
  saveCurrentPropsBtn: document.getElementById("saveCurrentPropsBtn"),
  enterEditModeBtn: document.getElementById("enterEditModeBtn"),
  editModeArea: document.getElementById("editModeArea"),
  drawState: document.getElementById("drawState"),
  startDrawBtn: document.getElementById("startDrawBtn"),
  clearDraftBtn: document.getElementById("clearDraftBtn"),
  annoShapeSelect: document.getElementById("annoShapeSelect"),
  annoColor: document.getElementById("annoColor"),
  tagPickerTree: document.getElementById("tagPickerTree"),
  selectedTagInfo: document.getElementById("selectedTagInfo"),
  draftTagName: document.getElementById("draftTagName"),
  draftTagParent: document.getElementById("draftTagParent"),
  draftTagAttrs: document.getElementById("draftTagAttrs"),
  addDraftTagToTemplate: document.getElementById("addDraftTagToTemplate"),
  createDraftTagBtn: document.getElementById("createDraftTagBtn"),
  annoTranscription: document.getElementById("annoTranscription"),
  annoNote: document.getElementById("annoNote"),
  saveAnnoBtn: document.getElementById("saveAnnoBtn"),
  imageTagTree: document.getElementById("imageTagTree"),
  toggleTemplateTreeBtn: document.getElementById("toggleTemplateTreeBtn"),
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
  newTagName: document.getElementById("newTagName"),
  newTagParent: document.getElementById("newTagParent"),
  newTagAttrs: document.getElementById("newTagAttrs"),
  addTagBtn: document.getElementById("addTagBtn"),
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
  if (!img.meta.type) img.meta.type = "1";
  if (!img.meta.version) img.meta.version = "1.0";
  if (!img.meta.note) img.meta.note = "";
  img.annotations = img.annotations || [];
  img.annotations.forEach((anno, index) => {
    anno.attrs = anno.attrs || {};
    anno.color = anno.color || "#2e6f86";
    anno.shape = anno.shape || "rect";
    anno.id = anno.id || `anno_${index + 1}`;
    anno.parentAnnoId = anno.parentAnnoId || null;
  });
}

function setIfNotEmpty(obj, key, value) {
  const trimmed = (value || "").trim();
  if (trimmed) obj[key] = trimmed;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    images: state.images,
    templateTags: state.templateTags,
    selectedImageId: state.selectedImageId,
    selectedTemplateTagId: state.selectedTemplateTagId,
    showTemplateTree: state.showTemplateTree
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
        state.showTemplateTree = Boolean(parsed.showTemplateTree);
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
    meta: { id: `img_${idx + 1}`, type: "1", version: "1.0", note: "" },
    annotations: []
  }));
  state.templateTags = templateDefaults.map((tag, idx) => ({ ...tag, order: idx + 1 }));
  ensureTemplateOrder();
  state.selectedImageId = state.images[0]?.id || null;
  state.selectedTemplateTagId = state.templateTags[0]?.id || null;
  state.showTemplateTree = false;
}

function renderThumbs() {
  el.thumbList.innerHTML = "";
  state.images.forEach((img) => {
    const card = document.createElement("div");
    card.className = `thumb-item ${img.id === state.selectedImageId ? "active" : ""}`;
    card.innerHTML = `
      <div class="thumb-head"><button class="thumb-delete-btn" data-id="${img.id}">删除</button></div>
      <img src="${img.src}" alt="${img.name}" />
      <div class="thumb-meta">${img.name}</div>
      <div class="thumb-meta">id:${img.meta.id} type:${img.meta.type} version:${img.meta.version}</div>
    `;

    card.addEventListener("click", () => {
      state.selectedImageId = img.id;
      state.selectedAnnoId = null;
      state.selectedTagFilterName = "";
      state.drawMode = false;
      state.drawingActive = false;
      state.draftRect = null;
      renderAll();
    });

    card.querySelector("button[data-id]").addEventListener("click", (evt) => {
      evt.stopPropagation();
      if (state.images.length <= 1) {
        alert("至少保留一张图片");
        return;
      }
      if (!window.confirm(`确定删除图片：${img.name}?`)) return;
      state.images = state.images.filter((it) => it.id !== img.id);
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
    return;
  }
  el.mainImage.src = img.src;
  el.viewerTitle.textContent = `${img.name} | id:${img.meta.id} type:${img.meta.type} version:${img.meta.version}`;
}

function renderBoxes() {
  const img = selectedImage();
  el.drawLayer.innerHTML = "";
  if (!img) return;

  img.annotations.forEach((anno) => {
    const box = document.createElement("div");
    box.className = `box shape-${anno.shape}`;
    if (anno.id === state.selectedAnnoId) box.classList.add("selected");
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
    box.title = `${anno.tagPath}${anno.parentAnnoId ? " (子框)" : ""}`;
    box.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.selectedAnnoId = anno.id;
      renderAll();
    });
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
}

function renderPropsEditor() {
  const img = selectedImage();
  const anno = selectedAnno();
  el.propsEditor.innerHTML = "";
  state.propInputs = {};
  if (!img) return;

  if (!anno) {
    el.currentTargetHint.textContent = "当前：图片";
    ["id", "type", "version"].forEach((key) => {
      const row = document.createElement("div");
      row.className = "prop-row";
      row.innerHTML = `<span>${key}</span>`;
      const input = document.createElement("input");
      input.value = img.meta[key] || "";
      state.propInputs[key] = input;
      row.appendChild(input);
      el.propsEditor.appendChild(row);
    });
    el.propNote.value = img.meta.note || "";
    return;
  }

  el.currentTargetHint.textContent = `当前：框 (${anno.tagPath})`;
  const templateTag = findTemplateTag(anno.tagId);
  const attrs = templateTag?.attrs?.length ? templateTag.attrs : ["id", "type", "version"];
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
  el.propNote.value = anno.attrs.note || anno.note || "";
}

function renderEditMode() {
  if (state.drawMode) {
    el.enterEditModeBtn.textContent = "退出编辑模式";
    el.editModeArea.classList.add("active");
  } else {
    el.enterEditModeBtn.textContent = "进入编辑模式";
    el.editModeArea.classList.remove("active");
  }

  if (!state.drawMode) {
    el.drawState.textContent = "当前未处于编辑模式";
    return;
  }
  if (state.drawingActive) {
    el.drawState.textContent = state.draftRect ? "草稿已生成，可保存" : "请在图片上拖拽画框";
    el.startDrawBtn.textContent = "取消添加";
  } else {
    el.drawState.textContent = "点击添加框开始本次画框";
    el.startDrawBtn.textContent = "添加框";
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

  const names = [...new Set(img.annotations.map((anno) => anno.tagName))].sort();
  const ul = document.createElement("ul");
  names.forEach((name) => {
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.className = "tree-node-line clickable";
    const label = document.createElement("span");
    label.textContent = `${name} (${img.annotations.filter((anno) => anno.tagName === name).length})`;
    line.addEventListener("click", () => {
      state.selectedTagFilterName = state.selectedTagFilterName === name ? "" : name;
      renderAll();
    });
    const btn = document.createElement("button");
    btn.className = `tree-pick-btn ${state.selectedTagFilterName === name ? "active" : ""}`;
    btn.textContent = state.selectedTagFilterName === name ? "已高亮" : "高亮";
    btn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.selectedTagFilterName = state.selectedTagFilterName === name ? "" : name;
      renderAll();
    });
    line.appendChild(label);
    line.appendChild(btn);
    li.appendChild(line);
    ul.appendChild(li);
  });
  if (names.length === 0) {
    const li = document.createElement("li");
    li.textContent = "当前图片暂无标签";
    ul.appendChild(li);
  }
  if (names.length > 0) {
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
  }
  el.imageTagTree.appendChild(ul);
}

function renderTemplateTreeVisibility() {
  if (state.showTemplateTree) {
    el.templateTreeArea.classList.add("active");
    el.toggleTemplateTreeBtn.textContent = "收起模板树";
  } else {
    el.templateTreeArea.classList.remove("active");
    el.toggleTemplateTreeBtn.textContent = "模板树";
  }
}

function renderSelectedTagInfo() {
  if (!state.activeDraftTagId) {
    el.selectedTagInfo.textContent = "未选择标签";
    return;
  }
  el.selectedTagInfo.textContent = `已选择标签：${templatePath(state.activeDraftTagId)}`;
}

function renderDraftTagParentOptions() {
  el.draftTagParent.innerHTML = "";
  el.newTagParent.innerHTML = "";
  function append(select, tag, depth) {
    const option = document.createElement("option");
    option.value = tag.id;
    option.textContent = `${"  ".repeat(depth)}${tag.name}`;
    select.appendChild(option);
  }
  function walk(tag, depth) {
    append(el.draftTagParent, tag, depth);
    append(el.newTagParent, tag, depth);
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
  renderTemplateTreeVisibility();
  renderTemplateTagTree();
  renderTemplateTagSelect();
  renderDraftTagParentOptions();
}

function bindDrawEvents() {
  let drawing = false;
  let start = null;

  el.drawLayer.addEventListener("mousedown", (evt) => {
    if (!state.drawMode || !state.drawingActive || !selectedImage()) return;
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((evt.clientX - rect.left) / rect.width);
    const y = clamp01((evt.clientY - rect.top) / rect.height);
    drawing = true;
    start = { x, y };
  });

  window.addEventListener("mousemove", (evt) => {
    if (!drawing || !start) return;
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((evt.clientX - rect.left) / rect.width);
    const y = clamp01((evt.clientY - rect.top) / rect.height);
    const base = normalizeRect({ x1: start.x, y1: start.y, x2: x, y2: y });
    state.draftRect = toShapeRect(base, el.annoShapeSelect.value);
    renderBoxes();
    renderEditMode();
  });

  window.addEventListener("mouseup", () => {
    drawing = false;
    start = null;
  });

  el.drawLayer.addEventListener("click", () => {
    if (!state.drawingActive) {
      state.selectedAnnoId = null;
      renderAll();
    }
  });
}

function bindEvents() {
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
        meta: { id: uid("img"), type: "1", version: "1.0", note: "" },
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

  el.toggleTemplateTreeBtn.addEventListener("click", () => {
    state.showTemplateTree = !state.showTemplateTree;
    renderAll();
    saveState();
  });

  el.enterEditModeBtn.addEventListener("click", () => {
    state.drawMode = !state.drawMode;
    state.drawingActive = false;
    state.draftRect = null;
    if (!state.drawMode) state.selectedAnnoId = null;
    renderAll();
  });

  el.startDrawBtn.addEventListener("click", () => {
    if (!state.drawMode) return;
    state.drawingActive = !state.drawingActive;
    state.draftRect = null;
    renderAll();
  });

  el.clearDraftBtn.addEventListener("click", () => {
    state.draftRect = null;
    state.drawingActive = false;
    el.annoTranscription.value = "";
    el.annoNote.value = "";
    renderAll();
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
    if (!state.activeDraftTagId) { alert("请先选择标签"); return; }
    if (!state.draftRect || state.draftRect.w < 0.003 || state.draftRect.h < 0.003) { alert("请先拖拽出有效框选区域"); return; }

    const tag = findTemplateTag(state.activeDraftTagId);
    if (!tag) { alert("标签不存在"); return; }

    const attrs = {};
    setIfNotEmpty(attrs, "note", el.annoNote.value);

    const anno = {
      id: uid("anno"),
      tagId: tag.id,
      tagName: tag.name,
      tagPath: templatePath(tag.id),
      shape: el.annoShapeSelect.value,
      color: el.annoColor.value,
      transcription: el.annoTranscription.value.trim(),
      note: el.annoNote.value.trim(),
      rect: { ...state.draftRect },
      attrs,
      parentAnnoId: null
    };

    const idValue = (anno.attrs.id || "").trim();
    anno.parentAnnoId = findParentByIdOrContainment(img, anno.rect, anno.id, idValue);

    img.annotations.push(anno);
    state.selectedAnnoId = anno.id;
    state.draftRect = null;
    state.drawingActive = false;
    el.annoTranscription.value = "";
    el.annoNote.value = "";
    renderAll();
    saveState();
  });

  el.saveCurrentPropsBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) return;
    const anno = selectedAnno();
    if (!anno) {
      Object.keys(state.propInputs).forEach((key) => { img.meta[key] = state.propInputs[key].value.trim(); });
      img.meta.note = el.propNote.value.trim();
      renderAll();
      saveState();
      return;
    }

    const nextAttrs = {};
    Object.keys(state.propInputs).forEach((key) => {
      setIfNotEmpty(nextAttrs, key, state.propInputs[key].value);
    });
    setIfNotEmpty(nextAttrs, "note", el.propNote.value);
    anno.attrs = nextAttrs;
    anno.note = anno.attrs.note || "";
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

  el.addTagBtn.addEventListener("click", () => {
    const name = el.newTagName.value.trim();
    const parentId = el.newTagParent.value || null;
    const attrs = el.newTagAttrs.value.trim();
    if (!name) { alert("请填写标签名称"); return; }
    const duplicated = state.templateTags.some((tag) => tag.parentId === parentId && tag.name === name);
    if (duplicated) { alert("同级标签名称重复"); return; }
    state.templateTags.push({ id: uid("tag"), name, parentId, attrs: attrs ? attrs.split(",").map((a) => a.trim()).filter(Boolean) : [], order: templateChildren(parentId).length + 1 });
    ensureTemplateOrder();
    el.newTagName.value = "";
    el.newTagAttrs.value = "";
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
renderAll();
