const API_KEY = "684468640b2444c383b29f46275fd3d9"; // <-- Replace with your valid key
let savedRecipes = [];
let shoppingList = [];
let indianRecipes = []; // will load from JSON

const recipeContainer = document.getElementById("recipes");
const savedDiv = document.getElementById("savedRecipes");
const shoppingDiv = document.getElementById("shoppingList");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

// =====================
// Load Indian Dataset
// =====================
fetch("indian_recipes.json")
  .then(res => res.json())
  .then(data => {
    indianRecipes = data;
    console.log("Indian recipes loaded:", indianRecipes.length);
  })
  .catch(err => console.error("Failed to load Indian recipes:", err));

// =====================
// Map Spoonacular Recipe
// =====================
function mapSpoonRecipe(recipe) {
  return {
    name: recipe.title || "Unknown Recipe",
    image: recipe.image || "",
    ingredients: recipe.extendedIngredients
      ? recipe.extendedIngredients.map(ing => ing.original)
      : [],
    instructions: recipe.instructions
      ? recipe.instructions.replace(/<\/?[^>]+(>|$)/g, "")
      : "No instructions available.",
    nutrition: recipe.nutrition && recipe.nutrition.nutrients
      ? {
          calories: (recipe.nutrition.nutrients.find(n => n.name === "Calories")?.amount || "N/A") + " kcal",
          carbs: (recipe.nutrition.nutrients.find(n => n.name === "Carbohydrates")?.amount || "N/A") + " g",
          protein: (recipe.nutrition.nutrients.find(n => n.name === "Protein")?.amount || "N/A") + " g",
          fat: (recipe.nutrition.nutrients.find(n => n.name === "Fat")?.amount || "N/A") + " g",
        }
      : { calories: "N/A", carbs: "N/A", protein: "N/A", fat: "N/A" },
    url: recipe.sourceUrl || "#",
  };
}

// =====================
// Render Recipes
// =====================
function renderRecipes(recipes) {
  recipeContainer.innerHTML = "";
  recipes.forEach(r => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <img src="${r.image}" alt="${r.name}">
      <h3>${r.name}</h3>
      <p>Calories: ${r.nutrition.calories}, Carbs: ${r.nutrition.carbs}, Protein: ${r.nutrition.protein}, Fat: ${r.nutrition.fat}</p>
      <div class="card-actions">
        <button class="btn details-btn">Details</button>
        <button class="btn save-btn">Save Recipe</button>
        <button class="btn shopping-btn">Add to Shopping List</button>
      </div>
    `;

    // Add button event listeners
    card.querySelector(".details-btn").addEventListener("click", () => showDetails(r));
    card.querySelector(".save-btn").addEventListener("click", () => saveRecipe(r));
    card.querySelector(".shopping-btn").addEventListener("click", () => addToShoppingList(r.ingredients));

    recipeContainer.appendChild(card);
  });
}

// =====================
// Show Recipe Details Modal
// =====================
function showDetails(recipe) {
  modalBody.innerHTML = `
    <h2>${recipe.name}</h2>
    <img src="${recipe.image}" alt="${recipe.name}">
    <h3>Ingredients</h3>
    <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
    <h3>Instructions</h3>
    <p>${recipe.instructions}</p>
    <h3>Nutrition</h3>
    <p>Calories: ${recipe.nutrition.calories}, Carbs: ${recipe.nutrition.carbs}, Protein: ${recipe.nutrition.protein}, Fat: ${recipe.nutrition.fat}</p>
    <a href="${recipe.url}" target="_blank">View Full Recipe</a>
  `;
  modal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

// =====================
// Search Recipes
// =====================
async function searchRecipes() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    recipeContainer.innerHTML = "<p>Please enter ingredients or dish name.</p>";
    return;
  }
  recipeContainer.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=8&apiKey=${API_KEY}`
    );
    const data = await res.json();

    if (data.results?.length) {
      const details = await Promise.all(
        data.results.map(async (r) => {
          const infoRes = await fetch(
            `https://api.spoonacular.com/recipes/${r.id}/information?includeNutrition=true&apiKey=${API_KEY}`
          );
          const info = await infoRes.json();
          return mapSpoonRecipe(info);
        })
      );
      renderRecipes(details);
    } else {
      recipeContainer.innerHTML = "<p>No recipes found.</p>";
    }
  } catch (err) {
    console.error("Search error:", err);
    recipeContainer.innerHTML = "<p>Error loading recipes.</p>";
  }
}

// =====================
// Surprise Me
// =====================
async function surpriseMe() {
  let recipe;
  const useIndian = Math.random() < 0.5 && indianRecipes.length > 0;

  if (useIndian) {
    recipe = indianRecipes[Math.floor(Math.random() * indianRecipes.length)];
  } else {
    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/random?number=1&apiKey=${API_KEY}`
      );
      const data = await res.json();
      recipe = data.recipes?.[0] ? mapSpoonRecipe(data.recipes[0]) : null;
    } catch (err) {
      console.error("Random recipe error:", err);
      recipe = null;
    }
  }

  if (recipe) renderRecipes([recipe]);
  else recipeContainer.innerHTML = "<p>Could not fetch any recipe. Try again later.</p>";
}

// =====================
// Save Recipes
// =====================
function saveRecipe(recipe) {
  if (!savedRecipes.includes(recipe)) savedRecipes.push(recipe);
  renderSavedRecipes();
}

function renderSavedRecipes() {
  savedDiv.innerHTML = savedRecipes.length
    ? savedRecipes.map(r => `<div class="recipe-card"><h4>${r.name}</h4></div>`).join("")
    : "<p>No saved recipes.</p>";
}

// =====================
// Shopping List
// =====================
function addToShoppingList(ingredients) {
  shoppingList.push(...ingredients);
  renderShoppingList();
}

function renderShoppingList() {
  shoppingDiv.innerHTML = shoppingList.length
    ? shoppingList.map(i => `<div class="shop-item">${i}</div>`).join("")
    : "<p>No items added.</p>";
}

// Clear shopping list
document.getElementById("clearListBtn").addEventListener("click", () => {
  shoppingList = [];
  renderShoppingList();
});

// =====================
// Event Listeners
// =====================
document.getElementById("searchBtn").addEventListener("click", searchRecipes);
document.getElementById("surpriseBtn").addEventListener("click", surpriseMe);

// Voice search
document.getElementById("micBtn").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice search not supported");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = (e) => {
    document.getElementById("searchInput").value = e.results[0][0].transcript;
    searchRecipes();
  };
});
