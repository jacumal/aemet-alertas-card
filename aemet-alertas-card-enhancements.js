(() => {
  const STYLE_ID = 'aemet-alertas-marquee-enhancements';

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .compact-top .brand-row,
      aemet-alertas-card .detail-header .brand-row,
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
      }

      aemet-alertas-card .title-wrap {
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }

      aemet-alertas-card .aemet-marquee-viewport {
        display: block;
        position: relative;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow: hidden !important;
        white-space: nowrap;
        mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
      }

      aemet-alertas-card .aemet-marquee-track {
        display: inline-block;
        width: max-content;
        max-width: none;
        min-width: max-content;
        white-space: nowrap;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  };

  const animateTitle = (viewport, track) => {
    if (!viewport || !track) return;

    const distance = Math.max(0, Math.ceil(track.getBoundingClientRect().width - viewport.getBoundingClientRect().width));
    if (distance <= 3) return;

    if (viewport._aemetAnimation) {
      viewport._aemetAnimation.cancel();
    }

    const duration = Math.max(9000, Math.min(18000, distance * 45));
    const pause = 1800;

    track.style.transform = 'translate3d(0, 0, 0)';

    const run = () => {
      if (!track.isConnected || !viewport.isConnected) return;

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        track.style.transform = 'translate3d(0, 0, 0)';
        return;
      }

      viewport._aemetAnimation = track.animate(
        [
          { transform: 'translate3d(0, 0, 0)', offset: 0 },
          { transform: 'translate3d(0, 0, 0)', offset: 0.14 },
          { transform: `translate3d(-${distance}px, 0, 0)`, offset: 0.86 },
          { transform: `translate3d(-${distance}px, 0, 0)`, offset: 1 },
        ],
        {
          duration,
          delay: pause,
          easing: 'ease-in-out',
          iterations: 1,
          fill: 'forwards',
        }
      );

      viewport._aemetAnimation.onfinish = () => {
        if (!track.isConnected) return;
        track.style.transform = `translate3d(-${distance}px, 0, 0)`;
        setTimeout(() => {
          if (!track.isConnected) return;
          track.style.transform = 'translate3d(0, 0, 0)';
          run();
        }, 1800);
      };
    };

    run();
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
      requestAnimationFrame(() => animateTitle(viewport, track));
    };

    requestAnimationFrame(update);
    setTimeout(update, 100);
    setTimeout(update, 500);

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
