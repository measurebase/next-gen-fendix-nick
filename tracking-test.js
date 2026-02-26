(function () {
  // Prevent double-loading
  if (window.__fendixFormTrackingLoaded) return;
  window.__fendixFormTrackingLoaded = true;

  function initFendixFormTracking() {
    console.log('start_next-gen-fendix-nick_script');

    window.dataLayer = window.dataLayer || [];

    var pagePath = (window.page && window.page.path) ? window.page.path : window.location.pathname;
    var pageType = (window.page && window.page.type) ? window.page.type : undefined;

    function pushEvent(eventName, params) {
      try {
        window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
      } catch (e) {
        // swallow
      }
    }

    var storageKey = '__fendix_forms_submitted';
    function getSubmitted() {
      try {
        var raw = window.localStorage.getItem(storageKey);
        var parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    function setSubmitted(arr) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(arr));
      } catch (e) {
        // swallow
      }
    }

    // Attach to all forms that exist after DOM is ready
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form, i) {
      var formId = form.id || form.getAttribute('data-name') || form.getAttribute('name') || ('form-' + i);
      var formName = form.getAttribute('data-name') || form.getAttribute('name') || ('Form ' + (i + 1));
      var started = false;

      form.addEventListener('focusin', function () {
        if (started) return;
        started = true;

        pushEvent('webflow_form_start', {
          form_id: formId,
          form_name: formName,
          page_path: pagePath
        });
      }, { once: true });

      form.addEventListener('submit', function () {
        var submitted = getSubmitted();
        var isFirst = submitted.indexOf(formId) === -1;

        if (isFirst) {
          submitted.push(formId);
          setSubmitted(submitted);
        }

        pushEvent('webflow_form_submit', {
          form_id: formId,
          form_name: formName,
          is_first_submit: isFirst,
          page_path: pagePath,
          page_type: pageType
        });
      });
    });

    // Track Webflow success messages (.w-form-done)
    if (!window.__fendixFormSuccessObserver) {
      window.__fendixFormSuccessObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
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

      // Observe the whole body so we don't miss dynamically added forms/success messages
      if (document.body) {
        window.__fendixFormSuccessObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    console.log('end_next-gen-fendix-nick_script');
  }

  // Ensure DOM is ready before running
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFendixFormTracking);
  } else {
    initFendixFormTracking();
  }
})();
