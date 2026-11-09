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

  return {
    related,
    references: (id, heading = '看图查资料') => panel(heading, backlinks[id]),
    lesson: item => ({ ...item, ...lessonEdits[item.id] }),
  };
})();
