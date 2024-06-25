document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('pre > code').forEach(function(codeBlock) {
      // Ensure the code block has an ID
      if (!codeBlock.id) {
        codeBlock.id = 'code-block-' + Math.random().toString(36).substr(2, 9);
      }

      // Create a copy button
      var button = document.createElement('button');
      button.className = 'btn-copy';
      button.innerHTML = "<i class='fa fa-clone'></i>";
      button.setAttribute('aria-label', 'Copy to clipboard');
      button.setAttribute('data-tooltip', 'Copy');
      button.setAttribute('data-clipboard-target', '#' + codeBlock.id);

      // Insert button before the code block
      codeBlock.parentNode.insertBefore(button, codeBlock);

      // Ensure the tooltip resets to 'Copy' on hover
      button.addEventListener('mouseover', function() {
          if (!button.classList.contains('active')) {
              button.setAttribute('data-tooltip', 'Copy');
          }
      });
  });

  var clipboard = new ClipboardJS('.btn-copy');

  clipboard.on('success', function(e) {
      e.clearSelection();
      e.trigger.setAttribute('data-tooltip', 'Copied!');
      e.trigger.classList.add('active');
      setTimeout(function() {
          e.trigger.classList.remove('active');
          e.trigger.blur();
      }, 1000);
  });

  clipboard.on('error', function(e) {
      e.clearSelection();
      e.trigger.setAttribute('data-tooltip', 'Failed');
      e.trigger.classList.add('active');
      setTimeout(function() {
          e.trigger.classList.remove('active');
          e.trigger.blur();
      }, 1000);
  });
});
