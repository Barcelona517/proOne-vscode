const STORAGE_KEY = "guji_editor_v3";

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

const builtInTags = [
  { id: "t_article", name: "article", parentId: null, attrs: ["id", "type", "version"] },
  { id: "t_head", name: "head", parentId: "t_article", attrs: ["title", "authors"] },
  { id: "t_content", name: "content", parentId: "t_article", attrs: ["id"] },
  { id: "t_view", name: "view", parentId: "t_article", attrs: ["mode"] },
  { id: "t_title", name: "title", parentId: "t_head", attrs: ["name", "note", "type"] },
  { id: "t_subtitle", name: "subtitle", parentId: "t_head", attrs: ["name"] },
  { id: "t_authors", name: "authors", parentId: "t_head", attrs: ["name"] },
  { id: "t_book", name: "book", parentId: "t_head", attrs: ["name"] },
  { id: "t_date", name: "date", parentId: "t_head", attrs: ["value"] },
  { id: "t_text", name: "text", parentId: "t_content", attrs: ["id", "type", "note"] },
  { id: "t_page", name: "page", parentId: "t_content", attrs: ["id", "src"] },
  { id: "t_div", name: "div", parentId: "t_content", attrs: ["id", "type"] },
  { id: "t_sources", name: "sources", parentId: "t_view", attrs: ["name"] }
];

const shapeNameMap = {
  rect: "方框",
  line: "横线",
  wave: "波浪线"
};

const state = {
  images: [],
  tagDefs: [],
  selectedImageId: null,
  selectedTagId: null,
  selectedAnnoId: null,
  drawMode: false,
  draftRect: null,
  editingAnnoId: null
};

const el = {
  thumbList: document.getElementById("thumbList"),
  mainImage: document.getElementById("mainImage"),
  drawLayer: document.getElementById("drawLayer"),
  viewerTitle: document.getElementById("viewerTitle"),

  currentTargetHint: document.getElementById("currentTargetHint"),
  propId: document.getElementById("propId"),
  propType: document.getElementById("propType"),
  propVersion: document.getElementById("propVersion"),
  propNote: document.getElementById("propNote"),
  saveCurrentPropsBtn: document.getElementById("saveCurrentPropsBtn"),

  drawState: document.getElementById("drawState"),
  toggleDrawModeBtn: document.getElementById("toggleDrawModeBtn"),
  clearDraftBtn: document.getElementById("clearDraftBtn"),
  annoShapeSelect: document.getElementById("annoShapeSelect"),
  annoColor: document.getElementById("annoColor"),
  tagPickerTree: document.getElementById("tagPickerTree"),
  selectedTagInfo: document.getElementById("selectedTagInfo"),
  annoTranscription: document.getElementById("annoTranscription"),
  annoNote: document.getElementById("annoNote"),
  saveAnnoBtn: document.getElementById("saveAnnoBtn"),

  tagTree: document.getElementById("tagTree"),
  newTagName: document.getElementById("newTagName"),
  newTagParent: document.getElementById("newTagParent"),
  newTagAttrs: document.getElementById("newTagAttrs"),
  addTagBtn: document.getElementById("addTagBtn"),

  uploadInput: document.getElementById("uploadInput"),
  uploadBtn: document.getElementById("uploadBtn")
};

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function encodePath(path) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function fileToDisplayName(path) {
  return path.split("/").pop() || path;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

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
  const h = hex.replace("#", "");
  const normalized = h.length === 3
    ? h.split("").map((ch) => ch + ch).join("")
    : h;
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function findTag(id) {
  return state.tagDefs.find((tag) => tag.id === id) || null;
}

function childrenOf(parentId) {
  return state.tagDefs.filter((tag) => tag.parentId === parentId);
}

function tagPath(tagId) {
  const arr = [];
  let cursor = findTag(tagId);
  while (cursor) {
    arr.unshift(cursor.name);
    cursor = cursor.parentId ? findTag(cursor.parentId) : null;
  }
  return arr.join("/");
}

function selectedImage() {
  return state.images.find((img) => img.id === state.selectedImageId) || null;
}

function selectedAnno() {
  const img = selectedImage();
  if (!img || !state.selectedAnnoId) {
    return null;
  }
  return img.annotations.find((anno) => anno.id === state.selectedAnnoId) || null;
}

function ensureImageAttrs(image) {
  image.attrs = image.attrs || {};
  image.attrs.id = image.attrs.id || uid("img");
  image.attrs.type = image.attrs.type || "1";
  image.attrs.version = image.attrs.version || "1.0";
  image.attrs.note = image.attrs.note || "";
}

function ensureAnnoAttrs(anno) {
  anno.attrs = anno.attrs || {};
  anno.attrs.id = anno.attrs.id || uid("box");
  anno.attrs.type = anno.attrs.type || "1";
  anno.attrs.version = anno.attrs.version || "1.0";
  anno.attrs.note = anno.attrs.note || anno.note || "";
  anno.color = anno.color || "#2e6f86";
  anno.shape = anno.shape || "rect";
  anno.parentAnnoId = anno.parentAnnoId || null;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.images) && Array.isArray(parsed.tagDefs) && parsed.images.length > 0) {
        state.images = parsed.images;
        state.tagDefs = parsed.tagDefs;
        state.selectedImageId = parsed.selectedImageId || parsed.images[0].id;
        state.selectedTagId = parsed.selectedTagId || parsed.tagDefs[0]?.id || null;

        state.images.forEach((img) => {
          ensureImageAttrs(img);
          img.annotations = img.annotations || [];
          img.annotations.forEach((anno) => ensureAnnoAttrs(anno));
        });
        return;
      }
    } catch (_) {
      // ignore corrupted storage
    }
  }

  state.images = seedImages.map((item, idx) => {
    const image = {
      id: `seed_${idx + 1}`,
      name: fileToDisplayName(item.path),
      src: encodePath(item.path),
      category: item.category,
      contentElement: item.element,
      contentKind: item.kind,
      source: "seed",
      annotations: [],
      attrs: {
        id: `img_${idx + 1}`,
        type: "1",
        version: "1.0",
        note: ""
      }
    };
    return image;
  });

  state.tagDefs = builtInTags.map((tag) => ({ ...tag }));
  state.selectedImageId = state.images[0]?.id || null;
  state.selectedTagId = state.tagDefs[0]?.id || null;
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      images: state.images,
      tagDefs: state.tagDefs,
      selectedImageId: state.selectedImageId,
      selectedTagId: state.selectedTagId
    })
  );
}

function renderThumbs() {
  el.thumbList.innerHTML = "";
  state.images.forEach((img) => {
    const item = document.createElement("div");
    item.className = `thumb-item ${img.id === state.selectedImageId ? "active" : ""}`;
    item.innerHTML = `
      <div class="thumb-head">
        <button class="thumb-delete-btn" data-del-img="${img.id}">删除</button>
      </div>
      <img src="${img.src}" alt="${img.name}" />
      <div class="thumb-meta">${img.name}</div>
      <div class="thumb-meta">id:${img.attrs.id} type:${img.attrs.type} version:${img.attrs.version}</div>
    `;

    item.addEventListener("click", () => {
      state.selectedImageId = img.id;
      state.selectedAnnoId = null;
      state.editingAnnoId = null;
      state.draftRect = null;
      saveState();
      renderAll();
    });

    const delBtn = item.querySelector("button[data-del-img]");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.images.length <= 1) {
        alert("至少保留一张图片");
        return;
      }
      if (!window.confirm(`确定删除图片：${img.name} ?`)) {
        return;
      }
      state.images = state.images.filter((it) => it.id !== img.id);
      if (state.selectedImageId === img.id) {
        state.selectedImageId = state.images[0]?.id || null;
      }
      state.selectedAnnoId = null;
      state.editingAnnoId = null;
      state.draftRect = null;
      saveState();
      renderAll();
    });

    el.thumbList.appendChild(item);
  });
}

function renderMain() {
  const img = selectedImage();
  if (!img) {
    el.mainImage.removeAttribute("src");
    el.viewerTitle.textContent = "未选择图片";
    el.drawLayer.innerHTML = "";
    return;
  }

  el.mainImage.src = img.src;
  el.viewerTitle.textContent = `${img.name} | id:${img.attrs.id} type:${img.attrs.type} version:${img.attrs.version}`;
  renderBoxes();
}

function renderBoxes() {
  const img = selectedImage();
  el.drawLayer.innerHTML = "";
  if (!img) {
    return;
  }

  img.annotations.forEach((anno) => {
    const box = document.createElement("div");
    box.className = `box shape-${anno.shape}`;
    if (anno.id === state.selectedAnnoId) {
      box.classList.add("selected");
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

    box.title = `${anno.tagPath}${anno.parentAnnoId ? " (从属子框)" : ""}`;
    box.dataset.annoId = anno.id;
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      state.selectedAnnoId = anno.id;
      state.editingAnnoId = anno.id;
      state.selectedTagId = anno.tagId;
      el.annoShapeSelect.value = anno.shape;
      el.annoColor.value = anno.color;
      el.annoTranscription.value = anno.transcription || "";
      el.annoNote.value = anno.note || "";
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

function renderCurrentPropsPanel() {
  const anno = selectedAnno();
  const img = selectedImage();
  if (!img) {
    return;
  }

  if (anno) {
    el.currentTargetHint.textContent = `当前：框 (${anno.tagPath})${anno.parentAnnoId ? " / 子框" : ""}`;
    el.propId.value = anno.attrs.id || "";
    el.propType.value = anno.attrs.type || "";
    el.propVersion.value = anno.attrs.version || "";
    el.propNote.value = anno.attrs.note || anno.note || "";
  } else {
    el.currentTargetHint.textContent = "当前：图片";
    el.propId.value = img.attrs.id || "";
    el.propType.value = img.attrs.type || "";
    el.propVersion.value = img.attrs.version || "";
    el.propNote.value = img.attrs.note || "";
  }
}

function renderTagTree() {
  function renderNode(tag) {
    const li = document.createElement("li");
    const attrs = (tag.attrs || []).join("|");
    li.innerHTML = `<strong>${tag.name}</strong><span class="tag-meta">${attrs ? ` 属性:${attrs}` : ""}</span>`;

    const children = childrenOf(tag.id);
    if (children.length > 0) {
      const ul = document.createElement("ul");
      children.forEach((child) => ul.appendChild(renderNode(child)));
      li.appendChild(ul);
    }
    return li;
  }

  el.tagTree.innerHTML = "";
  const rootUl = document.createElement("ul");
  childrenOf(null).forEach((root) => rootUl.appendChild(renderNode(root)));
  el.tagTree.appendChild(rootUl);
}

function buildTagOptionList() {
  const list = [];
  function walk(tag, depth) {
    list.push({ id: tag.id, label: `${"  ".repeat(depth)}${tag.name}` });
    childrenOf(tag.id).forEach((child) => walk(child, depth + 1));
  }
  childrenOf(null).forEach((root) => walk(root, 0));
  return list;
}

function renderNewTagParentOptions() {
  const opts = buildTagOptionList();
  el.newTagParent.innerHTML = "";
  opts.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.id;
    o.textContent = opt.label;
    el.newTagParent.appendChild(o);
  });
}

function renderTagPickerTree() {
  function renderPickerNode(tag) {
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.className = "tree-node-line";

    const name = document.createElement("span");
    name.textContent = tag.name;

    const btn = document.createElement("button");
    btn.className = `tree-pick-btn ${state.selectedTagId === tag.id ? "active" : ""}`;
    btn.textContent = state.selectedTagId === tag.id ? "已选" : "选择";
    btn.addEventListener("click", () => {
      state.selectedTagId = tag.id;
      renderTagPickerTree();
      renderSelectedTagInfo();
      saveState();
    });

    line.appendChild(name);
    line.appendChild(btn);

    const children = childrenOf(tag.id);
    if (children.length > 0) {
      const details = document.createElement("details");
      details.open = true;
      const summary = document.createElement("summary");
      summary.textContent = tag.name;
      details.appendChild(summary);
      details.appendChild(line);

      const ul = document.createElement("ul");
      children.forEach((child) => ul.appendChild(renderPickerNode(child)));
      details.appendChild(ul);
      li.appendChild(details);
    } else {
      li.appendChild(line);
    }

    return li;
  }

  el.tagPickerTree.innerHTML = "";
  const ul = document.createElement("ul");
  childrenOf(null).forEach((root) => ul.appendChild(renderPickerNode(root)));
  el.tagPickerTree.appendChild(ul);
}

function renderSelectedTagInfo() {
  if (!state.selectedTagId) {
    el.selectedTagInfo.textContent = "未选择标签";
    return;
  }
  const tag = findTag(state.selectedTagId);
  if (!tag) {
    el.selectedTagInfo.textContent = "未选择标签";
    return;
  }
  el.selectedTagInfo.textContent = `已选择标签：${tagPath(tag.id)}`;
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

function findParentAnnoId(image, rect, currentAnnoId) {
  const candidates = image.annotations.filter((anno) => anno.id !== currentAnnoId && containsRect(anno.rect, rect));
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => (a.rect.w * a.rect.h) - (b.rect.w * b.rect.h));
  return candidates[0].id;
}

function renderDrawState() {
  if (state.drawMode) {
    el.toggleDrawModeBtn.textContent = "退出画框模式";
    el.drawState.textContent = state.draftRect ? "草稿已生成，可保存" : "画框模式已开启：在图片上拖拽";
  } else {
    el.toggleDrawModeBtn.textContent = "进入画框模式";
    el.drawState.textContent = "先选择标签与样式，再点击进入画框模式";
  }
}

function renderAll() {
  renderThumbs();
  renderMain();
  renderCurrentPropsPanel();
  renderTagTree();
  renderTagPickerTree();
  renderSelectedTagInfo();
  renderNewTagParentOptions();
  renderDrawState();
}

function initDraw() {
  let drawing = false;
  let start = null;

  el.drawLayer.addEventListener("mousedown", (e) => {
    if (!state.drawMode || !selectedImage()) {
      return;
    }
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    drawing = true;
    start = { x, y };
  });

  window.addEventListener("mousemove", (e) => {
    if (!drawing || !start) {
      return;
    }
    const rect = el.drawLayer.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    const base = normalizeRect({ x1: start.x, y1: start.y, x2: x, y2: y });
    state.draftRect = toShapeRect(base, el.annoShapeSelect.value);
    renderBoxes();
    renderDrawState();
  });

  window.addEventListener("mouseup", () => {
    drawing = false;
    start = null;
  });

  el.drawLayer.addEventListener("click", () => {
    if (!state.drawMode) {
      state.selectedAnnoId = null;
      state.editingAnnoId = null;
      renderAll();
    }
  });
}

function bindEvents() {
  el.uploadBtn.addEventListener("click", () => {
    el.uploadInput.click();
  });

  el.uploadInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = {
        id: uid("upload"),
        name: file.name,
        src: reader.result,
        category: "用户上传",
        contentElement: "page",
        contentKind: "图片",
        source: "upload",
        annotations: [],
        attrs: {
          id: uid("img"),
          type: "1",
          version: "1.0",
          note: ""
        }
      };

      state.images.push(img);
      state.selectedImageId = img.id;
      state.selectedAnnoId = null;
      state.editingAnnoId = null;
      state.draftRect = null;
      saveState();
      renderAll();
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  });

  el.saveCurrentPropsBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) {
      return;
    }

    const anno = selectedAnno();
    if (anno) {
      anno.attrs.id = el.propId.value.trim() || anno.attrs.id;
      anno.attrs.type = el.propType.value.trim() || anno.attrs.type;
      anno.attrs.version = el.propVersion.value.trim() || anno.attrs.version;
      anno.attrs.note = el.propNote.value.trim();
      anno.note = anno.attrs.note;
      el.annoNote.value = anno.note;
    } else {
      img.attrs.id = el.propId.value.trim() || img.attrs.id;
      img.attrs.type = el.propType.value.trim() || img.attrs.type;
      img.attrs.version = el.propVersion.value.trim() || img.attrs.version;
      img.attrs.note = el.propNote.value.trim();
    }

    saveState();
    renderAll();
  });

  el.toggleDrawModeBtn.addEventListener("click", () => {
    state.drawMode = !state.drawMode;
    state.draftRect = null;
    state.selectedAnnoId = null;
    if (!state.drawMode) {
      state.editingAnnoId = null;
    }
    renderAll();
  });

  el.clearDraftBtn.addEventListener("click", () => {
    state.draftRect = null;
    state.editingAnnoId = null;
    state.selectedAnnoId = null;
    el.annoTranscription.value = "";
    el.annoNote.value = "";
    renderAll();
  });

  el.saveAnnoBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) {
      return;
    }
    if (!state.selectedTagId) {
      alert("请先选择标签");
      return;
    }
    if (!state.draftRect || state.draftRect.w < 0.004 || state.draftRect.h < 0.004) {
      alert("请先在图片中画出有效区域");
      return;
    }

    const tag = findTag(state.selectedTagId);
    if (!tag) {
      alert("标签不存在，请重新选择");
      return;
    }

    const annoId = state.editingAnnoId || uid("anno");
    const parentAnnoId = findParentAnnoId(img, state.draftRect, annoId);
    const old = img.annotations.find((item) => item.id === annoId);

    const payload = {
      id: annoId,
      tagId: tag.id,
      tagName: tag.name,
      tagPath: tagPath(tag.id),
      shape: el.annoShapeSelect.value,
      color: el.annoColor.value,
      transcription: el.annoTranscription.value.trim(),
      note: el.annoNote.value.trim(),
      rect: { ...state.draftRect },
      parentAnnoId,
      attrs: old?.attrs || {
        id: uid("box"),
        type: "1",
        version: "1.0",
        note: el.annoNote.value.trim()
      }
    };

    ensureAnnoAttrs(payload);
    payload.attrs.note = payload.note;

    const idx = img.annotations.findIndex((item) => item.id === payload.id);
    if (idx >= 0) {
      img.annotations[idx] = payload;
    } else {
      img.annotations.push(payload);
    }

    state.selectedAnnoId = payload.id;
    state.editingAnnoId = null;
    state.draftRect = null;
    state.drawMode = false;
    saveState();
    renderAll();
  });

  el.addTagBtn.addEventListener("click", () => {
    const name = el.newTagName.value.trim();
    const parentId = el.newTagParent.value || null;
    const attrsRaw = el.newTagAttrs.value.trim();

    if (!name) {
      alert("请填写标签名称");
      return;
    }

    const duplicated = state.tagDefs.some((tag) => tag.parentId === parentId && tag.name === name);
    if (duplicated) {
      alert("同级下标签名重复");
      return;
    }

    const tag = {
      id: uid("tag"),
      name,
      parentId,
      attrs: attrsRaw ? attrsRaw.split(",").map((s) => s.trim()).filter(Boolean) : []
    };

    state.tagDefs.push(tag);
    state.selectedTagId = tag.id;
    el.newTagName.value = "";
    el.newTagAttrs.value = "";
    saveState();
    renderAll();
  });
}

loadState();
initDraw();
bindEvents();
renderAll();
