(function () {
  // --- run-once guard (prevents double execution across GTM/Webflow duplicates) ---
  if (window.__fendixFormTrackingLoaded) {
    return;
  }
  window.__fendixFormTrackingLoaded = true;

  console.log('start_next-gen-fendix-nick_script');

  // --- dataLayer safety ---
  window.dataLayer = window.dataLayer || [];

  // --- safe page helpers (in case `page` doesn't exist) ---
  const pagePath = (window.page && window.page.path) ? window.page.path : window.location.pathname;
  const pageType = (window.page && window.page.type) ? window.page.type : undefined;

  // --- simple localStorage wrapper (replaces your `storage.get/set` safely) ---
  const storageKey = '__fendix_forms_submitted';
  const getSubmitted = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };
  const setSubmitted = (arr) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(arr));
    } catch (e) {
      // ignore storage failures (privacy mode etc.)
    }
  };

  // --- push helper ---
  const pushEvent = (eventName, params) => {
    try {
      window.dataLayer.push({
        event: eventName,
        ...params
      });
    } catch (e) {
      // avoid breaking the page if dataLayer is blocked
      console.warn('dataLayer push failed', e);
    }
  };

  // --- Form listeners ---
  document.querySelectorAll('form').forEach((form, i) => {
    const formId =
      form.id ||
      form.getAttribute('data-name') ||
      form.getAttribute('name') ||
      `form-${i}`;

    const formName =
      form.getAttribute('data-name') ||
      form.getAttribute('name') ||
      `Form ${i + 1}`;

    let started = false;

    // Form start (first interaction)
    form.addEventListener(
      'focusin',
      () => {
        if (started) return;
        started = true;

        pushEvent('form_start', {
          form_id: formId,
          form_name: formName,
          page_path: pagePath
        });
      },
      { once: true }
    );

    // Form submit
    form.addEventListener('submit', () => {
      const submitted = getSubmitted();
      const isFirst = !submitted.includes(formId);

      if (isFirst) {
        submitted.push(formId);
        setSubmitted(submitted);
      }

      pushEvent('form_submit', {
        form_id: formId,
        form_name: formName,
        is_first_submit: isFirst,
        page_path: pagePath,
        page_type: pageType
      });
    });
  });

  // --- Webflow success message observer ---
  // Use a uniquely named global reference so redeclarations never happen.
  // If some other script uses `const observer = ...` at top-level, it won’t affect this.
  window.__fendixFormSuccessObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (
          node &&
          node.nodeType === 1 &&
          node.classList &&
          node.classList.contains('w-form-done')
        ) {
          pushEvent('form_success', {
            page_path: pagePath
          });
        }
      });
    });
  });

  document.querySelectorAll('.w-form').forEach((wrapper) => {
    window.__fendixFormSuccessObserver.observe(wrapper, {
      childList: true,
      subtree: true
    });
  });

  console.log('end_next-gen-fendix-nick_script');
})();
