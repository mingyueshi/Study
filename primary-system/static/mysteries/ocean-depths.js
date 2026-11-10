const oceanDepths = document.querySelector('[data-ocean-depths]');
const oceanLinks = [...oceanDepths.querySelectorAll('.ocean-layer-link')];
const oceanPanels = [...oceanDepths.querySelectorAll('.ocean-layer-panel')];
const oceanProbe = oceanDepths.querySelector('.ocean-probe');
const oceanStepper = oceanDepths.querySelector('.ocean-stepper');
const oceanStatus = oceanDepths.querySelector('.ocean-dive-status');
const oceanStepButtons = [...oceanStepper.querySelectorAll('button')];
let oceanIndex = 0;

function showOceanLayer(index) {
  oceanIndex = index;
  oceanLinks.forEach((link, position) => {
    const active = position === index;
    if (active) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
    oceanPanels[position].hidden = !active;
  });
  oceanProbe.style.top = `${(index + 0.5) * 100 / oceanLinks.length}%`;
  oceanStatus.textContent = oceanPanels[index].querySelector('.ocean-depth-label').textContent;
  oceanStepButtons[0].disabled = index === 0;
  oceanStepButtons[1].disabled = index === oceanLinks.length - 1;
}

function selectOceanLayer(index) {
  showOceanLayer(index);
  history.replaceState(history.state, '', oceanLinks[index].hash);
}

function syncOceanHash() {
  const index = oceanLinks.findIndex(link => link.hash === location.hash);
  if (index !== -1) showOceanLayer(index);
}

oceanLinks.forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectOceanLayer(index);
    if (oceanPanels[index].getBoundingClientRect().top >= window.innerHeight) {
      oceanStepper.scrollIntoView({block: 'start'});
    }
  });
});

oceanStepButtons.forEach(button => {
  button.addEventListener('click', () => {
    selectOceanLayer(oceanIndex + Number(button.dataset.diveStep));
    if (button.disabled) oceanStepButtons.find(control => !control.disabled).focus();
  });
});

showOceanLayer(0);
syncOceanHash();
window.addEventListener('hashchange', syncOceanHash);
oceanStepper.hidden = false;
oceanProbe.hidden = false;
