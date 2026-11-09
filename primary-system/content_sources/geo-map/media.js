/* 同一份素材可挂在不同地图和省域站。图片随页面离线打开，来源由读者主动打开。 */
window.GMMedia = (() => {
  'use strict';
  const { esc } = window.GMShared;
  const A = window.GMAtlas;
  const types = [['photo', '地面实拍'], ['orbit', '太空影像'], ['video', '影片']];
  const labels = new Map(types);
  const entries = window.GM_MEDIA;
  const forPlace = id => entries.filter(m => m.places.includes(id));
  const galleryHref = id => 'gallery.html?' + new URLSearchParams({ place: id });

  const external = (href, text) =>
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;

  const image = (img) => `<img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy" decoding="async">`;

  function preview(id) {
    const items = forPlace(id);
    const first = items.find(m => m.images?.length);
    if (!first) return '';
    const photos = first.images.map(img => `<span>${image(img)}${img.label ? `<small>${esc(img.label)}</small>` : ''}</span>`).join('');
    const thumbs = first.images.length === 2 ? ' gm-media-thumbs--pair' : '';
    return '<section class="gm-media-preview" aria-label="地点实景">' +
      `<p class="gm-media-label">📷 ${labels.get(first.kind)}</p>` +
      `<a class="gm-media-cover" href="${esc(galleryHref(id))}">` +
      `<span class="gm-media-thumbs${thumbs}">${photos}</span><strong>${esc(first.title)}</strong></a>` +
      `<p>${esc(first.observe)}</p>` +
      `<a class="gm-media-link" href="${esc(galleryHref(id))}">看这个地点的全部 ${items.length} 项素材 →</a></section>`;
  }

  function card(m) {
    const paired = m.images?.length === 2;
    const photos = m.images
      ? `<div class="gm-media-images${paired ? ' gm-media-images--pair' : ''}">` + m.images.map(img =>
        `<figure><a href="${esc(img.src)}" target="_blank" rel="noopener" aria-label="放大查看${esc(img.label || m.title)}">${image(img)}</a>` +
        (img.label ? `<figcaption>${esc(img.label)}</figcaption>` : '') + '</figure>').join('') + '</div>'
      : '';
    const locations = m.places.map(id => {
      const p = A.get(id);
      return `<a href="${esc(A.mapHref(p))}">${esc(p.name)}<small>${A.mapLabel(p)}</small></a>`;
    }).join('');
    const source = m.kind === 'video' ? external(m.source, '去央视网观看（需联网）') : external(m.source, '原图与说明（需联网）');
    return `<article class="gm-media-card${paired ? ' gm-media-card--pair' : ''}">` +
      `<p class="gm-media-label">${labels.get(m.kind)}${m.kind === 'video' ? ' · 需联网' : ''}</p>` +
      `<h3>${esc(m.title)}</h3>${photos}<p>${esc(m.caption)}</p>` +
      `<p class="gm-media-observe"><b>看一看</b> ${esc(m.observe)}</p>` +
      `<div class="gm-media-places" aria-label="在地图上看">${locations}</div>` +
      `<p class="gm-media-credit">${esc(m.credit)} · ${source}` +
      (m.license ? ' · ' + external(m.license, '授权条款') : '') + '</p></article>';
  }

  return { types, entries, forPlace, preview, card };
})();
