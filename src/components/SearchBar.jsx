import React from 'react'

const SearchBar = ({
    value,
    isLoading,
    handleSubmit,
    onChange,
    onReset,
    areaOptions,
    selectedArea,
    onAreaChange
}) => {
  return (
    <form className="search-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="recipe-search">Rechercher une recette</label>
        <input 
            id="recipe-search"
            value={value}
            disabled={isLoading}
            onChange={onChange}
            placeholder='Rechercher une recette'
            className="search-input"
        />
        <label className="sr-only" htmlFor="area-filter">Filtrer par pays</label>
        <select
            id="area-filter"
            className="filter-select"
            value={selectedArea}
            onChange={onAreaChange}
            disabled={isLoading || !areaOptions.length}
        >
            <option value="">Tous les pays</option>
            {areaOptions.map(area => (
                <option value={area} key={area}>{area}</option>
            ))}
        </select>
        <button
            disabled={isLoading || !value.trim()}
            type="submit"
            className='btn primary-btn'
        >
            Rechercher
        </button>
        <button
            type="button"
            className='btn secondary-btn'
            onClick={onReset}
            disabled={isLoading}
        >
            Accueil
        </button>
    </form>
  )
}

export default SearchBar
