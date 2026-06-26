import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import RecipeCard from './components/RecipeCard';
import RecipeModal from './components/RecipeModal';
import SearchBar from './components/SearchBar';

const apiBaseUrl = "https://www.themealdb.com/api/json/v1/1";
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const recipesPerPage = 12;

const getIngredientsText = (recipe) => {
    return Array.from({ length: 20 }, (_, index) => recipe[`strIngredient${index + 1}`])
        .filter(Boolean)
        .join(" ");
};

const recipeMatchesQuery = (recipe, searchTerm) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    const searchableContent = [
        recipe.strMeal,
        recipe.strCategory,
        recipe.strArea,
        recipe.strTags,
        getIngredientsText(recipe)
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchableContent.includes(normalizedSearch);
};

const recipeMatchesArea = (recipe, selectedArea) => {
    if (!selectedArea) {
        return true;
    }

    return recipe.strArea === selectedArea;
};

const sortRecipes = (recipesToSort) => {
    return [...recipesToSort].sort((firstRecipe, secondRecipe) => (
        (firstRecipe.strMeal || "").localeCompare(secondRecipe.strMeal || "")
    ));
};

const removeDuplicateRecipes = (recipesToDeduplicate) => {
    const recipesById = new Map();

    recipesToDeduplicate.forEach(recipe => {
        if (recipe?.idMeal && !recipesById.has(recipe.idMeal)) {
            recipesById.set(recipe.idMeal, recipe);
        }
    });

    return sortRecipes(Array.from(recipesById.values()));
};

function App() {

    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [allRecipes, setAllRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [error, setError] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [selectedArea, setSelectedArea] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const loadAllRecipes = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const recipeGroups = await Promise.all(alphabet.map(async letter => {
                const response = await fetch(`${apiBaseUrl}/search.php?f=${letter}`);

                if (!response.ok) {
                    throw new Error("Request failed");
                }

                const data = await response.json();
                return data.meals || [];
            }));
            const loadedRecipes = removeDuplicateRecipes(recipeGroups.flat());

            if (!loadedRecipes.length) {
                throw new Error("No recipes found");
            }

            setAllRecipes(loadedRecipes);
        } catch (requestError) {
            setAllRecipes([]);
            setError("Impossible de charger toutes les recettes pour le moment.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllRecipes();
    }, [loadAllRecipes]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedQuery = query.trim();
        setActiveSearch(submittedQuery);
        setCurrentPage(1);
    };

    const handleChange = e => {
        setQuery(e.target.value);
    };

    const handleAreaChange = e => {
        setSelectedArea(e.target.value);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setQuery("");
        setActiveSearch("");
        setSelectedArea("");
        setCurrentPage(1);
        setSelectedRecipe(null);
    };

    const areaOptions = useMemo(() => {
        const areas = allRecipes
            .map(recipe => recipe.strArea)
            .filter(Boolean);

        return [...new Set(areas)].sort((firstArea, secondArea) => firstArea.localeCompare(secondArea));
    }, [allRecipes]);

    const filteredRecipes = useMemo(() => {
        return allRecipes.filter(recipe => (
            recipeMatchesQuery(recipe, activeSearch) && recipeMatchesArea(recipe, selectedArea)
        ));
    }, [allRecipes, activeSearch, selectedArea]);

    const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / recipesPerPage));
    const firstRecipeIndex = (currentPage - 1) * recipesPerPage;
    const paginatedRecipes = filteredRecipes.slice(firstRecipeIndex, firstRecipeIndex + recipesPerPage);
    const firstVisibleRecipe = filteredRecipes.length ? firstRecipeIndex + 1 : 0;
    const lastVisibleRecipe = Math.min(firstRecipeIndex + recipesPerPage, filteredRecipes.length);
    const hasRecipes = filteredRecipes.length > 0;
    const resultsTitle = activeSearch
        ? `Resultats pour "${activeSearch}"`
        : "Toutes les recettes";
    const filteredResultsTitle = selectedArea
        ? `${resultsTitle} - origine ${selectedArea}`
        : resultsTitle;
    const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter(page => (
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1
        ));

  return (
    <main className="app-shell">
        <section className="hero">
            <div className="hero-copy">
                <p className="eyebrow">Recettes simples et inspirees</p>
                <h1>Recette-API</h1>
                <p>
                    Parcourez toute la collection TheMealDB, explorez les ingredients et gardez la recette ouverte pendant que vous cuisinez.
                </p>
            </div>

            <aside className="hero-panel" aria-label="Recettes affichees">
                <span>{allRecipes.length}</span>
                <p>recettes chargees</p>
            </aside>
        </section>

        <SearchBar
            handleSubmit={handleSubmit}
            value={query}
            onChange={handleChange}
            isLoading={isLoading}
            onReset={handleReset}
            areaOptions={areaOptions}
            selectedArea={selectedArea}
            onAreaChange={handleAreaChange}
        />

        <section className="results-header" aria-live="polite">
            <div>
                <h2>{filteredResultsTitle}</h2>
                <p>
                    {isLoading && "Chargement de toute la collection..."}
                    {!isLoading && error}
                    {!isLoading && !error && hasRecipes && `${filteredRecipes.length} recette${filteredRecipes.length > 1 ? "s" : ""} trouvee${filteredRecipes.length > 1 ? "s" : ""}, affichage ${firstVisibleRecipe}-${lastVisibleRecipe}.`}
                    {!isLoading && !error && !hasRecipes && "Aucune recette trouvee."}
                </p>
            </div>
        </section>

        {isLoading ? (
            <div className="recipes" aria-label="Chargement des recettes">
                {[1, 2, 3, 4, 5, 6].map(item => (
                    <div className="recipe-card skeleton-card" key={item}>
                        <div className="skeleton-image" />
                        <div className="card-body">
                            <span className="skeleton-line short" />
                            <span className="skeleton-line" />
                            <span className="skeleton-line" />
                        </div>
                    </div>
                ))}
            </div>
        ) : error ? (
            <div className="empty-state">
                <h3>Service indisponible</h3>
                <p>{error}</p>
            </div>
        ) : hasRecipes ? (
            <>
                <div className="recipes">
                    {paginatedRecipes.map(recipe => (
                        <RecipeCard
                            key={recipe.idMeal}
                            recipe={recipe}
                            onOpen={setSelectedRecipe}
                        />
                    ))}
                </div>

                {totalPages > 1 && (
                    <nav className="pagination" aria-label="Pagination des recettes">
                        <button
                            type="button"
                            className="page-btn"
                            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                        >
                            Precedent
                        </button>

                        <div className="page-numbers">
                            {visiblePages.map((page, index) => {
                                const previousPage = visiblePages[index - 1];
                                const shouldShowGap = previousPage && page - previousPage > 1;

                                return (
                                    <span className="page-number-group" key={page}>
                                        {shouldShowGap && <span className="page-gap">...</span>}
                                        <button
                                            type="button"
                                            className={`page-btn number-btn${page === currentPage ? " active" : ""}`}
                                            onClick={() => setCurrentPage(page)}
                                            aria-current={page === currentPage ? "page" : undefined}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className="page-btn"
                            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Suivant
                        </button>
                    </nav>
                )}
            </>
        ) : (
            <div className="empty-state">
                <h3>Aucune recette trouvee</h3>
                <p>Essayez une recherche par nom, categorie, origine ou ingredient.</p>
            </div>
        )}

        <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
        />
    </main>
  );
}

export default App;
