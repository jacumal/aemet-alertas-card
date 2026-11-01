(() => {
  const STYLE_ID = 'aemet-alertas-marquee-enhancements';

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Keep the title column shrinkable inside the flex header. */
      aemet-alertas-card .compact-top .brand-row,
      aemet-alertas-card .detail-header .brand-row,
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
      }

      aemet-alertas-card .title-wrap {
        flex: 1 1 auto !important;
        overflow: hidden;
      }

      aemet-alertas-card .aemet-marquee-viewport {
        position: relative;
        display: block;
        overflow: hidden;
        min-width: 0;
        max-width: 100%;
        width: 100%;
        white-space: nowrap;
        mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
      }

      aemet-alertas-card .aemet-marquee-track {
        display: inline-flex;
        width: max-content;
        min-width: max-content;
        white-space: nowrap;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }

      aemet-alertas-card .aemet-marquee-track.is-overflowing {
        animation: aemetAlertasMarquee 12s ease-in-out 1.5s infinite alternate;
      }

      aemet-alertas-card .aemet-marquee-track::after {
        content: '';
        display: block;
        width: 72px;
        flex: 0 0 72px;
      }

      @keyframes aemetAlertasMarquee {
        0%, 15% { transform: translate3d(0, 0, 0); }
        85%, 100% { transform: translate3d(calc(-1 * var(--aemet-marquee-distance, 0px)), 0, 0); }
      }

      @media (prefers-reduced-motion: reduce) {
        aemet-alertas-card .aemet-marquee-track.is-overflowing {
          animation: none !important;
          transform: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const enhanceTitle = (title) => {
    if (!title || title.dataset.aemetMarqueeReady === 'true') return;
    const text = title.textContent?.trim();
    if (!text) return;

    title.dataset.aemetMarqueeReady = 'true';

    const viewport = document.createElement('div');
    viewport.className = 'aemet-marquee-viewport';

    const track = document.createElement('div');
    track.className = 'aemet-marquee-track';
    track.textContent = text;

    viewport.appendChild(track);
    title.replaceWith(viewport);

    const update = () => {
      const distance = Math.max(0, Math.ceil(track.scrollWidth - viewport.clientWidth));
      track.style.setProperty('--aemet-marquee-distance', `${distance}px`);
      track.classList.toggle('is-overflowing', distance > 2);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(update);
    });
    setTimeout(update, 150);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update);
      ro.observe(viewport);
      ro.observe(track);
    }
  };

  const enhanceCard = (card) => {
    installStyles();
    card.querySelectorAll('.title').forEach(enhanceTitle);
  };

  const boot = () => {
    installStyles();
    document.querySelectorAll('aemet-alertas-card').forEach(enhanceCard);

    const observer = new MutationObserver(() => {
      document.querySelectorAll('aemet-alertas-card').forEach(enhanceCard);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  customElements.whenDefined('aemet-alertas-card').then(boot);
})();
