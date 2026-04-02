const STORAGE_KEY = "guji_editor_v2";

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

const state = {
  images: [],
  tagDefs: [],
  selectedImageId: null,
  selectedTagId: null,
  drawMode: false,
  draftRect: null,
  editingAnnoId: null
};

const el = {
  thumbList: document.getElementById("thumbList"),
  mainImage: document.getElementById("mainImage"),
  drawLayer: document.getElementById("drawLayer"),
  viewerTitle: document.getElementById("viewerTitle"),
  annoList: document.getElementById("annoList"),
  tagTree: document.getElementById("tagTree"),
  annoTagSelect: document.getElementById("annoTagSelect"),
  newTagName: document.getElementById("newTagName"),
  newTagParent: document.getElementById("newTagParent"),
  newTagShape: document.getElementById("newTagShape"),
  newTagAttrs: document.getElementById("newTagAttrs"),
  addTagBtn: document.getElementById("addTagBtn"),
  toggleDrawModeBtn: document.getElementById("toggleDrawModeBtn"),
  drawState: document.getElementById("drawState"),
  uploadInput: document.getElementById("uploadInput"),
  uploadBtn: document.getElementById("uploadBtn"),
  imageContentElement: document.getElementById("imageContentElement"),
  imageContentKind: document.getElementById("imageContentKind"),
  saveImageMetaBtn: document.getElementById("saveImageMetaBtn"),
  annoShapeSelect: document.getElementById("annoShapeSelect"),
  annoTranscription: document.getElementById("annoTranscription"),
  annoNote: document.getElementById("annoNote"),
  saveAnnoBtn: document.getElementById("saveAnnoBtn"),
  clearDraftBtn: document.getElementById("clearDraftBtn")
};

const builtInTags = [
  { id: "t_article", name: "article", parentId: null, shape: "rect", attrs: ["id", "type", "version"] },
  { id: "t_head", name: "head", parentId: "t_article", shape: "rect", attrs: ["title", "authors"] },
  { id: "t_content", name: "content", parentId: "t_article", shape: "rect", attrs: ["id"] },
  { id: "t_view", name: "view", parentId: "t_article", shape: "rect", attrs: ["mode"] },
  { id: "t_title", name: "title", parentId: "t_head", shape: "line", attrs: ["name", "note", "type"] },
  { id: "t_subtitle", name: "subtitle", parentId: "t_head", shape: "line", attrs: ["name"] },
  { id: "t_authors", name: "authors", parentId: "t_head", shape: "rect", attrs: ["name"] },
  { id: "t_book", name: "book", parentId: "t_head", shape: "rect", attrs: ["name"] },
  { id: "t_date", name: "date", parentId: "t_head", shape: "line", attrs: ["value"] },
  { id: "t_text", name: "text", parentId: "t_content", shape: "rect", attrs: ["id", "type", "note"] },
  { id: "t_page", name: "page", parentId: "t_content", shape: "rect", attrs: ["id", "src"] },
  { id: "t_div", name: "div", parentId: "t_content", shape: "wave", attrs: ["id", "type"] },
  { id: "t_sources", name: "sources", parentId: "t_view", shape: "line", attrs: ["name"] }
];

const shapeNameMap = {
  rect: "方框",
  line: "横线",
  wave: "波浪线"
};

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function fileToDisplayName(path) {
  return path.split("/").pop() || path;
}

function encodePath(path) {
  return path.split("/").map((p) => encodeURIComponent(p)).join("/");
}

function normalizeRect(rect) {
  const x1 = Math.min(rect.x1, rect.x2);
  const y1 = Math.min(rect.y1, rect.y2);
  const x2 = Math.max(rect.x1, rect.x2);
  const y2 = Math.max(rect.y1, rect.y2);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const palette = ["#b54f24", "#2c7a56", "#7e5ac5", "#2878b5", "#8f3b2e", "#4f6d7a", "#ab5f14"];
  return palette[hash % palette.length];
}

function findTag(id) {
  return state.tagDefs.find((tag) => tag.id === id) || null;
}

function tagPath(tagId) {
  const chain = [];
  let cursor = findTag(tagId);
  while (cursor) {
    chain.unshift(cursor.name);
    cursor = cursor.parentId ? findTag(cursor.parentId) : null;
  }
  return chain.join("/");
}

function childrenOf(parentId) {
  return state.tagDefs.filter((tag) => tag.parentId === parentId);
}

function toShapeRect(normalizedRect, shape) {
  const base = { ...normalizedRect };
  if (shape === "line" || shape === "wave") {
    base.h = Math.max(base.h, 0.008);
  }
  return base;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.images) && parsed.images.length > 0 && Array.isArray(parsed.tagDefs)) {
        state.images = parsed.images;
        state.tagDefs = parsed.tagDefs;
        state.selectedImageId = parsed.selectedImageId || parsed.images[0].id;
        state.selectedTagId = parsed.selectedTagId || parsed.tagDefs[0]?.id || null;
        return;
      }
    } catch (_) {
      // ignore corrupted storage
    }
  }

  state.images = seedImages.map((item, idx) => ({
    id: `seed_${idx + 1}`,
    name: fileToDisplayName(item.path),
    src: encodePath(item.path),
    category: item.category,
    contentElement: item.element,
    contentKind: item.kind,
    source: "seed",
    annotations: []
  }));
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

function selectedImage() {
  return state.images.find((img) => img.id === state.selectedImageId) || null;
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
      <div class="thumb-meta">${img.category} / ${img.contentElement} / ${img.contentKind}</div>
    `;
    item.addEventListener("click", () => {
      state.selectedImageId = img.id;
      state.draftRect = null;
      state.editingAnnoId = null;
      clearAnnoForm();
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
      const ok = window.confirm(`确定删除图片：${img.name} ？`);
      if (!ok) {
        return;
      }
      state.images = state.images.filter((it) => it.id !== img.id);
      if (state.selectedImageId === img.id) {
        state.selectedImageId = state.images[0]?.id || null;
      }
      state.draftRect = null;
      state.editingAnnoId = null;
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
  el.viewerTitle.textContent = `${img.name} (${img.contentElement}/${img.contentKind})`;
  el.imageContentElement.value = img.contentElement;
  el.imageContentKind.value = img.contentKind;
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
    box.className = `box shape-${anno.shape || "rect"}`;
    box.style.left = `${anno.rect.x * 100}%`;
    box.style.top = `${anno.rect.y * 100}%`;
    box.style.width = `${anno.rect.w * 100}%`;
    box.style.height = `${anno.rect.h * 100}%`;
    box.style.setProperty("--shape-color", hashColor(anno.tagId || anno.tagName || "tag"));
    box.title = `${anno.tagPath} | ${shapeNameMap[anno.shape] || "方框"}`;
    el.drawLayer.appendChild(box);
  });

  if (state.draftRect) {
    const box = document.createElement("div");
    box.className = `box temp shape-${el.annoShapeSelect.value}`;
    box.style.left = `${state.draftRect.x * 100}%`;
    box.style.top = `${state.draftRect.y * 100}%`;
    box.style.width = `${state.draftRect.w * 100}%`;
    box.style.height = `${state.draftRect.h * 100}%`;
    box.style.setProperty("--shape-color", hashColor(state.selectedTagId || "temp"));
    el.drawLayer.appendChild(box);
  }
}

function renderAnnoList() {
  const img = selectedImage();
  el.annoList.innerHTML = "";
  if (!img) {
    return;
  }

  img.annotations.forEach((anno) => {
    const item = document.createElement("div");
    item.className = "anno-item";
    item.innerHTML = `
      <div class="anno-item-head">
        <strong>${anno.tagName}</strong>
        <span class="muted">${shapeNameMap[anno.shape] || "方框"}</span>
      </div>
      <div class="muted">标签路径：${anno.tagPath}</div>
      <div class="muted">转写：${anno.transcription || "-"}</div>
      <div class="muted">注释：${anno.note || "-"}</div>
      <button data-id="${anno.id}">编辑/定位</button>
      <button data-del="${anno.id}">删除</button>
    `;

    const editBtn = item.querySelector("button[data-id]");
    editBtn.addEventListener("click", () => {
      state.editingAnnoId = anno.id;
      state.draftRect = { ...anno.rect };
      state.selectedTagId = anno.tagId;
      el.annoShapeSelect.value = anno.shape || "rect";
      el.annoTranscription.value = anno.transcription || "";
      el.annoNote.value = anno.note || "";
      el.drawState.textContent = "正在编辑已有标注（可修改后保存）";
      syncSelectedTagUI();
      renderAll();
    });

    const delBtn = item.querySelector("button[data-del]");
    delBtn.addEventListener("click", () => {
      img.annotations = img.annotations.filter((a) => a.id !== anno.id);
      if (state.editingAnnoId === anno.id) {
        state.editingAnnoId = null;
      }
      saveState();
      renderAll();
    });

    el.annoList.appendChild(item);
  });
}

function renderTagTree() {
  function renderNode(node, depth) {
    const attrs = node.attrs?.length ? ` 属性:${node.attrs.join("|")}` : "";
    const li = document.createElement("li");
    const spacer = "&nbsp;".repeat(depth * 2);
    li.innerHTML = `${spacer}<strong>${node.name}</strong><span class="tag-meta">(${shapeNameMap[node.shape] || "方框"}${attrs})</span>`;
    const children = childrenOf(node.id);
    if (children.length > 0) {
      const ul = document.createElement("ul");
      children.forEach((child) => ul.appendChild(renderNode(child, depth + 1)));
      li.appendChild(ul);
    }
    return li;
  }

  el.tagTree.innerHTML = "";
  const roots = childrenOf(null);
  const rootUl = document.createElement("ul");
  roots.forEach((root) => rootUl.appendChild(renderNode(root, 0)));
  el.tagTree.appendChild(rootUl);
}

function buildTagOptionList() {
  const result = [];
  function walk(node, depth) {
    result.push({ id: node.id, label: `${"  ".repeat(depth)}${node.name}` });
    childrenOf(node.id).forEach((child) => walk(child, depth + 1));
  }
  childrenOf(null).forEach((root) => walk(root, 0));
  return result;
}

function renderTagSelectors() {
  const options = buildTagOptionList();
  el.annoTagSelect.innerHTML = "";
  el.newTagParent.innerHTML = "";

  options.forEach((opt) => {
    const op1 = document.createElement("option");
    op1.value = opt.id;
    op1.textContent = opt.label;
    el.annoTagSelect.appendChild(op1);

    const op2 = document.createElement("option");
    op2.value = opt.id;
    op2.textContent = opt.label;
    el.newTagParent.appendChild(op2);
  });

  if (!state.selectedTagId && options[0]) {
    state.selectedTagId = options[0].id;
  }

  syncSelectedTagUI();
}

function syncSelectedTagUI() {
  if (!state.selectedTagId) {
    return;
  }
  el.annoTagSelect.value = state.selectedTagId;
  const tag = findTag(state.selectedTagId);
  if (tag) {
    el.annoShapeSelect.value = tag.shape || "rect";
  }
}

function clearAnnoForm() {
  syncSelectedTagUI();
  el.annoTranscription.value = "";
  el.annoNote.value = "";
  if (state.drawMode) {
    el.drawState.textContent = state.draftRect ? "草稿已生成，可保存" : "画框模式已开启：在图片上拖拽";
  } else {
    el.drawState.textContent = "先选标签，再点击“进入画框模式”";
  }
}

function renderAll() {
  renderThumbs();
  renderTagTree();
  renderTagSelectors();
  renderMain();
  renderAnnoList();
  clearAnnoForm();
}

function initDraw() {
  let drawing = false;
  let start = null;

  el.drawLayer.addEventListener("mousedown", (e) => {
    if (!selectedImage() || !state.drawMode) {
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
    const normalized = normalizeRect({ x1: start.x, y1: start.y, x2: x, y2: y });
    state.draftRect = toShapeRect(normalized, el.annoShapeSelect.value);
    el.drawState.textContent = "草稿已生成，可保存";
    renderBoxes();
  });

  window.addEventListener("mouseup", () => {
    if (!drawing) {
      return;
    }
    drawing = false;
    start = null;
  });
}

function bindEvents() {
  el.annoTagSelect.addEventListener("change", () => {
    state.selectedTagId = el.annoTagSelect.value;
    syncSelectedTagUI();
    renderBoxes();
    saveState();
  });

  el.annoShapeSelect.addEventListener("change", () => {
    const tag = findTag(state.selectedTagId);
    if (tag) {
      tag.shape = el.annoShapeSelect.value;
    }
    renderTagTree();
    renderBoxes();
    saveState();
  });

  el.addTagBtn.addEventListener("click", () => {
    const name = el.newTagName.value.trim();
    const parentId = el.newTagParent.value || null;
    const shape = el.newTagShape.value;
    const attrs = el.newTagAttrs.value.trim();

    if (!name) {
      alert("请填写标签名称");
      return;
    }
    const duplicated = state.tagDefs.some((tag) => tag.name === name && tag.parentId === parentId);
    if (duplicated) {
      alert("同级下已存在相同标签名称");
      return;
    }

    const tag = {
      id: uid("tag"),
      name,
      parentId,
      shape,
      attrs: attrs ? attrs.split(",").map((a) => a.trim()).filter(Boolean) : []
    };
    state.tagDefs.push(tag);
    state.selectedTagId = tag.id;
    el.newTagName.value = "";
    el.newTagAttrs.value = "";
    saveState();
    renderAll();
  });

  el.toggleDrawModeBtn.addEventListener("click", () => {
    state.drawMode = !state.drawMode;
    if (!state.drawMode) {
      state.draftRect = null;
    }
    el.toggleDrawModeBtn.textContent = state.drawMode ? "退出画框模式" : "进入画框模式";
    renderAll();
  });

  el.uploadBtn.addEventListener("click", () => {
    el.uploadInput.click();
  });

  el.uploadInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImage = {
        id: uid("upload"),
        name: file.name,
        src: reader.result,
        category: "用户上传",
        contentElement: "page",
        contentKind: "图片",
        source: "upload",
        annotations: []
      };
      state.images.push(newImage);
      state.selectedImageId = newImage.id;
      state.draftRect = null;
      state.editingAnnoId = null;
      saveState();
      renderAll();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  el.saveImageMetaBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) {
      return;
    }
    img.contentElement = el.imageContentElement.value;
    img.contentKind = el.imageContentKind.value;
    saveState();
    renderAll();
  });

  el.saveAnnoBtn.addEventListener("click", () => {
    const img = selectedImage();
    if (!img) {
      return;
    }
    if (!state.draftRect || state.draftRect.w < 0.005 || state.draftRect.h < 0.005) {
      alert("请先在中间图片中画出有效框选区域");
      return;
    }

    const tag = findTag(state.selectedTagId);
    if (!tag) {
      alert("请先选择一个标签");
      return;
    }

    const payload = {
      id: state.editingAnnoId || uid("anno"),
      tagId: tag.id,
      tagName: tag.name,
      tagPath: tagPath(tag.id),
      shape: el.annoShapeSelect.value,
      transcription: el.annoTranscription.value.trim(),
      note: el.annoNote.value.trim(),
      rect: { ...state.draftRect }
    };

    const idx = img.annotations.findIndex((a) => a.id === payload.id);
    if (idx >= 0) {
      img.annotations[idx] = payload;
    } else {
      img.annotations.push(payload);
    }

    state.draftRect = null;
    state.editingAnnoId = null;
    state.drawMode = false;
    el.toggleDrawModeBtn.textContent = "进入画框模式";
    saveState();
    renderAll();
  });

  el.clearDraftBtn.addEventListener("click", () => {
    state.draftRect = null;
    state.editingAnnoId = null;
    clearAnnoForm();
    renderBoxes();
  });
}

loadState();
initDraw();
bindEvents();
renderAll();
