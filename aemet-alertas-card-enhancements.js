(() => {
  const STYLE_ID = 'aemet-alertas-marquee-enhancements';

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .aemet-marquee-viewport {
        position: relative;
        overflow: hidden;
        min-width: 0;
        width: 100%;
        mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
      }
      aemet-alertas-card .aemet-marquee-track {
        display: inline-flex;
        width: max-content;
        white-space: nowrap;
        transform: translateX(0);
        animation: aemetAlertasMarquee 16s ease-in-out infinite alternate;
        animation-delay: 1.8s;
        will-change: transform;
      }
      aemet-alertas-card .aemet-marquee-track::after {
        content: '';
        display: block;
        width: 72px;
        flex: 0 0 72px;
      }
      @keyframes aemetAlertasMarquee {
        0%, 18% { transform: translateX(0); }
        82%, 100% { transform: translateX(calc(-1 * var(--aemet-marquee-distance, 0px))); }
      }
      @media (prefers-reduced-motion: reduce) {
        aemet-alertas-card .aemet-marquee-track { animation: none !important; transform: none !important; }
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
      const distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
      track.style.setProperty('--aemet-marquee-distance', `${distance}px`);
    };

    requestAnimationFrame(update);
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
