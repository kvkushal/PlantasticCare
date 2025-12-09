/**
 * PlantasticCare - Enhanced Features
 * Mobile Menu, Scroll-to-Top, and Search
 */

(function () {
  'use strict';

  // ===========================================
  // MOBILE HAMBURGER MENU
  // ===========================================

  function initMobileMenu() {
    const header = document.querySelector('header');
    const nav = document.querySelector('header nav');

    if (!header || !nav) return;

    // Check if hamburger already exists
    if (header.querySelector('.hamburger-btn')) return;

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;

    // Create mobile menu overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.id = 'mobile-overlay';

    // Insert hamburger after logo
    const logoContainer = header.querySelector('.logo-container');
    if (logoContainer) {
      logoContainer.after(hamburger);
    } else {
      header.insertBefore(hamburger, nav);
    }
    document.body.appendChild(overlay);

    // Close menu function
    function closeMenu() {
      hamburger.classList.remove('active');
      nav.classList.remove('mobile-open');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }

    // Open menu function
    function openMenu() {
      hamburger.classList.add('active');
      nav.classList.add('mobile-open');
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (nav.classList.contains('mobile-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when overlay clicked
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });

    // Close menu when nav link clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
        closeMenu();
      }
    });
  }

  // ===========================================
  // SCROLL TO TOP BUTTON
  // ===========================================

  function initScrollToTop() {
    // Check if button already exists
    if (document.querySelector('.scroll-to-top')) return;

    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    scrollBtn.title = 'Back to top';
    document.body.appendChild(scrollBtn);

    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    });

    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ===========================================
  // REAL-TIME SEARCH (for plants page)
  // ===========================================

  function initRealTimeSearch() {
    const searchBar = document.querySelector('.search-bar');
    const plantGrid = document.querySelector('.plant-grid');

    if (!searchBar || !plantGrid) return;

    let debounceTimer;

    searchBar.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        const plantItems = plantGrid.querySelectorAll('.plant-item');

        plantItems.forEach(item => {
          const plantName = item.querySelector('p')?.textContent?.toLowerCase() || '';
          if (query === '' || plantName.includes(query)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });

        // Show "No results" message
        const visibleItems = plantGrid.querySelectorAll('.plant-item:not([style*="display: none"])');
        let noResultsMsg = plantGrid.querySelector('.no-search-results');

        if (visibleItems.length === 0 && query !== '') {
          if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-search-results';
            noResultsMsg.innerHTML = `
              <p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
                No plants found matching "<strong>${query}</strong>"
              </p>
            `;
            plantGrid.appendChild(noResultsMsg);
          }
        } else if (noResultsMsg) {
          noResultsMsg.remove();
        }
      }, 200);
    });
  }

  // ===========================================
  // INJECT STYLES
  // ===========================================

  function injectStyles() {
    // Check if styles already injected
    if (document.getElementById('plantastic-enhancements-css')) return;

    const styles = document.createElement('style');
    styles.id = 'plantastic-enhancements-css';
    styles.textContent = `
      /* ========== HAMBURGER MENU ========== */
      .hamburger-btn {
        display: none;
        flex-direction: column;
        justify-content: space-around;
        width: 30px;
        height: 25px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        z-index: 1001;
        position: relative;
      }

      .hamburger-line {
        display: block;
        width: 100%;
        height: 3px;
        background-color: #2a472e;
        border-radius: 3px;
        transition: all 0.3s ease;
      }

      .hamburger-btn.active .hamburger-line:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
      }

      .hamburger-btn.active .hamburger-line:nth-child(2) {
        opacity: 0;
      }

      .hamburger-btn.active .hamburger-line:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px);
      }

      .mobile-menu-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        cursor: pointer;
      }

      @media (max-width: 900px) {
        .hamburger-btn {
          display: flex !important;
        }

        header {
          position: relative;
        }

        header nav {
          position: fixed !important;
          top: 0 !important;
          right: -300px !important;
          width: 280px !important;
          height: 100vh !important;
          background: #fff !important;
          flex-direction: column !important;
          padding: 80px 30px 30px !important;
          gap: 15px !important;
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1) !important;
          transition: right 0.3s ease !important;
          z-index: 1000 !important;
          overflow-y: auto !important;
          display: flex !important;
        }

        header nav.mobile-open {
          right: 0 !important;
        }

        header nav h3 {
          text-align: left;
          width: 100%;
          margin: 5px 0;
        }

        header nav .search-container {
          width: 100%;
          margin: 0;
        }

        header nav .search-bar {
          width: 100%;
        }

        header nav .auth-nav {
          flex-direction: column;
          width: 100%;
          gap: 10px;
          align-items: flex-start;
        }
      }

      /* ========== SCROLL TO TOP ========== */
      .scroll-to-top {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #2a472e, #4a7a39);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 998;
        box-shadow: 0 4px 15px rgba(42, 71, 46, 0.4);
      }

      .scroll-to-top.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .scroll-to-top:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(42, 71, 46, 0.5);
      }
    `;
    document.head.appendChild(styles);
  }

  // ===========================================
  // UPDATE FOOTER YEAR
  // ===========================================

  function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  }

  // ===========================================
  // INITIALIZE ALL FEATURES
  // ===========================================

  function init() {
    injectStyles();
    initMobileMenu();
    initScrollToTop();
    initRealTimeSearch();
    updateFooterYear();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
