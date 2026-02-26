if (!window.__fendixFormTrackingLoaded) {
    window.__fendixFormTrackingLoaded = true;
    console.log('start_next-gen-fendix-nick_script');

    document.querySelectorAll('form').forEach((form, i) => {
        const formId = form.id || form.getAttribute('data-name') || `form-${i}`;
        const formName = form.getAttribute('data-name') || form.getAttribute('name') || `Form ${i + 1}`;
        let started = false;
        
        // Form start
        form.addEventListener('focusin', () => {
            if (started) return;
                started = true;
                
                dataLayer.push('form_start', {
                form_id: formId,
                form_name: formName,
                page_path: page.path
            });
        }, { once: true });
        
        // Form submit
        form.addEventListener('submit', () => {
            // Check of dit eerste submit is
            const submitted = storage.get('forms_submitted') || [];
            const isFirst = !submitted.includes(formId);
            
            if (isFirst) {
                submitted.push(formId);
                storage.set('forms_submitted', submitted);
            }
            
            dataLayer.push('form_submit', {
                form_id: formId,
                form_name: formName,
                is_first_submit: isFirst,
                page_path: page.path,
                page_type: page.type
            });
        });
    });
        
    // Webflow success message
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            m.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList?.contains('w-form-done')) {
                    dataLayer.push('form_success', {
                        page_path: page.path
                    });
                }
            });
        });
    });
    
    document.querySelectorAll('.w-form').forEach(wrapper => {
        observer.observe(wrapper, { childList: true, subtree: true });
    });
    
    console.log('end_next-gen-fendix-nick_script');
}
