// script.js

const gridSize = 5; // Grille 5x5
const gridElement = document.getElementById('grid');
const targetElement = document.getElementById('target');
const feedbackElement = document.getElementById('feedback');
const resetButton = document.getElementById('reset-button');
const saveButton = document.getElementById('save-button');
const showSolutionsButton = document.getElementById('show-solutions-button'); // Bouton pour afficher les solutions
const scoreboardList = document.getElementById('scoreboard-list');
const calculationElement = document.getElementById('calculation');
const operatorButtons = document.querySelectorAll('.operator-button');
const solutionsSection = document.getElementById('solutions-section');
const solutionsList = document.getElementById('solutions-list');
const modeSelect = document.getElementById('mode'); // Sélecteur de mode

let target = 20; // Cible initiale (sera mise à jour)
let numbers = []; // Nombres de la grille
let selectedCells = []; // Cellules sélectionnées
let selectedOperator = null; // Opérateur sélectionné
let currentMode = 'normal'; // Mode par défaut

// Stocke ici tous les triplets alignés (retournés par getAllAlignedLines())
let allAlignedTriplets = [];

/**
 * Génère des nombres dans la grille avec au moins "desiredSolutionsCount" solutions.
 * @param {number} desiredSolutionsCount - Nombre minimum de solutions souhaitées.
 * @returns {number} - Nombre de solutions assignées.
 */
function generateNumbersWithAtLeastSixSolutions(desiredSolutionsCount = 6) {
  let solutions = [];
  let assignedLines = new Set();
  numbers = Array(gridSize * gridSize).fill(0); // Réinitialiser la grille

  // Trouver tous les triplets possibles pour la cible actuelle
  const allPossibleTriplets = findPossibleTriplets(target);

  if (allPossibleTriplets.length < desiredSolutionsCount) {
    console.warn(`Pour la cible ${target}, seulement ${allPossibleTriplets.length} triplets sont disponibles.`);
  }

  // Mélanger les triplets
  const shuffledTriplets = shuffleArray([...allPossibleTriplets]);

  // Obtenir toutes les lignes alignées
  const allLines = getAllAlignedLines();
  const shuffledLines = shuffleArray([...allLines]);

  let tripletIndex = 0;
  let lineIndex = 0;

  while (
    solutions.length < desiredSolutionsCount &&
    tripletIndex < shuffledTriplets.length &&
    lineIndex < shuffledLines.length
  ) {
    const triplet = shuffledTriplets[tripletIndex];
    const line = shuffledLines[lineIndex];

    if (!assignedLines.has(line.join(','))) {
      let conflict = false;
      for (let j = 0; j < 3; j++) {
        const cellIndex = line[j];
        const existingNumber = numbers[cellIndex];
        const newNumber = j === 0 ? triplet.a : j === 1 ? triplet.b : triplet.c;

        if (existingNumber !== 0 && existingNumber !== newNumber) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        for (let j = 0; j < 3; j++) {
          const cellIndex = line[j];
          const newNumber = j === 0 ? triplet.a : j === 1 ? triplet.b : triplet.c;
          numbers[cellIndex] = newNumber;
        }
        solutions.push({ triplet, line });
        assignedLines.add(line.join(','));
      }
    }
    tripletIndex++;
    lineIndex++;
  }

  // Remplir les cellules restantes
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === 0) {
      numbers[i] = getRandomInt(1, 10);
    }
  }

  shuffleArray(numbers);
  return solutions.length;
}

/**
 * Recherche toutes les solutions possibles dans la grille.
 * @returns {Array} - Liste des solutions trouvées.
 */
function findAllSolutions() {
  let solutions = [];
  const lines = getAllAlignedLines();

  lines.forEach(line => {
    const [i1, i2, i3] = line;
    const a = numbers[i1];
    const b = numbers[i2];
    const c = numbers[i3];

    if ((a * b) + c === target) {
      solutions.push({
        expression: `(${a} × ${b}) + ${c} = ${target}`,
        cells: [i1, i2, i3]
      });
    }
    if ((a * b) - c === target) {
      solutions.push({
        expression: `(${a} × ${b}) - ${c} = ${target}`,
        cells: [i1, i2, i3]
      });
    }
  });

  return solutions;
}

/**
 * Génère la grille dans le DOM.
 */
function generateGrid() {
  gridElement.innerHTML = '';
  numbers.forEach((num, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.textContent = num;
    cell.dataset.index = index;
    cell.addEventListener('click', selectCell);
    gridElement.appendChild(cell);
  });
}

/**
 * Vérifie que la nouvelle sélection reste alignée.
 */
function canSelectCell(newIndex) {
  const tentative = [...selectedCells, newIndex];
  tentative.sort((a, b) => a - b);

  if (selectedCells.length === 0) return true;

  return allAlignedTriplets.some(line => {
    const sortedLine = [...line].sort((a, b) => a - b);
    if (tentative.length === 1) return true;
    else if (tentative.length === 2) return tentative.every(idx => sortedLine.includes(idx));
    else if (tentative.length === 3) return JSON.stringify(sortedLine) === JSON.stringify(tentative);
    return false;
  });
}

/**
 * Gère la sélection d'une cellule.
 */
function selectCell(event) {
  const cell = event.target;
  const index = parseInt(cell.dataset.index, 10);

  if (selectedCells.includes(index)) {
    selectedCells = selectedCells.filter(i => i !== index);
    cell.classList.remove('selected');
    updateCalculationDisplay();
    updateOperatorButtonsState();
    return;
  }

  if (canSelectCell(index)) {
    if (selectedCells.length < 3) {
      selectedCells.push(index);
      cell.classList.add('selected');
    }
  } else {
    return;
  }

  updateCalculationDisplay();
  updateOperatorButtonsState();

  if (selectedCells.length === 3) {
    operatorButtons.forEach(button => button.disabled = false);
  } else {
    operatorButtons.forEach(button => button.disabled = true);
  }
}

/**
 * Met à jour l'affichage du calcul.
 */
function updateCalculationDisplay() {
  if (selectedCells.length === 0) {
    calculationElement.innerHTML = 'a × b ? c';
    return;
  }

  const selectedNumbers = selectedCells.map(index => numbers[index]);
  let display = '';

  selectedNumbers.forEach((num, idx) => {
    display += `<span class="selected-number">${num}</span>`;
    if (idx < selectedNumbers.length - 1) display += ` × `;
  });

  display += ` ? `;
  calculationElement.innerHTML = display;
}

/**
 * Active ou désactive les boutons opérateurs.
 */
function updateOperatorButtonsState() {
  if (selectedCells.length === 3) {
    operatorButtons.forEach(button => button.disabled = false);
  } else {
    operatorButtons.forEach(button => button.disabled = true);
  }
}

/**
 * Gère la sélection de l'opérateur.
 */
function selectOperator(event) {
  const operator = event.target.dataset.operator;
  selectedOperator = operator;
  performCalculation();
}

/**
 * Effectue le calcul et vérifie la solution.
 */
function performCalculation() {
  if (selectedCells.length !== 3 || !selectedOperator) return;

  const [i1, i2, i3] = selectedCells;
  const a = numbers[i1];
  const b = numbers[i2];
  const c = numbers[i3];

  let result;
  let expression = `(${a} × ${b}) ${selectedOperator} ${c}`;

  if (selectedOperator === '+') {
    result = (a * b) + c;
  } else if (selectedOperator === '-') {
    result = (a * b) - c;
  }

  if (result === target) {
    feedbackElement.innerHTML = `Correct ! ${expression} = ${target}`;
    feedbackElement.className = 'feedback correct';
    highlightSolution(a, b, c, selectedOperator);
    saveScore(`${expression} = ${target} (Gagné)`);
  } else {
    feedbackElement.innerHTML = `Incorrect. ${expression} = ${result} ≠ ${target}`;
    feedbackElement.className = 'feedback incorrect';
    saveScore(`${expression} = ${result} (Perdu)`);
  }

  operatorButtons.forEach(button => button.disabled = true);
  clearSelection();
}

/**
 * Met en évidence la solution dans la grille.
 */
function highlightSolution(a, b, c, operator) {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const num = parseInt(cell.textContent, 10);
    if (num === a || num === b) {
      cell.style.color = 'blue';
    } else if (num === c) {
      cell.style.color = 'green';
    } else {
      cell.style.color = '#333';
    }
  });
}

/**
 * Réinitialise la sélection.
 */
function clearSelection() {
  selectedCells = [];
  selectedOperator = null;
  calculationElement.innerHTML = 'a × b ? c';
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('selected');
    if (!cell.classList.contains('highlight-solution')) {
      cell.style.color = '#333';
    }
  });
}

/**
 * Réinitialise le jeu en générant une nouvelle grille.
 * En mode difficile, le nombre minimum de solutions est abaissé pour faciliter la génération.
 */
function resetGame() {
  clearSelection();
  feedbackElement.textContent = '';
  feedbackElement.className = 'feedback';

  let attempts = 0;
  const maxAttempts = 1000;
  let success = false;

  // Définir le nombre minimum de solutions selon le mode.
  let minSolutions = 6;
  if (currentMode === 'difficile') {
    minSolutions = 3;
  }

  while (attempts < maxAttempts && !success) {
    attempts++;
    if (currentMode === 'normal') {
      target = getRandomInt(10, 50);
    } else if (currentMode === 'facile') {
      target = getRandomInt(5, 10);
    } else if (currentMode === 'difficile') {
      target = getRandomInt(50, 100);
    }
    targetElement.textContent = `Cible : ${target}`;
    console.log(`Tentative ${attempts}: Cible ${target}`);

    const solutionCount = generateNumbersWithAtLeastSixSolutions(minSolutions);
    generateGrid();
    allAlignedTriplets = getAllAlignedLines();

    const solutions = findAllSolutions();
    console.log(`Solutions trouvées: ${solutions.length}`);

    if (solutions.length >= minSolutions) {
      success = true;
      console.log(`Grille générée avec ${solutions.length} solutions en ${attempts} tentatives.`);
    } else {
      numbers = [];
      gridElement.innerHTML = '';
    }
  }

  if (!success) {
    console.error('Impossible de générer une grille avec au moins ' + minSolutions + ' solutions.');
    targetElement.textContent = `Cible : ${target}`;
  }

  // Réinitialiser les styles des cellules
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.style.color = '#333';
    cell.classList.remove('highlighted');
    cell.classList.remove('highlight-solution');
  });

  calculationElement.innerHTML = 'a × b ? c';
  solutionsList.innerHTML = '';
}

/**
 * Enregistre dans le scoreboard l'opération effectuée.
 * Ici, on affiche l'opération (avec le résultat et le statut) plutôt que l'heure.
 */
function saveScore(operation) {
  const li = document.createElement('li');
  li.innerHTML = operation;
  scoreboardList.prepend(li);
}

/**
 * Génère un nombre entier aléatoire entre min et max (inclus).
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mélange un tableau en utilisant l'algorithme de Fisher-Yates.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Trouve tous les triplets (a, b, c) vérifiant (a × b) + c = target ou (a × b) - c = target.
 */
function findPossibleTriplets(target) {
  const triplets = [];
  const maxA = Math.floor(Math.sqrt(target + 50));
  const maxB = Math.floor(target / 2);

  for (let a = 1; a <= maxA; a++) {
    for (let b = 1; b <= maxB; b++) {
      let cPlus = target - (a * b);
      if (cPlus >= 1 && cPlus <= 50) {
        triplets.push({ a, b, c: cPlus, operator: '+' });
      }
      let cMinus = (a * b) - target;
      if (cMinus >= 1 && cMinus <= 50) {
        triplets.push({ a, b, c: cMinus, operator: '-' });
      }
    }
  }

  // Éliminer les doublons
  const uniqueTriplets = [];
  const seen = new Set();
  triplets.forEach(triplet => {
    const key = `${triplet.a},${triplet.b},${triplet.c},${triplet.operator}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTriplets.push(triplet);
    }
  });

  return uniqueTriplets;
}

/**
 * Retourne toutes les lignes alignées de 3 cellules dans la grille.
 */
function getAllAlignedLines() {
  let lines = [];

  // Lignes horizontales
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x <= gridSize - 3; x++) {
      const line = [
        y * gridSize + x,
        y * gridSize + (x + 1),
        y * gridSize + (x + 2)
      ];
      lines.push(line);
    }
  }

  // Colonnes verticales
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y <= gridSize - 3; y++) {
      const line = [
        y * gridSize + x,
        (y + 1) * gridSize + x,
        (y + 2) * gridSize + x
      ];
      lines.push(line);
    }
  }

  // Diagonale descendante (\)
  for (let y = 0; y <= gridSize - 3; y++) {
    for (let x = 0; x <= gridSize - 3; x++) {
      const line = [
        y * gridSize + x,
        (y + 1) * gridSize + (x + 1),
        (y + 2) * gridSize + (x + 2)
      ];
      lines.push(line);
    }
  }

  // Diagonale montante (/)
  for (let y = 2; y < gridSize; y++) {
    for (let x = 0; x <= gridSize - 3; x++) {
      const line = [
        y * gridSize + x,
        (y - 1) * gridSize + (x + 1),
        (y - 2) * gridSize + (x + 2)
      ];
      lines.push(line);
    }
  }

  return lines;
}

/**
 * Affiche toutes les solutions possibles dans la section dédiée.
 */
function displayAllSolutions() {
  solutionsList.innerHTML = '';
  const solutions = findAllSolutions();

  if (solutions.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Aucune solution trouvée.';
    solutionsList.appendChild(li);
    return;
  }

  solutions.forEach(solution => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="solution-expression">${solution.expression}</span>`;
    solutionsList.appendChild(li);

    // Met en évidence les cellules de la solution
    solution.cells.forEach(index => {
      const cell = gridElement.querySelector(`.cell[data-index='${index}']`);
      if (cell) {
        cell.classList.add('highlight-solution');
      }
    });
  });
}

/**
 * Efface les mises en évidence des solutions.
 */
function clearSolutionHighlights() {
  const highlightedCells = gridElement.querySelectorAll('.highlight-solution');
  highlightedCells.forEach(cell => {
    cell.classList.remove('highlight-solution');
  });
}

// Écouteurs d'événements
showSolutionsButton.addEventListener('click', () => {
  clearSolutionHighlights();
  displayAllSolutions();
});

operatorButtons.forEach(button => {
  button.addEventListener('click', selectOperator);
});

modeSelect.addEventListener('change', (event) => {
  currentMode = event.target.value;
  resetGame();
});

resetButton.addEventListener('click', resetGame);
saveButton.addEventListener('click', () => {
  if (feedbackElement.textContent) {
    // Si le bouton "Enregistrer Partie" est cliqué, on réenregistre la dernière opération
    // (la fonction saveScore est normalement appelée dès le calcul)
    saveScore(feedbackElement.textContent);
  }
});

// Initialisation du jeu
resetGame();
