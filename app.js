const statNames = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];

let allPokemon = [];
let selectedBase = null;
let selectedAttr = null;

async function init() {
  try {
    const res = await fetch('pokemonData.json');
    allPokemon = await res.json();
    
    allPokemon.sort((a, b) => a.name.localeCompare(b.name));

    // Default selections
    selectedBase = allPokemon.find(p => p.name.toLowerCase() === 'bulbasaur') || allPokemon[0];
    selectedAttr = allPokemon.find(p => p.name.toLowerCase() === 'charmander') || allPokemon[1];

    document.getElementById('base-input').value = selectedBase.name;
    document.getElementById('attr-input').value = selectedAttr.name;

    setupSelectComponent('base-input', 'base-dropdown', (pkmn) => {
      selectedBase = pkmn;
      update();
    });

    setupSelectComponent('attr-input', 'attr-dropdown', (pkmn) => {
      selectedAttr = pkmn;
      update();
    });

    update();
  } catch (err) {
    console.error("Failed loading pokemonData.json", err);
  }
}

function setupSelectComponent(inputId, dropdownId, onSelectCallback) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  let highlightedIndex = 0;
  let lastFiltered = [];

  function updateHighlight() {
    const items = dropdown.querySelectorAll('.dropdown-option');
    items.forEach((item, index) => {
      if (index === highlightedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  function renderOptions(filterText = '') {
    dropdown.innerHTML = '';
    const query = filterText.toLowerCase().trim();
    
    lastFiltered = allPokemon.filter(p => 
      p.name.toLowerCase().includes(query) || p.id.toString() === query
    );

    if (lastFiltered.length === 0) {
      dropdown.innerHTML = `<div class="dropdown-option" style="color: #888;">No Pokémon found</div>`;
      return [];
    }

    lastFiltered.forEach((p, index) => {
      const item = document.createElement('div');
      item.className = 'dropdown-option' + (index === highlightedIndex ? ' highlighted' : '');
      item.textContent = `#${p.id} ${p.name}`;
      
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        selectItem(p);
      });

      dropdown.appendChild(item);
    });

    return lastFiltered;
  }

  function selectItem(pkmn) {
    if (!pkmn) return;
    input.value = pkmn.name;
    dropdown.classList.remove('show');
    onSelectCallback(pkmn);
  }

  input.addEventListener('click', (e) => {
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    } else {
      input.select();
      highlightedIndex = 0;
      renderOptions(input.value);
      dropdown.classList.add('show');
    }
  });

  input.addEventListener('input', () => {
    highlightedIndex = 0;
    renderOptions(input.value);
    dropdown.classList.add('show');
  });

  input.addEventListener('keydown', (e) => {
    if (!dropdown.classList.contains('show')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        dropdown.classList.add('show');
        renderOptions(input.value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (lastFiltered.length > 0) {
        highlightedIndex = (highlightedIndex + 1) % lastFiltered.length;
        updateHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (lastFiltered.length > 0) {
        highlightedIndex = (highlightedIndex - 1 + lastFiltered.length) % lastFiltered.length;
        updateHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (lastFiltered.length > 0 && lastFiltered[highlightedIndex]) {
        selectItem(lastFiltered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('show');
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.classList.remove('show');
    }, 150);
  });
}

function getTypeCombinations(baseTypes, attrTypes) {
  const combos = [];
  
  baseTypes.forEach(bType => {
    attrTypes.forEach(aType => {
      let combo = bType === aType ? [bType] : [bType, aType];
      const comboKey = combo.join('/');
      if (!combos.some(c => c.join('/') === comboKey)) {
        combos.push(combo);
      }
    });
  });

  return combos;
}

function update() {
  if (!selectedBase || !selectedAttr) return;

  const fusionStats = selectedBase.stats.map((stat, i) => 
    i === 0 ? stat : Math.floor((stat * 0.6) + (selectedAttr.stats[i] * 0.4))
  );

  const typeCombos = getTypeCombinations(selectedBase.types, selectedAttr.types);
  const combinedAbilities = [...new Set([...selectedBase.abilities, ...selectedAttr.abilities])];
  const combinedMoves = [...new Set([...selectedBase.moves, ...selectedAttr.moves])].sort();

  renderCard('base-card', selectedBase.name + " (Base)", selectedBase.id, [selectedBase.types], selectedBase.stats);
  renderCard('attr-card', selectedAttr.name + " (Attribution)", selectedAttr.id, [selectedAttr.types], selectedAttr.stats);
  
  const fusionName = `Get Starmied LMAO!`;
  renderCard('fusion-card', fusionName, selectedBase.id, typeCombos, fusionStats, combinedAbilities, combinedMoves);
}

function renderCard(elementId, title, id, typeCombinations, stats, abilities = null, moves = null) {
  const card = document.getElementById(elementId);
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const typeCombosHTML = typeCombinations.map(combo => {
    const badges = combo.map(t => `<span class="badge type-${t.toLowerCase()}">${t}</span>`).join('');
    return `<div class="type-pair">${badges}</div>`;
  }).join('');

  const statsHTML = stats.map((val, i) => {
    const percent = Math.min((val / 180) * 100, 100);
    return `
      <div class="stat-row">
        <span class="stat-name">${statNames[i]}</span>
        <span class="stat-val">${val}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  let extraHTML = '';
  if (abilities && moves) {
    extraHTML = `
      <div class="fusion-extra-info">
        <div class="info-section">
          <h4>Possible Abilities:</h4>
          <div>${abilities.join(', ')}</div>
        </div>
        <div class="info-section">
          <h4>Combined Movepool (${moves.length} moves):</h4>
          <div class="moves-container">${moves.join(', ')}</div>
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="card-header">
      <img src="${spriteUrl}" alt="${title}" onerror="this.src=''">
      <h2>${title}</h2>
      <div class="type-combo-list">${typeCombosHTML}</div>
    </div>
    <div class="stats-container">
      ${statsHTML}
      ${extraHTML}
    </div>
  `;
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select-wrapper')) {
    document.querySelectorAll('.dropdown-list').forEach(el => el.classList.remove('show'));
  }
});

init();