// script.js

const gridSize = 5; // 5x5 grille
const gridElement = document.getElementById('grid');
const targetElement = document.getElementById('target');
const feedbackElement = document.getElementById('feedback');
const resetButton = document.getElementById('reset-button');
const saveButton = document.getElementById('save-button');
const showSolutionsButton = document.getElementById('show-solutions-button'); // Bouton Magique
const scoreboardList = document.getElementById('scoreboard-list');
const calculationElement = document.getElementById('calculation');
const operatorButtons = document.querySelectorAll('.operator-button');
const solutionsSection = document.getElementById('solutions-section');
const solutionsList = document.getElementById('solutions-list');
const modeSelect = document.getElementById('mode'); // Sélecteur de mode

let target = 20; // Cible initiale, sera mise à jour
let numbers = []; // Nombres de la grille
let selectedCells = []; // Cellules sélectionnées
let selectedOperator = null; // Opérateur sélectionné
let currentMode = 'normal'; // Mode par défaut

/**
 * Génère des nombres aléatoires dans la grille avec au moins 6 solutions.
 * @param {number} desiredSolutionsCount - Nombre minimum de solutions souhaitées.
 * @returns {number} - Nombre de solutions assignées.
 */
function generateNumbersWithAtLeastSixSolutions(desiredSolutionsCount = 6) {
    let solutions = [];
    let assignedLines = new Set();
    numbers = Array(gridSize * gridSize).fill(0); // Réinitialiser la grille

    // Trouver tous les triplets possibles pour la cible actuelle
    const allPossibleTriplets = findPossibleTriplets(target);

    // Si moins de 6 triplets sont disponibles, ajuster la cible ou informer l'utilisateur
    if (allPossibleTriplets.length < desiredSolutionsCount) {
        console.warn(`Pour la cible ${target}, seulement ${allPossibleTriplets.length} triplets sont disponibles.`);
        // Vous pouvez choisir de modifier la cible ou d'ajuster le nombre de solutions
        // Ici, nous allons continuer avec le nombre disponible
    }

    // Mélanger les triplets pour une distribution aléatoire
    const shuffledTriplets = shuffleArray([...allPossibleTriplets]);

    // Obtenir toutes les lignes alignées de trois cellules
    const allLines = getAllAlignedLines();
    const shuffledLines = shuffleArray([...allLines]);

    let tripletIndex = 0;
    let lineIndex = 0;

    // Assigner des triplets aux lignes alignées
    while (solutions.length < desiredSolutionsCount && tripletIndex < shuffledTriplets.length && lineIndex < shuffledLines.length) {
        const triplet = shuffledTriplets[tripletIndex];
        const line = shuffledLines[lineIndex];

        // Vérifier si la ligne n'a pas déjà été assignée
        if (!assignedLines.has(line.join(','))) {
            // Vérifier la compatibilité avec les cellules déjà assignées
            let conflict = false;
            for (let j = 0; j < 3; j++) {
                const cellIndex = line[j];
                const existingNumber = numbers[cellIndex];
                const newNumber = (j === 0) ? triplet.a : (j === 1) ? triplet.b : triplet.c;

                if (existingNumber !== 0 && existingNumber !== newNumber) {
                    conflict = true;
                    break;
                }
            }

            if (!conflict) {
                // Assignation des nombres à la ligne
                for (let j = 0; j < 3; j++) {
                    const cellIndex = line[j];
                    const newNumber = (j === 0) ? triplet.a : (j === 1) ? triplet.b : triplet.c;
                    numbers[cellIndex] = newNumber;
                }

                solutions.push({ triplet, line });
                assignedLines.add(line.join(','));
            }
        }

        tripletIndex++;
        lineIndex++;
    }

    // Remplir les cellules restantes avec des nombres aléatoires entre 1 et 10
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] === 0) {
            numbers[i] = getRandomInt(1, 10);
        }
    }

    // Mélanger la grille pour répartir les nombres
    shuffleArray(numbers);

    return solutions.length;
}

/**
 * Trouve toutes les solutions possibles dans la grille actuelle.
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

        // Vérifier (a × b) + c
        if ((a * b) + c === target) {
            solutions.push({
                expression: `(${a} × ${b}) + ${c} = ${target}`,
                cells: [i1, i2, i3]
            });
        }

        // Vérifier (a × b) - c
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
 * Génère le plateau de jeu dans le DOM.
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
 * Gère la sélection des cellules par l'utilisateur.
 * @param {Event} event - L'événement de clic sur une cellule.
 */
function selectCell(event) {
    const cell = event.target;
    const index = parseInt(cell.dataset.index, 10);

    if (selectedCells.includes(index)) {
        // Déselectionner la cellule
        selectedCells = selectedCells.filter(i => i !== index);
        cell.classList.remove('selected');
    } else {
        if (selectedCells.length < 3) {
            selectedCells.push(index);
            cell.classList.add('selected');
        }
    }

    updateCalculationDisplay();
    updateOperatorButtonsState();

    if (selectedCells.length === 3) {
        // Activer les boutons opérateurs
        operatorButtons.forEach(button => button.disabled = false);
    } else {
        // Désactiver les boutons opérateurs si moins de 3 cellules
        operatorButtons.forEach(button => button.disabled = true);
    }
}

/**
 * Met à jour l'affichage du calcul en fonction des cellules sélectionnées.
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
        if (idx < selectedNumbers.length - 1) {
            display += ` × `;
        }
    });

    display += ` ? `;
    calculationElement.innerHTML = display;
}

/**
 * Met à jour l'état des boutons opérateurs en fonction des cellules sélectionnées.
 */
function updateOperatorButtonsState() {
    if (selectedCells.length === 3) {
        operatorButtons.forEach(button => button.disabled = false);
    } else {
        operatorButtons.forEach(button => button.disabled = true);
    }
}

/**
 * Gère la sélection de l'opérateur par l'utilisateur.
 * @param {Event} event - L'événement de clic sur un bouton opérateur.
 */
function selectOperator(event) {
    const operator = event.target.dataset.operator;
    selectedOperator = operator;

    performCalculation();
}

/**
 * Effectue le calcul et vérifie si la solution est correcte.
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
        saveScore('Gagné');
    } else {
        feedbackElement.innerHTML = `Incorrect. ${expression} = ${result} ≠ ${target}`;
        feedbackElement.className = 'feedback incorrect';
        saveScore('Perdu');
    }

    // Désactiver les boutons opérateurs après le calcul
    operatorButtons.forEach(button => button.disabled = true);
}

/**
 * Met en évidence les solutions correctes dans la grille.
 * @param {number} a - Premier nombre du triplet.
 * @param {number} b - Deuxième nombre du triplet.
 * @param {number} c - Troisième nombre du triplet.
 * @param {string} operator - Opérateur utilisé ('+' ou '-').
 */
function highlightSolution(a, b, c, operator) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const num = parseInt(cell.textContent, 10);
        if (num === a || num === b) {
            cell.style.color = 'blue'; // Premier et deuxième nombre en bleu
        } else if (num === c) {
            cell.style.color = 'green'; // Troisième nombre en vert
        } else {
            cell.style.color = '#333';
        }
    });
}

/**
 * Réinitialise la sélection des cellules et les couleurs.
 */
function clearSelection() {
    selectedCells = [];
    selectedOperator = null;
    calculationElement.innerHTML = 'a × b ? c';
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected');
        // Réinitialiser la couleur des cellules sauf celles déjà mises en évidence
        if (!cell.classList.contains('highlight-solution')) {
            cell.style.color = '#333';
        }
    });
}

/**
 * Réinitialise le jeu en générant une nouvelle grille avec au moins 6 solutions.
 */
function resetGame() {
    clearSelection();
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';

    let attempts = 0;
    const maxAttempts = 1000; // Limite pour éviter une boucle infinie
    let success = false;

    while (attempts < maxAttempts && !success) {
        attempts++;
        // Générer une cible aléatoire selon le mode
        if (currentMode === 'normal') {
            target = getRandomInt(10, 50);
        } else if (currentMode === 'facile') {
            target = getRandomInt(5, 10);
        }
        targetElement.textContent = `Cible : ${target}`;

        // Générer les nombres avec au moins 6 solutions
        const solutionCount = generateNumbersWithAtLeastSixSolutions(6);
        generateGrid();
        const solutions = findAllSolutions();

        if (solutions.length >= 6) {
            success = true;
            console.log(`Grille générée avec ${solutions.length} solutions en ${attempts} tentatives.`);
        } else {
            // Réinitialiser la grille pour la prochaine tentative
            numbers = [];
            gridElement.innerHTML = '';
        }
    }

    if (!success) {
        console.error('Impossible de générer une grille avec au moins 6 solutions.');
        targetElement.textContent = `Cible : ${target}`;
    }

    // Réinitialiser les couleurs des cellules mises en évidence
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.color = '#333';
        cell.classList.remove('highlighted');
        cell.classList.remove('highlight-solution');
    });

    // Réinitialiser la zone de calcul
    calculationElement.innerHTML = 'a × b ? c';

    // Vider les solutions affichées
    solutionsList.innerHTML = '';
}

/**
 * Enregistre le score de la partie.
 * @param {string} result - Résultat de la partie ('Gagné' ou 'Perdu').
 */
function saveScore(result) {
    const timestamp = new Date().toLocaleTimeString();
    const li = document.createElement('li');
    li.innerHTML = `${timestamp} - ${result}`;
    scoreboardList.prepend(li);
}

/**
 * Génère un nombre aléatoire entre min et max (inclus).
 * @param {number} min - Valeur minimale.
 * @param {number} max - Valeur maximale.
 * @returns {number} - Nombre aléatoire généré.
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mélange un tableau en place en utilisant l'algorithme de Fisher-Yates.
 * @param {Array} array - Tableau à mélanger.
 * @returns {Array} - Tableau mélangé.
 */
function shuffleArray(array) {
    for (let i = array.length -1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Trouve tous les triplets possibles (a, b, c) qui satisfont a × b + c = target ou a × b - c = target.
 * @param {number} target - La cible à atteindre.
 * @returns {Array} - Liste des triplets possibles.
 */
function findPossibleTriplets(target) {
    const triplets = [];
    const maxA = Math.floor(Math.sqrt(target + 50)); // Ajuster selon le besoin
    const maxB = Math.floor(target / 2); // Pour éviter des valeurs trop grandes

    for (let a = 1; a <= maxA; a++) {
        for (let b = 1; b <= maxB; b++) {
            // Pour l'opérateur '+'
            let cPlus = target - (a * b);
            if (cPlus >= 1 && cPlus <= 50) {
                triplets.push({ a, b, c: cPlus, operator: '+' });
            }

            // Pour l'opérateur '-'
            let cMinus = (a * b) - target;
            if (cMinus >= 1 && cMinus <= 50) {
                triplets.push({ a, b, c: cMinus, operator: '-' });
            }
        }
    }

    // Retirer les doublons
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
 * Obtient toutes les lignes alignées de trois cellules dans la grille.
 * @returns {Array} - Liste des lignes alignées.
 */
function getAllAlignedLines() {
    let lines = [];

    // Horizontal (5 lignes, 3 triplets par ligne)
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

    // Vertical (5 colonnes, 3 triplets par colonne)
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

    // Diagonale descendante (\) (3 diagonales principales)
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

    // Diagonale montante (/) (3 diagonales principales)
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
    solutionsList.innerHTML = ''; // Vider les solutions précédentes
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

        // Mettre en évidence les cellules de la solution
        solution.cells.forEach(index => {
            const cell = gridElement.querySelector(`.cell[data-index='${index}']`);
            if (cell) {
                cell.classList.add('highlight-solution');
            }
        });
    });
}

/**
 * Réinitialise les mises en évidence des solutions.
 */
function clearSolutionHighlights() {
    const highlightedCells = gridElement.querySelectorAll('.highlight-solution');
    highlightedCells.forEach(cell => {
        cell.classList.remove('highlight-solution');
    });
}

// Ajouter un écouteur d'événement au bouton magique
showSolutionsButton.addEventListener('click', () => {
    clearSolutionHighlights(); // Réinitialiser les mises en évidence précédentes
    displayAllSolutions();
});

// Ajouter des écouteurs d'événements aux boutons opérateurs
operatorButtons.forEach(button => {
    button.addEventListener('click', selectOperator);
});

// Ajouter un écouteur d'événement au sélecteur de mode
modeSelect.addEventListener('change', (event) => {
    currentMode = event.target.value;
    resetGame();
});

// Événements pour les boutons
resetButton.addEventListener('click', resetGame);
saveButton.addEventListener('click', () => {
    if (feedbackElement.textContent) {
        saveScore(feedbackElement.classList.contains('correct') ? 'Gagné' : 'Perdu');
    }
});

// Initialisation du jeu
resetGame();
