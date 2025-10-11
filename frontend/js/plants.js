document.addEventListener('DOMContentLoaded', () => {
  const filterButton = document.getElementById('filter-button');
  const plantGrid = document.querySelector('.plant-grid');
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = 'Loading plants...';

  // Search functionality
  document.querySelector('.search-bar').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const plantItems = document.querySelectorAll('.plant-item');

    plantItems.forEach(item => {
      const plantName = item.querySelector('p')?.textContent.toLowerCase() || '';
      if (plantName.includes(query)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  });

  filterButton.addEventListener('click', async (event) => {
    event.preventDefault();

    // Collect filter values
    const maintenance = document.getElementById('maintenance').value.trim();
    const sunlight = document.getElementById('sunlight').value.trim();
    const climate = document.getElementById('climate').value.trim();
    const soilType = document.getElementById('soil-type').value.trim();
    const toxicity = document.getElementById('toxicity').value.trim();
    const wateringFrequency = document.getElementById('watering-frequency').value.trim();

    // Clear existing plants and show loading message
    plantGrid.innerHTML = '';
    plantGrid.appendChild(loadingMessage);

    // Build the query string from filters
    const filters = { maintenance, sunlight, climate, soilType, toxicity, wateringFrequency };
    Object.keys(filters).forEach((key) => filters[key] === '' && delete filters[key]);

    filterButton.disabled = true;

    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:5000/plants?${queryString}`);

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const plants = await response.json();

      plantGrid.innerHTML = plants.length > 0
        ? plants.map(plant => {
          const plantLink = plant.link || '#';
          const plantImage = plant.image || 'default-image.jpg';
          return `
            <div class="plant-item">
              <a href="${plantLink}" target="_blank">
                <img src="${plantImage}" alt="${plant.name}">
                <p>${plant.name}</p>
              </a>
            </div>
          `;
        }).join('')
        : '<p>No plants match your filters.</p>';
    } catch (error) {
      console.error('Error fetching plant data:', error);
      plantGrid.innerHTML = '<p>Sorry, the service is currently unavailable. Please try again later.</p>';
    } finally {
      filterButton.disabled = false;
    }
  });
});
