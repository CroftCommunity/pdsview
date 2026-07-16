// Phase 0 placeholder shell. The lookup form is intentionally non-functional:
// resolution and routing arrive with the identity core in phase 1.

const form = document.querySelector<HTMLFormElement>('form.lookup');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
});
