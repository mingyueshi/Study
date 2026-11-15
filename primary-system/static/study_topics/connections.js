window.StudyTopicConnections = (() => {
  const routes = document.querySelector('.study-topic-frame').dataset;
  const { groups, backlinks, lessonEdits } = window.STUDY_TOPIC_CONNECTIONS;
  const escape = text => text.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function panel(heading, links) {
    if (!links?.length) return '';
    const items = links.map(([route, suffix, label]) =>
      `<li><a href="${escape(routes[route] + suffix)}">${escape(label)} <span aria-hidden="true">→</span></a></li>`
    ).join('');
    return `<nav class="study-topic-related" aria-label="${escape(heading)}"><strong>${escape(heading)}</strong><ul>${items}</ul></nav>`;
  }

  function related(group, id) {
    const { route, heading, links } = groups[group];
    return panel(heading, links[id]?.map(([suffix, label]) => [route, suffix, label]));
  }

  function references(id, heading = '看图查资料') {
    const links = [...(backlinks[id] || [])];
    const journey = document.querySelector('.solar-journey');
    if (journey?.dataset.term && /^(gu|lu)/.test(id)) {
      links.unshift(['solarTerms', '#' + journey.dataset.term, '回' + journey.dataset.name + '卡，记下联读发现']);
    }
    return panel(heading, links);
  }

  return {
    related,
    references,
    lesson: item => ({ ...item, ...lessonEdits[item.id] }),
  };
})();
