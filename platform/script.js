const visualFixStyle = document.createElement('style');
visualFixStyle.textContent = `
  .hero-content.reveal,
  .hero-card.reveal {
    opacity: 1 !important;
    transform: none !important;
  }

  .hero h1 {
    color: #fff !important;
    text-shadow: 0 4px 18px rgba(0,0,0,.85), 0 0 2px #000;
  }

  .hero h1::first-line { color: #ffd21f; }

  .hero-lead,
  .hero-card,
  .hero-card p { opacity: 1 !important; }

  .section-heading h2 {
    position: relative;
    display: inline-block;
    padding-bottom: 14px;
  }

  .section-heading h2::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 72px;
    height: 6px;
    border-radius: 999px;
    background: #ffd21f;
    transform: translateX(-50%);
    box-shadow: 0 3px 0 #111;
  }

  .section-heading.invert h2 {
    color: #fff !important;
    text-shadow: 0 3px 18px rgba(0,0,0,.75);
  }

  .voices {
    background: #f7f4ec !important;
    color: #141414 !important;
  }

  .voices .section-heading p:not(.eyebrow) {
    color: #555 !important;
  }

  .voice-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 24px !important;
    max-width: 1240px !important;
    margin: 0 auto !important;
  }

  .voice-card {
    overflow: hidden !important;
    padding: 0 !important;
    border-radius: 28px !important;
    background: #fff !important;
    color: #141414 !important;
    border: 2px solid #111 !important;
    box-shadow: 7px 7px 0 #111 !important;
  }

  .voice-photo {
    width: 100% !important;
    aspect-ratio: 16 / 10 !important;
    object-fit: cover !important;
    background: #ddd !important;
  }

  .voice-body {
    padding: 24px !important;
  }

  .voice-tag {
    display: inline-flex !important;
    align-items: center !important;
    border-radius: 999px !important;
    padding: 6px 12px !important;
    margin-bottom: 12px !important;
    color: #fff !important;
    font-size: 12px !important;
    font-weight: 1000 !important;
    letter-spacing: .08em !important;
  }

  .voice-tag.team { background: #0b2a55 !important; }
  .voice-tag.shop { background: #e36b18 !important; }
  .voice-tag.company { background: #276b3a !important; }

  .stars {
    display: block !important;
    color: #d9a928 !important;
    font-size: 18px !important;
    margin-bottom: 10px !important;
  }

  .voice-card p {
    color: #141414 !important;
    font-size: 18px !important;
    font-weight: 900 !important;
    line-height: 1.7 !important;
    margin: 0 0 16px !important;
  }

  .voice-card small {
    display: block !important;
    color: #555 !important;
    font-weight: 800 !important;
  }

  @media (max-width: 900px) {
    .hero {
      display: block !important;
      min-height: auto !important;
      padding: 0 0 52px !important;
      background: #050505 !important;
    }
    .hero::before,
    .hero::after { display: none !important; }
    .hero-bg {
      position: relative !important;
      inset: auto !important;
      opacity: 1 !important;
      filter: none !important;
      background: #000 !important;
    }
    .hero-bg img {
      width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
      animation: none !important;
    }
    .hero-content {
      max-width: none !important;
      padding: 34px 4vw 0 !important;
      background: linear-gradient(180deg, #050505 0%, #111 100%) !important;
    }
    .hero .eyebrow {
      color: #111 !important;
      background: #ffd21f !important;
      font-size: 12px !important;
      box-shadow: 0 3px 0 #111;
    }
    .hero h1 {
      color: #fff !important;
      font-size: clamp(38px, 11vw, 58px) !important;
      line-height: 1.12 !important;
      letter-spacing: -0.05em !important;
      text-shadow: 0 4px 20px rgba(0,0,0,.95), 0 0 2px #000 !important;
      border-left: 8px solid #ffd21f;
      padding-left: 14px;
    }
    .hero h1::first-line { color: #ffd21f !important; }
    .hero-lead {
      color: #fff !important;
      font-size: 16px !important;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 18px;
      padding: 16px;
    }
    .hero-actions { gap: 16px !important; margin-top: 26px !important; }
    .hero-actions .btn { min-height: 64px !important; font-size: 18px !important; }
    .hero-card {
      margin: 26px 4vw 0 !important;
      background: #fffdf6 !important;
      color: #111 !important;
      border: 3px solid #ffd21f !important;
      box-shadow: 7px 7px 0 #ffd21f !important;
    }
    .voice-grid { grid-template-columns: 1fr !important; }
    .voice-card p { font-size: 17px !important; }
    .fixed-line {
      bottom: 14px !important;
      left: 18px !important;
      right: 18px !important;
      text-align: center !important;
      min-height: 58px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 18px !important;
    }
  }
`;
document.head.appendChild(visualFixStyle);

document.querySelectorAll('.hero .reveal').forEach((target) => {
  target.classList.add('active');
});

const revealTargets = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealTargets.forEach((target) => observer.observe(target));

const menuToggle = document.querySelector('[data-menu-toggle]');
const siteNav = document.querySelector('[data-nav]');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.textContent = isOpen ? '×' : '☰';
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    });
  });
}

const header = document.querySelector('[data-header]');
const syncHeader = () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 24);
};
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const workCards = document.querySelectorAll('.work-card img');
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.setAttribute('aria-hidden', 'true');
lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="閉じる">×</button><img alt="制作実績拡大画像">';
document.body.appendChild(lightbox);

const lightboxImage = lightbox.querySelector('img');
const closeButton = lightbox.querySelector('.lightbox-close');

const openLightbox = (image) => {
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

workCards.forEach((image) => {
  image.addEventListener('click', () => openLightbox(image));
});

closeButton.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});

console.log('HADAOJI PRINT LP customer voice photos updated');


const trackLineClick = (link) => {
  const placement = link.dataset.linePlacement
    || (link.classList.contains('fixed-line')
      ? 'fixed_button'
      : link.closest('.site-header')
        ? 'header'
        : link.closest('.hero')
          ? 'hero'
          : link.closest('.area')
            ? 'area'
            : link.closest('.cta')
              ? 'final_cta'
              : 'page_cta');

  if (typeof window.gtag !== 'function') return;

  const eventParams = {
    event_category: 'contact',
    event_label: placement,
    link_placement: placement,
    link_url: link.href,
    link_text: (link.textContent || '').trim().replace(/\s+/g, ' '),
    transport_type: 'beacon'
  };

  window.gtag('event', 'line_click', eventParams);
  window.gtag('event', 'generate_lead', {
    method: 'LINE',
    link_placement: placement,
    transport_type: 'beacon'
  });
};

document.addEventListener('click', (event) => {
  const clicked = event.target.closest('a[href^="https://lin.ee/"]');
  if (!clicked) return;
  trackLineClick(clicked);
}, { capture: true });
