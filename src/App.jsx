import { useState } from 'react'
import './App.css'

function App() {
  // Lista temporanea della tua dieta
  const [meals, setMeals] = useState([
    { id: 1, name: "Pancake proteici (Albumi e Avena)", calories: 350, eaten: false },
    { id: 2, name: "Spuntino: Yogurt greco 0%", calories: 150, eaten: false },
    { id: 3, name: "Pranzo: Riso, Pollo e Zucchine", calories: 650, eaten: false },
    { id: 4, name: "Cena: Salmone e patate", calories: 550, eaten: false },
  ]);

  // Calcolo delle calorie totali della dieta e di quelle consumate finora
  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const consumedCalories = meals.filter(m => m.eaten).reduce((acc, meal) => acc + meal.calories, 0);

  // Funzione che inverte lo stato "mangiato" quando clicchi su un pasto
  const toggleMeal = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, eaten: !meal.eaten } : meal
    ));
  };

  return (
    <div className="app-container">
      <header>
        <h1>Diario Alimentare 🍎</h1>
        <div className="calorie-tracker">
          <h2>{consumedCalories} / {totalCalories} kcal</h2>
          <progress value={consumedCalories} max={totalCalories}></progress>
        </div>
      </header>

      <main>
        <div className="meal-list">
          {meals.map((meal) => (
            <label key={meal.id} className={`meal-item ${meal.eaten ? 'eaten' : ''}`}>
              <input 
                type="checkbox" 
                checked={meal.eaten} 
                onChange={() => toggleMeal(meal.id)}
              />
              <span className="meal-name">{meal.name}</span>
              <span className="meal-calories">{meal.calories} kcal</span>
            </label>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App