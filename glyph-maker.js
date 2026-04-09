const API_BASE = "";

const el = {
  glyphChar: document.getElementById("glyphChar"),
  manualCodepoint: document.getElementById("manualCodepoint"),
  ids: document.getElementById("ids"),
  note: document.getElementById("note"),
  glyphImage: document.getElementById("glyphImage"),
  imagePreview: document.getElementById("imagePreview"),
  resultBox: document.getElementById("resultBox"),
  allocateBtn: document.getElementById("allocateBtn"),
  clearBtn: document.getElementById("clearBtn"),
  searchInput: document.getElementById("searchInput"),
  countText: document.getElementById("countText"),
  recordTbody: document.getElementById("recordTbody"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput")
};

const state = {
  records: [],
  imageDataUrl: ""
};

function nowIso() {
  return new Date().toISOString();
}

async function requestJson(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

async function loadRecords() {
  const data = await requestJson("/api/glyphs");
  state.records = Array.isArray(data.records) ? data.records : [];
}

function renderRecords() {
  const kw = (el.searchInput.value || "").trim().toLowerCase();
  const list = state.records.filter((r) => {
    if (!kw) return true;
    return [r.charGlyph, r.codepoint, r.ids, r.note].join(" ").toLowerCase().includes(kw);
  });

  el.recordTbody.innerHTML = "";
  list.forEach((r) => {
    const tr = document.createElement("tr");
    const imgHtml = r.imageDataUrl ? `<img src="${r.imageDataUrl}" alt="glyph" />` : "-";
    tr.innerHTML = `
      <td>${r.charGlyph || "-"}</td>
      <td>${r.codepoint}</td>
      <td>${r.codepointType}</td>
      <td>${imgHtml}</td>
      <td>${r.ids || "-"}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td><button data-id="${r.id}" class="row-del">删除</button></td>
    `;
    el.recordTbody.appendChild(tr);
  });

  el.countText.textContent = `共 ${list.length} 条`;
}

function clearForm() {
  el.glyphChar.value = "";
  el.manualCodepoint.value = "";
  el.ids.value = "";
  el.note.value = "";
  el.glyphImage.value = "";
  el.imagePreview.removeAttribute("src");
  state.imageDataUrl = "";
  el.resultBox.textContent = "未分配编码";
}

async function createRecord() {
  const charGlyph = (el.glyphChar.value || "").trim();
  const payload = {
    charGlyph,
    manualCodepoint: (el.manualCodepoint.value || "").trim(),
    ids: (el.ids.value || "").trim(),
    note: (el.note.value || "").trim(),
    imageDataUrl: state.imageDataUrl || "",
    createdAt: nowIso()
  };

  const data = await requestJson("/api/glyphs", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const record = data.record;
  state.records.unshift(record);
  el.resultBox.textContent = `已分配: ${record.codepoint} (${record.codepointType})`;
  renderRecords();
}

function bindEvents() {
  el.allocateBtn.addEventListener("click", async () => {
    try {
      await createRecord();
    } catch (err) {
      alert(err.message || "分配失败");
    }
  });

  el.clearBtn.addEventListener("click", clearForm);

  el.searchInput.addEventListener("input", renderRecords);

  el.glyphImage.addEventListener("change", (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.imageDataUrl = String(reader.result || "");
      el.imagePreview.src = state.imageDataUrl;
    };
    reader.readAsDataURL(file);
  });

  el.recordTbody.addEventListener("click", async (evt) => {
    const target = evt.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute("data-id");
    if (!id) return;
    try {
      await requestJson(`/api/glyphs/${id}`, { method: "DELETE" });
      state.records = state.records.filter((r) => r.id !== id);
      renderRecords();
    } catch (err) {
      alert(err.message || "删除失败");
    }
  });

  el.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glyph-records-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  el.importInput.addEventListener("change", (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || "[]"));
        if (!Array.isArray(parsed)) throw new Error("JSON 格式错误");
        await requestJson("/api/glyphs/import", {
          method: "POST",
          body: JSON.stringify({ records: parsed })
        });
        state.records = parsed;
        renderRecords();
      } catch (err) {
        alert(err.message || "导入失败");
      }
    };
    reader.readAsText(file, "utf-8");
    evt.target.value = "";
  });
}

async function init() {
  try {
    const health = await requestJson("/api/health");
    el.resultBox.textContent = `后端已连接，当前模式: ${health.mode}`;
  } catch (_) {
    el.resultBox.textContent = "后端未连接，请先启动 server";
  }

  await loadRecords().catch(() => {
    state.records = [];
  });
  bindEvents();
  renderRecords();
}

init();
