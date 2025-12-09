/**
 * PlantasticCare - Plants Page JavaScript
 * Plant filtering and search with improved UX
 */

document.addEventListener('DOMContentLoaded', () => {
  const filterButton = document.getElementById('filter-button');
  const plantGrid = document.querySelector('.plant-grid');
  const searchBar = document.querySelector('.search-bar');

  // Store original plants for search functionality
  let allPlants = [];
  let filteredPlants = [];

  // Load initial plants on page load
  loadInitialPlants();

  // Search functionality with debounce
  let searchTimeout;
  if (searchBar) {
    searchBar.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = this.value.toLowerCase().trim();
        searchPlants(query);
      }, 300);
    });
  }

  // Filter button click handler
  if (filterButton) {
    filterButton.addEventListener('click', async (event) => {
      event.preventDefault();
      await applyFilters();
    });
  }

  /**
   * Load initial plants from the server
   */
  async function loadInitialPlants() {
    showLoadingState();

    try {
      const plants = await API_CONFIG.request('/plants', { auth: false });
      allPlants = plants;
      filteredPlants = plants;
      renderPlants(plants);
    } catch (error) {
      console.error('Error loading plants:', error);
      showErrorState('Failed to load plants. Please refresh the page.');
    }
  }

  /**
   * Apply filters and fetch filtered plants
   */
  async function applyFilters() {
    // Collect filter values
    const filters = {
      maintenance: document.getElementById('maintenance')?.value.trim() || '',
      sunlight: document.getElementById('sunlight')?.value.trim() || '',
      climate: document.getElementById('climate')?.value.trim() || '',
      soilType: document.getElementById('soil-type')?.value.trim() || '',
      toxicity: document.getElementById('toxicity')?.value.trim() || '',
      wateringFrequency: document.getElementById('watering-frequency')?.value.trim() || '',
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    showLoadingState();
    filterButton.disabled = true;
    filterButton.textContent = 'Filtering...';

    try {
      const queryString = new URLSearchParams(filters).toString();
      const plants = await API_CONFIG.request(`/plants?${queryString}`, { auth: false });

      filteredPlants = plants;
      renderPlants(plants);

      if (plants.length === 0) {
        Toast.info('No plants match your filters. Try adjusting your criteria.');
      } else {
        Toast.success(`Found ${plants.length} plant${plants.length !== 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Error fetching plant data:', error);
      showErrorState('Failed to filter plants. Please try again.');
      Toast.error('Failed to apply filters.');
    } finally {
      filterButton.disabled = false;
      filterButton.textContent = 'Apply Filters';
    }
  }

  /**
   * Search plants by name (client-side)
   */
  function searchPlants(query) {
    if (!query) {
      renderPlants(filteredPlants);
      return;
    }

    const searchResults = filteredPlants.filter(plant =>
      plant.name.toLowerCase().includes(query)
    );

    renderPlants(searchResults);

    if (searchResults.length === 0 && query.length > 0) {
      plantGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
          <h3 style="color: #2a472e; margin-bottom: 10px;">No plants found</h3>
          <p>No plants match "${sanitize.escapeHtml(query)}". Try a different search term.</p>
        </div>
      `;
    }
  }

  /**
   * Render plants to the grid
   */
  function renderPlants(plants) {
    if (!plants || plants.length === 0) {
      plantGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
          <h3 style="color: #2a472e; margin-bottom: 10px;">No plants found</h3>
          <p>Try adjusting your filters or search criteria.</p>
        </div>
      `;
      return;
    }

    plantGrid.innerHTML = plants.map(plant => {
      const plantLink = plant.link || '#';
      const plantImage = plant.image || 'images/default-plant.png';
      const plantName = sanitize.escapeHtml(plant.name);

      return `
        <div class="plant-item" data-name="${plantName.toLowerCase()}">
          <a href="${plantLink}" target="_blank" rel="noopener noreferrer">
            <img src="${plantImage}" alt="${plantName}" loading="lazy" onerror="this.src='images/default-plant.png'">
            <p>${plantName}</p>
          </a>
          ${API_CONFIG.isLoggedIn() ? `
            <button class="favorite-btn" onclick="toggleFavorite(event, '${plantName}')" title="Add to favorites">
              ❤️
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Show loading state
   */
  function showLoadingState() {
    plantGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #666;">
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2a7a44;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p>Loading plants...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  function showErrorState(message) {
    plantGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #dc3545;">
        <h3 style="margin-bottom: 10px;">Oops! Something went wrong</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 12px 24px;
          background: #2a7a44;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        ">Try Again</button>
      </div>
    `;
  }
});

/**
 * Toggle plant favorite (global function for onclick)
 */
async function toggleFavorite(event, plantName) {
  event.preventDefault();
  event.stopPropagation();

  if (!API_CONFIG.isLoggedIn()) {
    Toast.warning('Please log in to save favorites.');
    return;
  }

  const btn = event.target;
  btn.disabled = true;

  try {
    await API_CONFIG.request('/favorites', {
      method: 'POST',
      body: { plantName }
    });
    Toast.success(`${plantName} added to favorites!`);
    btn.style.opacity = '0.5';
  } catch (error) {
    if (error.message.includes('already')) {
      Toast.info(`${plantName} is already in your favorites.`);
    } else {
      Toast.error('Failed to add to favorites.');
    }
  } finally {
    btn.disabled = false;
  }
}
