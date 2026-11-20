/* 人物筛选、关系索引与可键盘操作的单人中心关系图。无外部图形依赖。 */
window.HistoryPeople = (() => {
  'use strict';
  const data = window.HISTORY_PEOPLE;
  const esc = window.TLShared.esc;
  const assetBase = new URL('.', document.currentScript.src);
  const personMap = new Map(data.people.map(person => [person.id, person]));
  const groupMap = new Map(data.groups.map(group => [group.id, group]));
  const kindMap = new Map(data.relationKinds.map(kind => [kind.id, kind]));
  const normalize = value => String(value).normalize('NFKC').replace(/\s/g, '').toLowerCase();
  const personHref = person => 'person.html?person=' + encodeURIComponent(person.id);
  const relationsFor = (id, kind = 'all') => data.relations.filter(relation =>
    (relation.from === id || relation.to === id) && (kind === 'all' || relation.kind === kind));
  const otherPerson = (relation, id) => personMap.get(relation.from === id ? relation.to : relation.from);
  const peopleForEvent = id => data.people.filter(person => person.eventIds.includes(id));
  function filterPeople({query = '', group = 'all', era = 'all'} = {}) {
    const q = normalize(query);
    return data.people.filter(person => (group === 'all' || person.group === group) && (era === 'all' || person.era === era)
      && normalize([person.name, ...person.aliases, person.role, person.summary, ...person.tags, ...person.facts.map(f => f.text)].join(' ')).includes(q));
  }
  function sourcesHTML(ids) {
    return `<ul class="hp-sources">${[...new Set(ids)].map(id => { const source = data.sources[id];
      return `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} · ${esc(source.title)}（需联网）↗</a></li>`;
    }).join('')}</ul>`;
  }
  function cardHTML(person) {
    const group = groupMap.get(person.group), image = person.image;
    return `<article class="hp-card" data-person="${esc(person.id)}" style="--person-color:${group.color}">
      <figure class="hp-card-figure"><a class="hp-card-image" href="${personHref(person)}" tabindex="-1" aria-hidden="true"><img src="${esc(new URL(image.src, assetBase).href)}" width="${image.width}" height="${image.height}" alt="" loading="lazy" decoding="async"></a><figcaption>${esc(image.caption)}</figcaption></figure>
      <div class="hp-card-body"><p class="hp-category">${esc(group.label)} · ${esc(person.region)}</p><h3><a href="${personHref(person)}">${esc(person.name)} <span aria-hidden="true">↗</span></a></h3>
        <p class="hp-card-life">${esc(person.life)}</p><p class="hp-role">${esc(person.role)}</p><p>${esc(person.summary)}</p>
        <div class="hp-tags">${person.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
        <div class="hp-card-actions"><a href="${personHref(person)}#decisions">读关键决策 →</a><button type="button" data-network="${esc(person.id)}">看关系网</button></div>
      </div></article>`;
  }
  function compactCardHTML(person) {
    const { image } = person;
    return `<article class="hp-mini-card" data-person="${esc(person.id)}">
      <figure><img src="${esc(new URL(image.src, assetBase).href)}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}" loading="lazy" decoding="async">
        <figcaption>${esc(image.caption)}</figcaption></figure>
      <div><a class="hp-mini-name" href="${personHref(person)}">${esc(person.name)} →</a>
        <p class="hp-mini-life">${esc(person.life)} · ${esc(person.role)}</p>
        <p>${esc(person.summary)}</p>
      </div>
    </article>`;
  }
  function graphHTML(id, kind = 'all', gallery = false) {
    const person = personMap.get(id), relations = relationsFor(id, kind);
    const neighbors = [...new Set(relations.map(relation => otherPerson(relation, id).id))].map(key => personMap.get(key));
    function draw(portrait) {
      const origin = portrait ? [300, 130] : [500, 300];
      const positions = new Map([[id, origin]]);
      neighbors.forEach((neighbor, i) => {
        if (portrait) {
          positions.set(neighbor.id, neighbors.length === 1 ? [300, 450] :
            [i < 2 ? 160 + i * 280 : 300, i < 2 ? 400 : 680 + (i - 2) * 190]);
        } else {
          const angle = neighbors.length === 1 ? 0 : -Math.PI / 2 + i * Math.PI * 2 / neighbors.length;
          positions.set(neighbor.id, [500 + 345 * Math.cos(angle), 300 + 205 * Math.sin(angle)]);
        }
      });
      const [cx, cy] = origin;
      const lines = relations.map(relation => {
        const target = otherPerson(relation, id), [x, y] = positions.get(target.id), direct = kindMap.get(relation.kind).direct;
        return `<g class="hp-graph-edge${direct ? ' is-direct' : ''}"><path d="M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}"/><text x="${cx + (x - cx) * .65}" y="${cy + (y - cy) * .65 - 10}">${esc(relation.label)}</text></g>`;
      }).join('');
      const nodes = [person, ...neighbors].map(node => {
        const [x, y] = positions.get(node.id), center = node.id === id, group = groupMap.get(node.group);
        const href = gallery ? `people.html?view=network&person=${encodeURIComponent(node.id)}` : personHref(node);
        return `<a class="hp-graph-node${center ? ' is-center' : ''}" href="${href}" ${gallery ? `data-focus="${esc(node.id)}"` : ''} tabindex="0" aria-label="${esc(node.name)}，${gallery ? '以此人为中心查看关系' : '打开人物名片'}">
          <rect x="${x - 112}" y="${y - 43}" width="224" height="86" rx="18" fill="${group.color}"/>
          <text class="hp-node-name" x="${x}" y="${y - 4}">${esc(node.name)}</text><text class="hp-node-group" x="${x}" y="${y + 24}">${center ? '当前人物 · ' : ''}${esc(group.label)}</text>
        </a>`;
      }).join('');
      const height = neighbors.length > 2 ? 780 + (neighbors.length - 3) * 190 : neighbors.length ? 550 : 300;
      return `<svg class="hp-graph hp-graph-${portrait ? 'portrait' : 'wide'}" viewBox="0 0 ${portrait ? '600 ' + height : '1000 600'}" role="group" aria-label="${esc(person.name)}的关系网"><title>${esc(person.name)}的关系网</title>${lines}${nodes}</svg>`;
    }
    return `<div class="hp-graph-scroll" tabindex="0" aria-label="人物关系图，可用键盘选择人物">${draw(false)}${draw(true)}</div>`;
  }

  function relationListHTML(id, kind = 'all') {
    const relations = relationsFor(id, kind);
    return relations.length ? `<div class="hp-relation-list">${relations.map(relation => {
      const from = personMap.get(relation.from), to = personMap.get(relation.to), type = kindMap.get(relation.kind);
      return `<article class="hp-relation"><span class="hp-relation-kind">${esc(type.label)}</span><h4><a href="${personHref(from)}">${esc(from.name)}</a> · <a href="${personHref(to)}">${esc(to.name)}</a></h4>
        <p>${esc(relation.note)}</p><details><summary>核查这条关系的出处</summary>${sourcesHTML(relation.sources)}</details></article>`;
    }).join('')}</div>` : '<p class="hp-empty">本馆暂未收录这一类型的关系。可以切换关系类型，或打开人物名片继续读。</p>';
  }
  return {data, personMap, groupMap, kindMap, assetBase, normalize, personHref, relationsFor, otherPerson, peopleForEvent, filterPeople, sourcesHTML, cardHTML, compactCardHTML, graphHTML, relationListHTML};
})();
