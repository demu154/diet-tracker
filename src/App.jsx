import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

// I TUOI TARGET FISSI
const TARGET_CARBS = 365;
const TARGET_PROTEINS = 160;
const TARGET_FATS = 60;

function App() {
  const [meals, setMeals] = useState([]);
  const [variant, setVariant] = useState(1);

  useEffect(() => {
    async function fetchMeals() {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('variant', variant)
        .order('id');

      if (!error) {
        setMeals(data.map(meal => ({ ...meal, eaten: false })));
      }
    }
    fetchMeals();
  }, [variant]);

  // Calcolo Calorie
  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);
  const progressPercentage = totalCalories > 0 ? (consumedCalories / totalCalories) * 100 : 0;

  // Calcolo Macro Consumati (somma solo quelli con la spunta)
  const consumedCarbs = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.carbs || 0), 0);
  const consumedProteins = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.proteins || 0), 0);
  const consumedFats = meals.filter(m => m.eaten).reduce((acc, meal) => acc + (meal.fats || 0), 0);

  const toggleMeal = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, eaten: !meal.eaten } : meal
    ));
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare</h1>
        
        <div className="segmented-control">
          {[1, 2, 3].map(num => (
            <button 
              key={num} 
              onClick={() => setVariant(num)} 
              className={`segment-button ${variant === num ? 'active' : ''}`}
            >
              Menu {num}
            </button>
          ))}
        </div>

        {/* Barra Calorie */}
        <div className="calorie-tracker">
          <h2>{consumedCalories} <span style={{ color: '#8e8e93', fontSize: '18px' }}>/ {totalCalories} kcal</span></h2>
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Nuova Sezione Macro */}
        <div className="macros-container">
          <div className="macro-box">
            CARBO
            <span className="macro-carbs">{consumedCarbs} / {TARGET_CARBS}g</span>
          </div>
          <div className="macro-box">
            PRO
            <span className="macro-proteins">{consumedProteins} / {TARGET_PROTEINS}g</span>
          </div>
          <div className="macro-box">
            GRASSI
            <span className="macro-fats">{consumedFats} / {TARGET_FATS}g</span>
          </div>
        </div>
      </header>

      <main>
        <div className="meal-list">
          {meals.map((meal) => (
            <label key={meal.id} className={`meal-item ${meal.eaten ? 'eaten' : ''}`}>
              <input type="checkbox" checked={meal.eaten} onChange={() => toggleMeal(meal.id)} />
              
              <div className="custom-checkbox"></div>
              
              <div style={{ flex: 1 }}>
                <div className="meal-name">{meal.meal_type}: {meal.name}</div>
                <div className="meal-desc">{meal.description}</div>
                
                {/* Etichette con i macro specifici di quel pasto */}
                <div className="meal-macros">
                  <span className="micro-tag">🍞 {meal.carbs}g</span>
                  <span className="micro-tag">🍗 {meal.proteins}g</span>
                  <span className="micro-tag">🥑 {meal.fats}g</span>
                </div>
              </div>
              
              <div className="meal-calories">{meal.calories} kcal</div>
            </label>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App