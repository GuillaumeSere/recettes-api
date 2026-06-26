import React from 'react'

const RecipeCard = ({ recipe, onOpen }) => {

    const { strMeal, strCategory, strArea, strMealThumb, strInstructions } = recipe;
    const preview = strInstructions
      ? `${strInstructions.replace(/\s+/g, " ").slice(0, 105)}...`
      : "Une recette a decouvrir dans le detail.";

  return (
    <article className='recipe-card'>
      <div className="card-image-wrap">
        <img
          src={strMealThumb}
          alt={strMeal}
          className="card-image"
        />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className='category'>{strCategory || "Plat"}</span>
          {strArea && <span>{strArea}</span>}
        </div>
        <h3>{strMeal}</h3>
        <p>{preview}</p>
        <button
          type="button"
          className="card-action"
          onClick={() => onOpen(recipe)}
        >
          Ouvrir la recette
        </button>
      </div>
    </article>
  )
}

export default RecipeCard

