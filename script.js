class RecipeApp {
    constructor() {
        this.recipes = this.loadRecipes();
        this.currentEditId = null;
        this.currentFilter = 'all';
        
        this.initializeElements();
        this.bindEvents();
        this.renderRecipes();
    }

    initializeElements() {
        this.recipesGrid = document.getElementById('recipesGrid');
        this.addRecipeBtn = document.getElementById('addRecipeBtn');
        this.recipeModal = document.getElementById('recipeModal');
        this.recipeDetailModal = document.getElementById('recipeDetailModal');
        this.recipeForm = document.getElementById('recipeForm');
        this.searchInput = document.getElementById('searchInput');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.closeModalBtns = document.querySelectorAll('.close-btn');
        this.cancelBtn = document.getElementById('cancelBtn');
    }

    bindEvents() {
        this.addRecipeBtn.addEventListener('click', () => this.openModal());
        this.recipeForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.cancelBtn.addEventListener('click', () => this.closeModal());

        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Close modal on outside click
        [this.recipeModal, this.recipeDetailModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'n' && e.ctrlKey) {
                e.preventDefault();
                this.openModal();
            }
        });
    }

    loadRecipes() {
        const stored = localStorage.getItem('recipes');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Default recipes with sample data
        return [
            {
                id: 1,
                name: "Classic Pancakes",
                category: "breakfast",
                cookingTime: 20,
                difficulty: "easy",
                servings: 4,
                imageUrl: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg",
                ingredients: ["2 cups all-purpose flour", "2 tablespoons sugar", "2 teaspoons baking powder", "1 teaspoon salt", "2 large eggs", "1 3/4 cups milk", "1/4 cup melted butter"],
                instructions: "1. Mix dry ingredients in a large bowl\n2. Whisk eggs, milk, and melted butter in another bowl\n3. Combine wet and dry ingredients until just mixed\n4. Heat griddle or pan over medium heat\n5. Pour 1/4 cup batter for each pancake\n6. Cook until bubbles form, flip and cook until golden"
            },
            {
                id: 3,
                name: "Chocolate Chip Cookies",
                category: "dessert",
                cookingTime: 25,
                difficulty: "easy",
                servings: 24,
                imageUrl: "https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg",
                ingredients: ["2 1/4 cups flour", "1 cup butter, softened", "3/4 cup brown sugar", "1/2 cup white sugar", "2 eggs", "1 tsp vanilla", "1 tsp baking soda", "1/2 tsp salt", "2 cups chocolate chips"],
                instructions: "1. Preheat oven to 375°F\n2. Cream butter and sugars\n3. Beat in eggs and vanilla\n4. Mix in flour, baking soda, and salt\n5. Stir in chocolate chips\n6. Drop spoonfuls on baking sheet\n7. Bake 9-11 minutes until golden"
            }
        ];
    }

    saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
    }

    generateId() {
        return Date.now() + Math.random();
    }

    openModal(recipe = null) {
        this.currentEditId = recipe ? recipe.id : null;
        const modalTitle = document.getElementById('modalTitle');
        modalTitle.textContent = recipe ? 'Edit Recipe' : 'Add New Recipe';

        if (recipe) {
            this.populateForm(recipe);
        } else {
            this.recipeForm.reset();
        }

        this.recipeModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    populateForm(recipe) {
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeCategory').value = recipe.category;
        document.getElementById('cookingTime').value = recipe.cookingTime;
        document.getElementById('difficulty').value = recipe.difficulty;
        document.getElementById('servings').value = recipe.servings;
        document.getElementById('imageUrl').value = recipe.imageUrl || '';
        document.getElementById('ingredients').value = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients.join('\n') 
            : recipe.ingredients;
        document.getElementById('instructions').value = recipe.instructions;
    }

    closeModal() {
        this.recipeModal.classList.remove('show');
        this.recipeDetailModal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.recipeForm);
        const recipe = {
            id: this.currentEditId || this.generateId(),
            name: formData.get('recipeName') || document.getElementById('recipeName').value,
            category: formData.get('recipeCategory') || document.getElementById('recipeCategory').value,
            cookingTime: parseInt(formData.get('cookingTime') || document.getElementById('cookingTime').value),
            difficulty: formData.get('difficulty') || document.getElementById('difficulty').value,
            servings: parseInt(formData.get('servings') || document.getElementById('servings').value),
            imageUrl: formData.get('imageUrl') || document.getElementById('imageUrl').value,
            ingredients: (formData.get('ingredients') || document.getElementById('ingredients').value)
                .split('\n')
                .filter(ingredient => ingredient.trim())
                .map(ingredient => ingredient.trim()),
            instructions: formData.get('instructions') || document.getElementById('instructions').value
        };

        if (this.currentEditId) {
            const index = this.recipes.findIndex(r => r.id === this.currentEditId);
            if (index !== -1) {
                this.recipes[index] = recipe;
            }
        } else {
            this.recipes.push(recipe);
        }

        this.saveRecipes();
        this.renderRecipes();
        this.closeModal();

        // Show success message
        this.showNotification(
            this.currentEditId ? 'Recipe updated successfully!' : 'Recipe added successfully!',
            'success'
        );
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        this.renderRecipes(searchTerm);
    }

    handleFilter(e) {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.category;
        this.renderRecipes();
    }

    renderRecipes(searchTerm = '') {
        let filteredRecipes = this.recipes;

        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.category === this.currentFilter
            );
        }

        // Apply search filter
        if (searchTerm) {
            filteredRecipes = filteredRecipes.filter(recipe =>
                recipe.name.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(searchTerm)
                )
            );
        }

        if (filteredRecipes.length === 0) {
            this.recipesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <h3>No recipes found</h3>
                    <p>${searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first recipe!'}</p>
                </div>
            `;
            return;
        }

        this.recipesGrid.innerHTML = filteredRecipes
            .map((recipe, index) => this.createRecipeCard(recipe, index))
            .join('');

        // Bind card events
        this.bindCardEvents();
    }

    createRecipeCard(recipe, index) {
        const defaultImage = "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg";
        const imageUrl = recipe.imageUrl && recipe.imageUrl.trim() ? recipe.imageUrl : defaultImage;
        
        return `
            <div class="recipe-card" style="animation-delay: ${index * 0.1}s">
                <img src="${imageUrl}" alt="${recipe.name}" class="recipe-image" 
                     onerror="this.src='${defaultImage}'">
                <div class="recipe-content">
                    <div class="recipe-header">
                        <div>
                            <h3 class="recipe-title">${recipe.name}</h3>
                            <span class="difficulty ${recipe.difficulty}">${recipe.difficulty}</span>
                        </div>
                        <span class="recipe-category">${recipe.category}</span>
                    </div>
                    
                    <div class="recipe-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${recipe.cookingTime} min</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <span>${recipe.servings} servings</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-list"></i>
                            <span>${recipe.ingredients.length} ingredients</span>
                        </div>
                    </div>
                    
                    <p class="recipe-description">
                        ${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}
                    </p>
                    
                    <div class="recipe-actions">
                        <button class="action-btn view-btn" onclick="app.viewRecipe(${recipe.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn edit-btn" onclick="app.editRecipe(${recipe.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="app.deleteRecipe(${recipe.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindCardEvents() {
        const cards = document.querySelectorAll('.recipe-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    viewRecipe(id) {
        const recipe = this.recipes.find(r => r.id === id);
        if (!recipe) return;

        const defaultImage = "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg";
        const imageUrl = recipe.imageUrl && recipe.imageUrl.trim() ? recipe.imageUrl : defaultImage;

        document.getElementById('recipeDetailContent').innerHTML = `
            <div class="recipe-detail-header">
                <img src="${imageUrl}" alt="${recipe.name}" class="recipe-detail-image"
                     onerror="this.src='${defaultImage}'">
                <h2 class="recipe-detail-title">${recipe.name}</h2>
                <div class="recipe-detail-meta">
                    <div class="detail-meta-item">
                        <div class="icon"><i class="fas fa-clock"></i></div>
                        <div class="label">Cooking Time</div>
                        <div class="value">${recipe.cookingTime} min</div>
                    </div>
                    <div class="detail-meta-item">
                        <div class="icon"><i class="fas fa-users"></i></div>
                        <div class="label">Servings</div>
                        <div class="value">${recipe.servings}</div>
                    </div>
                    <div class="detail-meta-item">
                        <div class="icon"><i class="fas fa-signal"></i></div>
                        <div class="label">Difficulty</div>
                        <div class="value difficulty ${recipe.difficulty}">${recipe.difficulty}</div>
                    </div>
                    <div class="detail-meta-item">
                        <div class="icon"><i class="fas fa-tag"></i></div>
                        <div class="label">Category</div>
                        <div class="value">${recipe.category}</div>
                    </div>
                </div>
            </div>
            
            <div class="recipe-section">
                <h3 class="section-title">
                    <i class="fas fa-list"></i>
                    Ingredients
                </h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
            </div>
            
            <div class="recipe-section">
                <h3 class="section-title">
                    <i class="fas fa-clipboard-list"></i>
                    Instructions
                </h3>
                <ol class="instructions-list">
                    ${recipe.instructions.split('\n').filter(step => step.trim()).map(step => `<li>${step.trim()}</li>`).join('')}
                </ol>
            </div>
        `;

        this.recipeDetailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    editRecipe(id) {
        const recipe = this.recipes.find(r => r.id === id);
        if (recipe) {
            this.openModal(recipe);
        }
    }

    deleteRecipe(id) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            const card = document.querySelector(`[onclick="app.deleteRecipe(${id})"]`).closest('.recipe-card');
            card.classList.add('removing');
            
            setTimeout(() => {
                this.recipes = this.recipes.filter(r => r.id !== id);
                this.saveRecipes();
                this.renderRecipes();
                this.showNotification('Recipe deleted successfully!', 'success');
            }, 400);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RecipeApp();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registered'))
            .catch(() => console.log('SW registration failed'));
    });
}