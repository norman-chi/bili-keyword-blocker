// ==UserScript==
// @name         B站关键词批量拉黑
// @namespace    https://github.com/norman-chi/bili-keyword-blocker
// @version      1.0
// @description  搜索关键词，批量拉黑搜索结果中的所有博主（支持视频搜索 + 用户搜索）
// @author       norman-chi
// @license      MIT
// @homepageURL  https://github.com/norman-chi/bili-keyword-blocker
// @match        *://www.bilibili.com/*
// @match        *://bilibili.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.bilibili.com
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ───────── 样式 ─────────
  GM_addStyle(`
    #bili-block-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 380px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: -apple-system, sans-serif;
      font-size: 13px;
    }
    #bili-block-panel h3 {
      margin: 0;
      padding: 12px 14px;
      background: #fb7299;
      color: #fff;
      border-radius: 8px 8px 0 0;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #bili-block-panel h3 span { cursor: pointer; opacity: .8; }
    #bili-block-panel h3 span:hover { opacity: 1; }
    #bili-block-panel .body { padding: 12px 14px; }
    #bili-block-panel label { display: block; margin-bottom: 4px; color: #555; }
    #bili-block-panel input[type=text] {
      width: 100%; box-sizing: border-box;
      border: 1px solid #ccc; border-radius: 4px;
      padding: 6px 8px; font-size: 13px; margin-bottom: 8px;
    }
    #bili-block-panel select {
      width: 100%; box-sizing: border-box;
      border: 1px solid #ccc; border-radius: 4px;
      padding: 6px 8px; font-size: 13px; margin-bottom: 8px;
    }
    #bili-block-panel .row { display: flex; gap: 8px; margin-bottom: 8px; }
    #bili-block-panel button {
      flex: 1; padding: 7px 0; border: none; border-radius: 4px;
      cursor: pointer; font-size: 13px; font-weight: 500;
    }
    #bili-block-panel .btn-search { background: #23ade5; color: #fff; }
    #bili-block-panel .btn-search:hover { background: #1a9fd8; }
    #bili-block-panel .btn-block { background: #fb7299; color: #fff; }
    #bili-block-panel .btn-block:hover { background: #e55f85; }
    #bili-block-panel .btn-block:disabled { background: #ccc; cursor: not-allowed; }
    #bili-block-panel .btn-clear { background: #eee; color: #555; flex: 0 0 auto; padding: 7px 12px; }
    #bili-block-panel .btn-clear:hover { background: #ddd; }
    #bili-block-panel #bp-log {
      max-height: 180px; overflow-y: auto;
      background: #f9f9f9; border: 1px solid #eee;
      border-radius: 4px; padding: 6px 8px;
      font-size: 12px; line-height: 1.6; color: #333;
    }
    #bili-block-panel .log-ok { color: #2e7d32; }
    #bili-block-panel .log-err { color: #c62828; }
    #bili-block-panel .log-info { color: #1565c0; }
    #bili-block-panel .log-warn { color: #e65100; }
    #bili-block-panel .tag-list {
      display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;
    }
    #bili-block-panel .tag {
      background: #fce4ec; color: #880e4f;
      border-radius: 3px; padding: 2px 6px; font-size: 11px;
      cursor: pointer; user-select: none;
    }
    #bili-block-panel .tag:hover { background: #f8bbd0; }
    #bili-block-panel .tip { color: #999; font-size: 11px; margin-bottom: 8px; }
    #bili-block-panel .preview-list {
      max-height: 260px; overflow-y: auto;
      border: 1px solid #eee; border-radius: 4px;
      background: #f9f9f9; padding: 6px 8px;
      font-size: 12px; line-height: 1.5;
    }
    #bili-block-panel .preview-user {
      padding: 6px 0; border-bottom: 1px solid #eee;
    }
    #bili-block-panel .preview-user:last-child { border-bottom: none; }
    #bili-block-panel .preview-user-head {
      display: flex; align-items: center; gap: 6px;
      min-width: 0; margin-bottom: 6px;
    }
    #bili-block-panel .preview-user-link {
      color: #23ade5; min-width: 0; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }
    #bili-block-panel .preview-uid {
      color: #999; white-space: nowrap; font-size: 11px;
    }
    #bili-block-panel .btn-remove-user {
      flex: 0 0 auto; margin-left: auto;
      background: #eee; color: #555;
      padding: 3px 8px; font-size: 12px; font-weight: 400;
    }
    #bili-block-panel .btn-remove-user:hover { background: #ddd; }
    #bili-block-panel .preview-thumbs {
      display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;
    }
    #bili-block-panel .preview-thumb-link {
      display: block; flex: 0 0 auto;
      width: 92px; color: #555; text-decoration: none;
    }
    #bili-block-panel .preview-thumb-link img {
      display: block; width: 92px; height: 52px;
      object-fit: cover; border-radius: 4px;
      background: #eee; border: 1px solid #eee;
      box-sizing: border-box;
    }
    #bili-block-panel .preview-thumb-title {
      display: block; margin-top: 3px;
      overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; font-size: 11px;
    }
  `);

  // ───────── 面板 HTML ─────────
  const panel = document.createElement('div');
  panel.id = 'bili-block-panel';
  panel.innerHTML = `
    <h3>🚫 关键词批量拉黑 <span id="bp-toggle">−</span></h3>
    <div class="body" id="bp-body">
      <label>搜索关键词（回车添加多个）</label>
      <input type="text" id="bp-keyword" placeholder="输入关键词，回车添加…" />
      <div class="tag-list" id="bp-tags"></div>

      <label>搜索类型</label>
      <select id="bp-type">
        <option value="video">视频（拉黑视频作者）</option>
        <option value="bili_user">用户（直接拉黑搜索到的账号）</option>
      </select>

      <label>每个关键词抓取页数（每页约20条）</label>
      <select id="bp-pages">
        <option value="1">1页（~20个博主）</option>
        <option value="2">2页（~40个博主）</option>
        <option value="3">3页（~60个博主）</option>
        <option value="5" selected>5页（~100个博主）</option>
        <option value="10">10页（~200个博主）</option>
      </select>

      <div class="tip">💡 建议先用1页预览，确认后再大量拉黑</div>

      <div class="row">
        <button class="btn-search" id="bp-fetch">① 获取博主列表</button>
        <button class="btn-clear" id="bp-reset">清空</button>
      </div>

      <div id="bp-preview" style="display:none;margin-bottom:8px;">
        <label id="bp-preview-label"></label>
        <div id="bp-preview-list" class="preview-list"></div>
      </div>

      <button class="btn-block" id="bp-block" disabled>② 确认并批量拉黑</button>

      <div style="margin-top:8px;">
        <label>执行日志</label>
        <div id="bp-log"><span class="log-info">等待操作…</span></div>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // ───────── 工具函数 ─────────
  const $ = id => document.getElementById(id);
  const log = (msg, cls = 'log-info') => {
    const d = $('bp-log');
    const item = document.createElement('div');
    item.className = cls;
    item.textContent = msg;
    d.appendChild(item);
    d.scrollTop = d.scrollHeight;
    console.log(`[B站拉黑] ${msg}`);  // 同时输出到 F12 Console
  };

  const getCookie = name => {
    const m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ───────── 关键词 Tag 管理 ─────────
  let keywords = [];

  const renderTags = () => {
    const tags = $('bp-tags');
    tags.textContent = '';
    keywords.forEach((kw, i) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.dataset.i = i;
      tag.textContent = `${kw} ×`;
      tag.onclick = () => { keywords.splice(+tag.dataset.i, 1); renderTags(); };
      tags.appendChild(tag);
    });
  };

  $('bp-keyword').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = e.target.value.trim();
      if (v && !keywords.includes(v)) { keywords.push(v); renderTags(); }
      e.target.value = '';
    }
  });

  // ───────── 折叠 ─────────
  $('bp-toggle').onclick = () => {
    const body = $('bp-body');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    $('bp-toggle').textContent = collapsed ? '−' : '+';
  };

  $('bp-reset').onclick = () => {
    keywords = [];
    renderTags();
    $('bp-preview').style.display = 'none';
    $('bp-block').disabled = true;
    $('bp-log').innerHTML = '<span class="log-info">已清空。</span>';
    collectedUids.clear();
    uidNames.clear();
    uidVideos.clear();
  };

  // ───────── 数据结构 ─────────
  let collectedUids = new Set();
  let uidNames = new Map();
  let uidVideos = new Map();

  const normalizePicUrl = url => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  };

  const stripHtml = html => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  const getVideoUrl = item => {
    if (item.arcurl) return item.arcurl;
    if (item.bvid) return `https://www.bilibili.com/video/${item.bvid}`;
    if (item.aid) return `https://www.bilibili.com/video/av${item.aid}`;
    return '';
  };

  const addVideoPreview = (uid, item) => {
    const pic = normalizePicUrl(item.pic);
    if (!pic) return;

    const videos = uidVideos.get(uid) || [];
    const url = getVideoUrl(item);
    const key = url || pic;
    if (videos.some(video => video.key === key)) return;

    videos.push({
      key,
      pic,
      title: stripHtml(item.title) || '视频封面',
      url,
    });
    uidVideos.set(uid, videos.slice(0, 6));
  };

  const renderPreview = () => {
    const uids = [...collectedUids];
    const previewList = $('bp-preview-list');
    previewList.textContent = '';

    uids.forEach(uid => {
      const item = document.createElement('div');
      item.className = 'preview-user';

      const head = document.createElement('div');
      head.className = 'preview-user-head';

      const link = document.createElement('a');
      link.href = `https://space.bilibili.com/${uid}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'preview-user-link';
      link.textContent = uidNames.get(uid) || `UID:${uid}`;

      const uidText = document.createElement('span');
      uidText.className = 'preview-uid';
      uidText.textContent = `(uid:${uid})`;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remove-user';
      removeBtn.textContent = '移除';
      removeBtn.onclick = () => {
        const name = uidNames.get(uid) || `UID:${uid}`;
        collectedUids.delete(uid);
        uidNames.delete(uid);
        uidVideos.delete(uid);
        renderPreview();
        $('bp-block').disabled = collectedUids.size === 0;
        log(`已从待拉黑列表移除：${name}`, 'log-info');
      };

      head.append('· ', link, uidText, removeBtn);
      item.appendChild(head);

      const videos = uidVideos.get(uid) || [];
      if (videos.length > 0) {
        const thumbs = document.createElement('div');
        thumbs.className = 'preview-thumbs';
        videos.forEach(video => {
          const thumbLink = document.createElement(video.url ? 'a' : 'span');
          thumbLink.className = 'preview-thumb-link';
          if (video.url) {
            thumbLink.href = video.url;
            thumbLink.target = '_blank';
            thumbLink.rel = 'noopener noreferrer';
          }

          const img = document.createElement('img');
          img.src = video.pic;
          img.alt = video.title;
          img.title = video.title;
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';

          const title = document.createElement('span');
          title.className = 'preview-thumb-title';
          title.textContent = video.title;
          title.title = video.title;

          thumbLink.append(img, title);
          thumbs.appendChild(thumbLink);
        });
        item.appendChild(thumbs);
      }

      previewList.appendChild(item);
    });

    $('bp-preview-label').textContent = `共保留 ${uids.length} 位博主，可先移除不需要拉黑的博主：`;
  };

  // ───────── API 封装 ─────────
  const apiGet = (url) => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      headers: { 'Referer': 'https://www.bilibili.com/', 'User-Agent': navigator.userAgent },
      withCredentials: true,
      onload: res => {
        console.log('[B站拉黑] GET', url, res.status, res.responseText.slice(0, 200));
        try { resolve(JSON.parse(res.responseText)); }
        catch (e) { reject(new Error('JSON解析失败: ' + res.responseText.slice(0, 100))); }
      },
      onerror: (e) => { console.error('[B站拉黑] 请求失败', e); reject(new Error('网络请求失败')); },
    });
  });

  const apiPost = (url, body) => new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': navigator.userAgent,
        'Origin': 'https://www.bilibili.com',
      },
      data: body,
      withCredentials: true,
      onload: res => {
        console.log('[B站拉黑] POST', url, 'body:', body, '→ status:', res.status, 'resp:', res.responseText.slice(0, 300));
        try { resolve(JSON.parse(res.responseText)); }
        catch (e) { reject(new Error('JSON解析失败: ' + res.responseText.slice(0, 100))); }
      },
      onerror: (e) => { console.error('[B站拉黑] POST失败', e); reject(new Error('网络请求失败')); },
    });
  });

  // ───────── 搜索 & 收集 UID ─────────
  const fetchPage = async (keyword, type, page) => {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=${type}&keyword=${encodeURIComponent(keyword)}&page=${page}&page_size=20&platform=pc`;
    const data = await apiGet(url);
    if (data.code !== 0) throw new Error(`API错误 code=${data.code}: ${data.message}`);
    const result = data.data?.result || [];
    result.forEach(item => {
      const uid = item.mid;
      const name = item.author || item.uname || `UID:${uid}`;
      if (uid && uid > 0) {
        collectedUids.add(uid);
        uidNames.set(uid, name);
        if (type === 'video') addVideoPreview(uid, item);
      }
    });
    return result.length;
  };

  // ───────── 获取按钮 ─────────
  $('bp-fetch').onclick = async () => {
    const inputVal = $('bp-keyword').value.trim();
    if (inputVal && !keywords.includes(inputVal)) {
      keywords.push(inputVal); $('bp-keyword').value = ''; renderTags();
    }
    if (keywords.length === 0) { log('⚠️ 请先输入至少一个关键词（回车确认）', 'log-warn'); return; }

    collectedUids.clear(); uidNames.clear(); uidVideos.clear();
    $('bp-block').disabled = true;
    $('bp-preview').style.display = 'none';
    $('bp-log').innerHTML = '';

    const type = $('bp-type').value;
    const pages = +$('bp-pages').value;

    $('bp-fetch').disabled = true;
    $('bp-fetch').textContent = '获取中…';

    for (const kw of keywords) {
      log(`🔍 搜索「${kw}」（${type === 'video' ? '视频' : '用户'}，${pages}页）`, 'log-info');
      for (let p = 1; p <= pages; p++) {
        try {
          const count = await fetchPage(kw, type, p);
          log(`  第${p}页 OK（${count}条），累计 ${collectedUids.size} 个博主`, 'log-ok');
          if (count === 0) { log(`  第${p}页无结果，停止翻页`, 'log-warn'); break; }
          await sleep(600);
        } catch (e) {
          log(`  第${p}页失败: ${e.message}`, 'log-err');
        }
      }
    }

    $('bp-fetch').disabled = false;
    $('bp-fetch').textContent = '① 获取博主列表';

    if (collectedUids.size === 0) {
      log('❌ 未找到任何博主，请检查关键词或切换搜索类型', 'log-err');
      return;
    }

    renderPreview();
    $('bp-preview').style.display = '';
    $('bp-block').disabled = false;
    log(`✅ 收集完毕：${collectedUids.size} 位博主，请确认列表后点击「批量拉黑」`, 'log-ok');
  };

  // ───────── 逐个拉黑（单接口，最稳定）─────────
  const blockOne = async (uid, csrf) => {
    // 使用单个 relation/modify 接口，act=5 = 拉黑
    const body = new URLSearchParams({
      fid: String(uid),
      act: '5',
      re_src: '11',
      csrf,
    }).toString();
    const res = await apiPost('https://api.bilibili.com/x/relation/modify', body);
    if (res.code === 0) return { ok: true };
    // 22001 = 已经拉黑，视为成功
    if (res.code === 22001) return { ok: true, skipped: true };
    return { ok: false, msg: `code=${res.code} ${res.message}` };
  };

  // ───────── 拉黑按钮 ─────────
  $('bp-block').onclick = async () => {
    if (collectedUids.size === 0) return;

    const csrf = getCookie('bili_jct');
    if (!csrf) { log('❌ 未找到 bili_jct Cookie，请确认已登录B站', 'log-err'); return; }

    if (!confirm(`即将逐个拉黑 ${collectedUids.size} 位博主，确认继续？`)) return;

    $('bp-block').disabled = true;
    $('bp-block').textContent = '拉黑中…';

    const uids = [...collectedUids];
    let successCount = 0, skipCount = 0, failCount = 0;

    for (let i = 0; i < uids.length; i++) {
      const uid = uids[i];
      const name = uidNames.get(uid) || uid;
      try {
        const result = await blockOne(uid, csrf);
        if (result.ok) {
          if (result.skipped) {
            skipCount++;
            log(`  [${i+1}/${uids.length}] ${name} 已在黑名单，跳过`, 'log-warn');
          } else {
            successCount++;
            log(`  [${i+1}/${uids.length}] ✅ 已拉黑 ${name}`, 'log-ok');
          }
        } else {
          failCount++;
          log(`  [${i+1}/${uids.length}] ❌ ${name} 失败：${result.msg}`, 'log-err');
        }
      } catch (e) {
        failCount++;
        log(`  [${i+1}/${uids.length}] ❌ ${name} 异常：${e.message}`, 'log-err');
      }
      // 每次拉黑之间等 800ms，降低风控风险
      await sleep(800);
    }

    $('bp-block').textContent = '② 确认并批量拉黑';
    $('bp-block').disabled = false;
    log(`🎉 完成！拉黑: ${successCount}，已在黑名单: ${skipCount}，失败: ${failCount}`, 'log-ok');
  };

})();
