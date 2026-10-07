'use strict';
const $ = id => document.getElementById(id);
const token = document.querySelector('meta[name="decor-token"]').content;
const state = {catalog: null, selected: new Map(), tab: 'recent', busy: false, preview: null};
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return node;
}
function notice(message, error = false) {
  $('notice').replaceChildren(message ? el('div', {class: 'notice' + (error ? ' error' : ''), text: message}) : document.createTextNode(''));
}
async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Decor-Token': token}, body: JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '操作失敗');
  return result;
}
function controls() {
  $('refresh').disabled = state.busy;
  $('preview').disabled = state.busy || state.selected.size === 0;
  $('clear').disabled = state.busy || state.selected.size === 0;
  $('apply').disabled = state.busy || !state.preview;
  $('selected-list').querySelectorAll('input,button').forEach(node => {node.disabled = state.busy;});
}
async function job(path, body = {}) {
  state.busy = true; controls(); notice(''); $('progress').classList.remove('hidden');
  $('progress-message').textContent = '正在準備…'; $('progress-log').textContent = '';
  try {
    const {job_id} = await api(path, body);
    while (true) {
      const status = await api('/api/jobs/' + job_id);
      $('progress-message').textContent = status.message;
      $('progress-log').textContent = (status.logs || []).join('\n');
      if (status.state === 'error') throw new Error(status.message);
      if (status.state === 'done') return status.result;
      await new Promise(resolve => setTimeout(resolve, 750));
    }
  } finally { state.busy = false; controls(); }
}
function acceptCatalog(catalog) {
  state.catalog = catalog;
  $('window').textContent = `${catalog.cutoff} — ${catalog.today}`;
  for (const id of state.selected.keys()) if (!catalog.items.some(item => item.id === id)) state.selected.delete(id);
  render();
  if (catalog.errors.length) notice(catalog.errors.map(error => `${error.type} 來源讀取失敗：${error.message}`).join('；'), true);
}
function itemFor(id) { return state.catalog?.items.find(item => item.id === id); }
function choose(id, rerender = true) {
  if (state.busy) return;
  if (state.selected.has(id)) state.selected.delete(id);
  else {
    const item = itemFor(id); if (!item) return;
    state.selected.set(id, {id, chinese_name: item.category_chinese, translations: {}, overwrite: false});
  }
  invalidate(); if (rerender) render();
}
function invalidate() { state.preview = null; controls(); }
function addTargets(ids) {
  if (state.busy) return;
  for (const id of ids) if (!state.selected.has(id)) choose(id, false);
  render();
}
function selection() {
  $('selected-count').textContent = state.selected.size;
  document.body.classList.toggle('has-selection', state.selected.size > 0);
  const nodes = [];
  for (const [id, values] of state.selected) {
    const item = itemFor(id); if (!item) continue;
    const fields = item.requirements.map(requirement => el('label', {text: requirement.label + ' · 繁體中文名稱'}, [
      el('input', {type: 'text', value: requirement.key === 'category' ? values.chinese_name : (values.translations[requirement.key] || ''),
        placeholder: '請填入中文名稱', required: true,
        onInput: event => { if (requirement.key === 'category') values.chinese_name = event.target.value; else values.translations[requirement.key] = event.target.value; invalidate(); },
        ariaLabel: requirement.label + '的中文名稱'})
    ]));
    nodes.push(el('div', {class: 'selected-item'}, [
      el('div', {class: 'title'}, [el('strong', {text: item.local_name ? `${item.local_name} · ${item.name}` : item.name}), el('button', {class: 'icon-button', text: '×', ariaLabel: '移除 ' + item.name, disabled: state.busy, onClick: () => choose(id)})]),
      el('small', {text: `${item.status} · 缺少 ${item.missing_images}/${item.image_count} 張圖片`}), ...fields,
      el('label', {class: 'check'}, [el('input', {type: 'checkbox', checked: values.overwrite, disabled: state.busy, onChange: event => {values.overwrite = event.target.checked; invalidate();}}), '覆寫此飾品的既有圖片'])
    ]));
  }
  $('selected-list').replaceChildren(...(nodes.length ? nodes : [el('p', {class: 'muted', text: '從更新清單或所有飾品中，加入想更新的項目。'})]));
  controls();
}
function badge(text, kind = '') { return el('span', {class: 'badge ' + kind, text}); }
function sourceLink(url) { return el('a', {href: url, target: '_blank', rel: 'noopener', text: '查看 Wiki 原文 ↗'}); }
function matchesType(item) { return $('type').value === 'all' || item.type === $('type').value; }
function needsUpdate(item) { return item.missing_images > 0 || item.new_colors.length > 0 || item.requirements.length > 0; }
function matchesSearch(item) {
  const query = $('search').value.trim().toLowerCase();
  return !query || [item.name, item.local_name, item.category, item.description, item.category_chinese].filter(Boolean).join(' ').toLowerCase().includes(query);
}
function catalogCard(item) {
  const chosen = state.selected.has(item.id);
  return el('article', {class: 'catalog-card'}, [
    el('img', {src: item.preview_image, alt: item.name, loading: 'lazy', onError: event => {event.target.style.visibility = 'hidden';}}),
    el('div', {class: 'info'}, [badge(item.type === 'special' ? 'SPECIAL DECOR' : '一般飾品', item.type), ' ', badge(item.status, item.status === '已收錄' ? '' : 'new'),
      el('h3', {text: item.local_name ? `${item.local_name} · ${item.name}` : item.name}),
      el('p', {text: `${item.image_count} 款 · 缺少 ${item.missing_images} 張圖片${item.new_colors.length ? ' · 新顏色 ' + item.new_colors.join(', ') : ''}`}), sourceLink(item.source)]),
    el('button', {class: 'choose' + (chosen ? ' chosen' : ''), text: chosen ? '✓ 已加入' : '+ 加入', disabled: state.busy, onClick: () => choose(item.id)})
  ]);
}
function eventCard(event) {
  const targets = event.targets.map(itemFor).filter(Boolean).filter(item => !$('needs').checked || needsUpdate(item));
  return el('article', {class: 'event'}, [
    el('div', {class: 'event-top'}, [el('div', {}, [badge(event.type === 'special' ? 'SPECIAL DECOR' : '一般飾品', event.type), ' ', badge(event.kind, 'new')]), el('span', {class: 'date', text: event.date_label || '日期不明'})]),
    el('h3', {text: event.category}), el('p', {class: 'original', text: event.description}),
    el('div', {class: 'suggested'}, targets.map(item => el('button', {class: state.selected.has(item.id) ? 'chosen' : '', text: (state.selected.has(item.id) ? '✓ ' : '+ ') + (item.local_name || item.name), disabled: state.busy, title: item.name, onClick: () => choose(item.id)}))),
    el('div', {class: 'event-bottom'}, [sourceLink(event.source), targets.length ? el('button', {text: '加入建議項目（' + targets.length + '）', disabled: state.busy, onClick: () => addTargets(targets.map(item => item.id))}) : el('span', {class: 'muted', text: '無法自動對應造型，可到「所有飾品」搜尋。'})])
  ]);
}
function render() {
  if (!state.catalog) {selection(); return;}
  let values;
  if (state.tab === 'all') values = state.catalog.items.filter(matchesType).filter(matchesSearch).filter(item => !$('needs').checked || needsUpdate(item));
  else values = (state.tab === 'recent' ? state.catalog.events : state.catalog.undated).filter(matchesType).filter(event => matchesSearch(event) || event.targets.some(id => itemFor(id) && matchesSearch(itemFor(id)))).filter(event => !$('needs').checked || event.targets.some(id => itemFor(id) && needsUpdate(itemFor(id))));
  $('list-heading').textContent = state.tab === 'all' ? '全部可下載飾品' : state.tab === 'undated' ? 'Wiki 未提供明確日期 · 不列入近半年' : '近半年新增與復刻';
  $('count').textContent = `${values.length} ${state.tab === 'all' ? '個飾品' : '則資訊'}`;
  $('list').replaceChildren(...(values.length ? values.map(state.tab === 'all' ? catalogCard : eventCard) : [el('div', {class: 'empty'}, [el('span', {text: '🍃'}), el('h2', {text: '目前沒有符合的項目'}), el('p', {text: '可調整篩選條件，或到「所有飾品」查看完整清單。'})])]));
  selection();
}
async function preview() {
  if (state.busy) return;
  for (const [id, selection] of state.selected) {
    for (const requirement of itemFor(id).requirements) {
      const value = requirement.key === 'category' ? selection.chinese_name : selection.translations[requirement.key];
      if (!value?.trim()) { notice('請先填入「' + requirement.label + '」的中文名稱。', true); $('selected-list').querySelector('input:invalid')?.focus(); return; }
    }
  }
  state.busy = true; controls(); notice('');
  try {
    const result = await api('/api/preview', {selections: [...state.selected.values()]});
    state.preview = result;
    const plans = result.summaries.map(summary => el('section', {class: 'plan'}, [
      el('h3', {text: summary.name}), el('p', {text: `JSON 第 ${summary.position} 項 · ${summary.previous_name || '開頭'} → ${summary.after.name} → ${summary.next_name || '結尾'}`}),
      el('div', {class: 'json-diff'}, [el('details', {open: true}, [el('summary', {text: '更新前'}), el('pre', {text: summary.before ? JSON.stringify(summary.before, null, 2) : '尚未收錄'})]), el('details', {open: true}, [el('summary', {text: '更新後'}), el('pre', {text: JSON.stringify(summary.after, null, 2)})])])
    ]));
    $('preview-content').replaceChildren(el('div', {class: 'counts'}, [el('span', {text: `新增圖片 ${result.counts.download}`}), el('span', {text: `保留圖片 ${result.counts.keep}`}), el('span', {class: 'replace', text: `覆寫圖片 ${result.counts.replace}`})]), ...plans,
      el('details', {}, [el('summary', {text: `本次圖片清單（${result.files.length}）`}), el('ul', {class: 'file-list'}, result.files.map(file => el('li', {class: file.action, text: ({keep: '保留', replace: '覆寫', download: '下載'})[file.action] + ' · ' + file.relative})))]));
    $('preview-dialog').showModal();
  } catch (error) { notice(error.message, true); }
  finally { state.busy = false; controls(); }
}
async function refresh() {
  try { state.preview = null; const result = await job('/api/refresh'); acceptCatalog(result); }
  catch (error) { notice(error.message, true); }
  finally { render(); }
}
async function apply() {
  if (!state.preview || state.busy) return;
  const preview_id = state.preview.preview_id;
  $('preview-dialog').close();
  try {
    const result = await job('/api/apply', {preview_id});
    state.selected.clear(); state.preview = null;
    acceptCatalog(await api('/api/catalog'));
    notice(`${result.message}。寫入 ${result.changed_images} 張、保留 ${result.kept_images} 張。JSON 備份：${result.backup}`);
  } catch (error) {state.preview = null; notice(error.message, true);}
  finally {render();}
}
$('refresh').addEventListener('click', refresh);
$('preview').addEventListener('click', preview);
$('apply').addEventListener('click', apply);
$('clear').addEventListener('click', () => {state.selected.clear(); invalidate(); render();});
$('back').addEventListener('click', () => $('preview-dialog').close());
$('close-preview').addEventListener('click', () => $('preview-dialog').close());
for (const button of document.querySelectorAll('[data-tab]')) button.addEventListener('click', () => {
  state.tab = button.dataset.tab;
  for (const tab of document.querySelectorAll('[data-tab]')) {const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active);}
  render();
});
for (const id of ['search', 'type', 'needs']) $(id).addEventListener(id === 'search' ? 'input' : 'change', render);
api('/api/catalog').then(catalog => {if (catalog.ready) acceptCatalog(catalog); else refresh();}).catch(error => notice(error.message, true));
selection();
