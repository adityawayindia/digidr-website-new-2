/* Published plan amounts are stored on the cards; no checkout or payment collection. */
(() => {
  'use strict';
  const page = document.querySelector('[data-pricing-page]');
  if (!page) return;
  const buttons = [...page.querySelectorAll('[data-billing-term]')];
  const cards = [...page.querySelectorAll('[data-plan]')];
  const note = page.querySelector('#pricing-term-note');
  const sixMonthNote = note.textContent;
  const selected = page.querySelector('[data-selected-plan]');
  const registration = page.querySelector('[data-pricing-register]');
  const format = value => `₹${new Intl.NumberFormat('en-IN').format(Number(value))}`;
  let term = '6';
  let plan = '';
  const paidCards = cards.filter(card => card.dataset.plan !== 'lite');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let initialised = false;
  let transitionId = 0;
  let animations = [];

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches) cancelAnimations();
  });

  function updateSelection() {
    if (!plan) return;
    const period = plan === 'Lite' ? 'free plan' : `${term}-month plan`;
    selected.textContent = `Your choice: ${plan} · ${period}. Share this preference with the DigiDr team during onboarding.`;
    selected.hidden = false;
    registration.textContent = plan === 'Lite' ? 'Get started with Lite ↗' : `Get started with ${plan} ↗`;
  }

  async function chooseTerm(value) {
    if (!['6', '12'].includes(value) || (initialised && value === term)) return;
    const currentTransition = ++transitionId;
    const shouldAnimate = initialised && !reducedMotion.matches && paidCards.every(card => typeof card.animate === 'function');
    initialised = true;
    cancelAnimations();
    term = value;
    page.dataset.activeTerm = term;
    const annual = term === '12';
    buttons.forEach(button => {
      const active = button.dataset.billingTerm === term;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateSelection();
    if (shouldAnimate) {
      animations = paidCards.map(card => card.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0.45, transform: 'translateY(-6px)' }
      ], { duration: 180, easing: 'ease-in', fill: 'forwards' }));
      await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
      if (currentTransition !== transitionId) return;
      cancelAnimations();
    }
    cards.forEach(card => {
      if (card.dataset.plan === 'lite') return;
      card.querySelector('[data-plan-price]').textContent = format(annual ? card.dataset.annualPrice : card.dataset.intro);
      card.querySelector('[data-plan-unit]').textContent = '/ month equivalent';
      card.querySelector('[data-plan-billing]').textContent = `${format(annual ? card.dataset.annualTotal : card.dataset.total)} billed for ${annual ? 'twelve' : 'six'} months`;
      card.querySelector('[data-plan-standard]').textContent = annual
        ? `Published subsequent annual rate: ${format(card.dataset.annualStandard)}/month. Confirm your renewal quote.`
        : `Published subsequent six month rate: ${format(card.dataset.standard)}/month.`;
    });
    note.textContent = annual ? page.dataset.annualNote : sixMonthNote;
    if (shouldAnimate && !reducedMotion.matches) {
      animations = paidCards.map((card, index) => card.animate([
        { opacity: 0.45, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 380, delay: index * 50, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }));
      await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
      if (currentTransition === transitionId) cancelAnimations();
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => chooseTerm(button.dataset.billingTerm)));
  page.querySelectorAll('[data-select-plan]').forEach(link => link.addEventListener('click', () => {
    plan = link.dataset.selectPlan;
    updateSelection();
  }));
  page.querySelectorAll('a[href="#plan-comparison"]').forEach(link => link.addEventListener('click', () => {
    page.querySelector('#plan-comparison').open = true;
  }));
  chooseTerm('6');
})();
