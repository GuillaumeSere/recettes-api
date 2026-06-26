import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const apiBaseUrl = "https://www.themealdb.com/api/json/v1/1";

const getIngredients = (recipe) => {
  return Array.from({ length: 20 }, (_, index) => {
    const ingredient = recipe[`strIngredient${index + 1}`]?.trim();
    const measure = recipe[`strMeasure${index + 1}`]?.trim();

    if (!ingredient) {
      return null;
    }

    return {
      ingredient,
      measure
    };
  }).filter(Boolean);
};

const RecipeModal = ({ recipe, onClose }) => {
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    if (!recipe) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [recipe, onClose]);

  useEffect(() => {
    if (!recipe?.idMeal) {
      setRecipeDetails(null);
      return undefined;
    }

    const controller = new AbortController();

    const loadRecipeDetails = async () => {
      setRecipeDetails(recipe);
      setIsDetailsLoading(true);
      setDetailsError("");

      try {
        const response = await fetch(`${apiBaseUrl}/lookup.php?i=${recipe.idMeal}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = await response.json();
        setRecipeDetails(data.meals?.[0] || recipe);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setRecipeDetails(recipe);
          setDetailsError("Le detail complet de cette recette n'a pas pu etre charge.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailsLoading(false);
        }
      }
    };

    loadRecipeDetails();

    return () => {
      controller.abort();
    };
  }, [recipe]);

  if (!recipe) {
    return null;
  }

  const displayedRecipe = recipeDetails || recipe;
  const ingredients = getIngredients(displayedRecipe);
  const instructions = displayedRecipe.strInstructions
    ?.split(/\r?\n/)
    .map(step => step.trim())
    .filter(Boolean);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="recipe-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          x
        </button>

        <div className="modal-media">
          <img src={displayedRecipe.strMealThumb} alt={displayedRecipe.strMeal} />
          <div className="modal-tags">
            {displayedRecipe.strCategory && <span>{displayedRecipe.strCategory}</span>}
            {displayedRecipe.strArea && <span>{displayedRecipe.strArea}</span>}
          </div>
        </div>

        <div className="modal-body">
          <p className="eyebrow">Recette detaillee</p>
          <h2 id="recipe-modal-title">{displayedRecipe.strMeal}</h2>
          {isDetailsLoading && <p className="modal-status">Chargement du detail...</p>}
          {detailsError && <p className="modal-status error">{detailsError}</p>}

          <div className="modal-actions">
            {displayedRecipe.strYoutube && (
              <a href={displayedRecipe.strYoutube} target="_blank" rel="noreferrer">
                Video
              </a>
            )}
            {displayedRecipe.strSource && (
              <a href={displayedRecipe.strSource} target="_blank" rel="noreferrer">
                Source
              </a>
            )}
          </div>

          <div className="modal-section">
            <h3>Ingredients</h3>
            {ingredients.length ? (
              <ul className="ingredient-list">
                {ingredients.map(({ ingredient, measure }) => (
                  <li key={`${ingredient}-${measure}`}>
                    <span>{ingredient}</span>
                    {measure && <strong>{measure}</strong>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Les ingredients ne sont pas disponibles pour cette recette.</p>
            )}
          </div>

          <div className="modal-section">
            <h3>Preparation</h3>
            {instructions?.length ? (
              instructions.map((step, index) => <p key={`${index}-${step.slice(0, 24)}`}>{step}</p>)
            ) : (
              <p>Les instructions ne sont pas disponibles pour cette recette.</p>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default RecipeModal;
