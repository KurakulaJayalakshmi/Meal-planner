
// What's in My Fridge - Meal Planner App
// Global variables
let selectedIngredients = [];
let currentPage = 1;
let recognition = null;
let isListening = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showPage(1);
    setupIngredientSelection();
});

// Page navigation
function goToPage(pageNumber) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    document.getElementById(`page${pageNumber}`).classList.add('active');
    currentPage = pageNumber;
    
    // Special handling for recipe generation pages
    if (pageNumber === 4) {
        displaySelectedIngredients();
        generateRecipe();
    }
}

// For backward compatibility with the HTML
function showPage(pageNumber) {
    goToPage(pageNumber);
}

// Setup ingredient selection functionality
function setupIngredientSelection() {
    const ingredientItems = document.querySelectorAll('.ingredient-item');
    
    ingredientItems.forEach(item => {
        item.addEventListener('click', function() {
            const ingredient = this.dataset.ingredient;
            toggleIngredient(ingredient, this);
        });
    });
}

// Toggle ingredient selection
function toggleIngredient(ingredient, element) {
    if (selectedIngredients.includes(ingredient)) {
        // Remove ingredient
        selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
        element.classList.remove('selected');
    } else {
        // Add ingredient
        selectedIngredients.push(ingredient);
        element.classList.add('selected');
    }
    
    updateSelectedDisplay();
}

// Update the selected ingredients display
function updateSelectedDisplay() {
    const countElement = document.getElementById('ingredient-count');
    const listElement = document.getElementById('selected-list');
    const generateBtn = document.getElementById('generate-btn');
    
    countElement.textContent = selectedIngredients.length;
    
    // Clear and rebuild the selected list
    listElement.innerHTML = '';
    
    selectedIngredients.forEach(ingredient => {
        const selectedItem = document.createElement('div');
        selectedItem.className = 'selected-item';
        selectedItem.innerHTML = `
            <span>${ingredient}</span>
            <button class="remove-ingredient" onclick="removeIngredient('${ingredient}')">×</button>
        `;
        listElement.appendChild(selectedItem);
    });
    
    // Enable/disable generate button
    generateBtn.disabled = selectedIngredients.length === 0;
}

// Remove ingredient from selection
function removeIngredient(ingredient) {
    selectedIngredients = selectedIngredients.filter(item => item !== ingredient);
    
    // Update UI
    const ingredientElement = document.querySelector(`[data-ingredient="${ingredient}"]`);
    if (ingredientElement) {
        ingredientElement.classList.remove('selected');
    }
    
    updateSelectedDisplay();
}

// Voice Recognition Functions
function startVoiceRecognition() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Sorry, your browser does not support voice recognition. Please use Chrome, Edge, or Safari.');
        return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Show voice status
    const voiceStatus = document.getElementById('voice-status');
    const voiceBtn = document.getElementById('voice-btn');
    const voiceText = document.getElementById('voice-text');
    const voiceResults = document.getElementById('voice-results');
    
    voiceStatus.style.display = 'block';
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '🔴 Listening...';
    isListening = true;
    
    // Clear previous results
    voiceResults.innerHTML = '';
    
    // Handle speech results
    recognition.onresult = function(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update display
        voiceText.innerHTML = `Listening... "${interimTranscript || finalTranscript}"`;
        
        // Process final results
        if (finalTranscript) {
            processVoiceInput(finalTranscript);
        }
    };
    
    // Handle errors
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        voiceText.innerHTML = `Error: ${event.error}. Please try again.`;
    };
    
    // Handle end of recognition
    recognition.onend = function() {
        if (isListening) {
            // Restart recognition if still listening
            setTimeout(() => {
                if (isListening) {
                    recognition.start();
                }
            }, 100);
        }
    };
    
    // Start recognition
    recognition.start();
    
    // Provide voice feedback
    speakText("I'm listening for your ingredients. Please speak clearly.");
}

function stopVoiceRecognition() {
    if (recognition) {
        recognition.stop();
        isListening = false;
    }
    
    const voiceStatus = document.getElementById('voice-status');
    const voiceBtn = document.getElementById('voice-btn');
    
    voiceStatus.style.display = 'none';
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '🎤 Voice';
    
    speakText("Voice recognition stopped.");
}

function processVoiceInput(transcript) {
    const voiceResults = document.getElementById('voice-results');
    
    // Create a comprehensive list of ingredients that can be recognized
    const ingredientKeywords = {
        // Vegetables
        'tomato': 'tomato', 'tomatoes': 'tomato',
        'potato': 'potato', 'potatoes': 'potato',
        'onion': 'onion', 'onions': 'onion',
        'carrot': 'carrot', 'carrots': 'carrot',
        'cucumber': 'cucumber', 'cucumbers': 'cucumber',
        'pepper': 'bell pepper', 'peppers': 'bell pepper', 'bell pepper': 'bell pepper',
        'broccoli': 'broccoli',
        'spinach': 'spinach',
        'lettuce': 'lettuce',
        'garlic': 'garlic',
        'ginger': 'ginger',
        
        // Proteins
        'chicken': 'chicken',
        'beef': 'beef',
        'pork': 'pork',
        'fish': 'fish',
        'salmon': 'salmon',
        'tuna': 'tuna',
        'egg': 'eggs', 'eggs': 'eggs',
        'tofu': 'tofu',
        'beans': 'beans',
        'lentils': 'lentils',
        
        // Dairy
        'milk': 'milk',
        'cheese': 'cheese',
        'butter': 'butter',
        'yogurt': 'yogurt', 'yoghurt': 'yogurt',
        'cream': 'cream',
        
        // Grains
        'rice': 'rice',
        'pasta': 'pasta',
        'bread': 'bread',
        'flour': 'flour',
        'oats': 'oats',
        
        // Fruits
        'apple': 'apple', 'apples': 'apple',
        'banana': 'banana', 'bananas': 'banana',
        'orange': 'orange', 'oranges': 'orange',
        'lemon': 'lemon', 'lemons': 'lemon',
        'lime': 'lime', 'limes': 'lime',
        'strawberry': 'strawberry', 'strawberries': 'strawberry',
        
        // Herbs & Spices
        'basil': 'basil',
        'oregano': 'oregano',
        'thyme': 'thyme',
        'rosemary': 'rosemary',
        'parsley': 'parsley',
        'cilantro': 'cilantro',
        'salt': 'salt',
        'pepper': 'black pepper',
        'paprika': 'paprika',
        'cumin': 'cumin'
    };
    
    // Process the transcript to find ingredients
    const words = transcript.toLowerCase().split(/\s+/);
    const foundIngredients = [];
    
    words.forEach(word => {
        // Remove punctuation
        const cleanWord = word.replace(/[^\w]/g, '');
        if (ingredientKeywords[cleanWord]) {
            const ingredient = ingredientKeywords[cleanWord];
            if (!foundIngredients.includes(ingredient) && !selectedIngredients.includes(ingredient)) {
                foundIngredients.push(ingredient);
            }
        }
    });
    
    // Add found ingredients to selection
    foundIngredients.forEach(ingredient => {
        // Add to selected ingredients
        selectedIngredients.push(ingredient);
        
        // Update UI - find and select the ingredient item
        const ingredientElement = document.querySelector(`[data-ingredient="${ingredient}"]`);
        if (ingredientElement) {
            ingredientElement.classList.add('selected');
        }
        
        // Add to voice results display
        const resultItem = document.createElement('span');
        resultItem.className = 'voice-result-item';
        resultItem.textContent = ingredient;
        voiceResults.appendChild(resultItem);
    });
    
    // Update the selected ingredients display
    updateSelectedDisplay();
    
    // Provide voice feedback
    if (foundIngredients.length > 0) {
        const ingredientList = foundIngredients.join(', ');
        speakText(`Added ${ingredientList} to your ingredients.`);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// Display selected ingredients on recipe page
function displaySelectedIngredients() {
    const ingredientsList = document.getElementById('recipe-ingredients-list');
    ingredientsList.innerHTML = '';
    
    selectedIngredients.forEach(ingredient => {
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.textContent = ingredient;
        ingredientsList.appendChild(tag);
    });
}

// Generate recipe - Enhanced creative version
async function generateRecipe() {
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('recipe-result');
    const errorElement = document.getElementById('error-message');
    
    // Show loading
    loadingElement.style.display = 'block';
    resultElement.style.display = 'none';
    errorElement.style.display = 'none';
    
    // Simulate loading time for better UX
    setTimeout(() => {
        try {
            // Generate creative recipe directly (no API dependency)
            const recipe = generateCreativeRecipe(selectedIngredients);
            displayRecipe(recipe);
        } catch (error) {
            console.error('Error generating recipe:', error);
            showFallbackRecipe();
        }
    }, 2000); // 2 second loading animation
}

// Generate creative recipe with enhanced logic for any number of ingredients
function generateCreativeRecipe(ingredients) {
    // Special handling for different ingredient counts
    if (ingredients.length === 1) {
        return generateSingleIngredientRecipe(ingredients[0]);
    } else if (ingredients.length === 2) {
        return generateTwoIngredientRecipe(ingredients);
    } else if (ingredients.length <= 4) {
        return generateSimpleRecipe(ingredients);
    } else {
        return generateComplexRecipe(ingredients);
    }
}

// Special recipe for single ingredient
function generateSingleIngredientRecipe(ingredient) {
    const singleRecipes = {
        'potato': {
            name: 'Perfect Crispy Roasted Potato',
            instructions: [
                'Preheat oven to 425°F (220°C)',
                'Wash and cube the potato into bite-sized pieces',
                'Toss with olive oil, salt, and pepper',
                'Roast for 25-30 minutes until golden and crispy',
                'Serve hot with your favorite dipping sauce'
            ],
            tips: 'For extra crispiness, soak cubed potatoes in cold water for 30 minutes before roasting!'
        },
        'eggs': {
            name: 'Fluffy Cloud Scrambled Eggs',
            instructions: [
                'Crack 3 eggs into a bowl and whisk gently',
                'Heat butter in a non-stick pan over low heat',
                'Pour in eggs and stir continuously with a spatula',
                'Remove from heat while still slightly wet',
                'Season with salt and pepper, serve immediately'
            ],
            tips: 'The secret is low heat and constant stirring for the creamiest texture!'
        },
        'tomato': {
            name: 'Caramelized Tomato Delight',
            instructions: [
                'Slice tomatoes into thick rounds',
                'Heat olive oil in a pan over medium heat',
                'Cook tomato slices for 3-4 minutes per side',
                'Sprinkle with salt, pepper, and fresh herbs',
                'Serve as a side dish or on toast'
            ],
            tips: 'Choose ripe but firm tomatoes for the best caramelization!'
        }
    };
    
    const recipe = singleRecipes[ingredient.toLowerCase()] || {
        name: `Simple ${capitalizeFirst(ingredient)} Preparation`,
        instructions: [
            `Prepare your ${ingredient} by washing and cutting as needed`,
            'Season with salt, pepper, and olive oil',
            'Cook using your preferred method (sauté, bake, or steam)',
            'Taste and adjust seasoning',
            'Serve and enjoy!'
        ],
        tips: `${capitalizeFirst(ingredient)} is versatile - experiment with different cooking methods!`
    };
    
    return {
        ...recipe,
        cookingTime: 15,
        servings: 1,
        difficulty: 'Easy',
        ingredients: [`1 portion ${ingredient}`, 'Salt to taste', 'Pepper to taste', 'Olive oil']
    };
}

// Enhanced two-ingredient recipe generator
function generateTwoIngredientRecipe(ingredients) {
    const [ing1, ing2] = ingredients.map(ing => ing.toLowerCase());
    
    // Special two-ingredient combinations with detailed recipes
    const combinations = {
        'eggs,tomato': {
            name: 'Mediterranean Scrambled Eggs',
            style: 'Mediterranean',
            method: 'scramble',
            instructions: [
                'Dice 2 medium tomatoes into small pieces, removing seeds',
                'Heat 2 tablespoons olive oil in a non-stick pan over medium heat',
                'Add diced tomatoes and cook for 4-5 minutes until softened and slightly caramelized',
                'Beat 3 eggs in a bowl with a pinch of salt and pepper',
                'Pour beaten eggs into the pan with tomatoes',
                'Using a spatula, gently scramble the eggs with tomatoes for 2-3 minutes',
                'Remove from heat while eggs are still slightly creamy',
                'Garnish with fresh basil or parsley and serve immediately'
            ],
            tips: 'Remove tomato seeds to prevent excess moisture. The key is gentle heat and not overcooking the eggs!'
        },
        'tomato,eggs': {
            name: 'Mediterranean Scrambled Eggs',
            style: 'Mediterranean',
            method: 'scramble',
            instructions: [
                'Dice 2 medium tomatoes into small pieces, removing seeds',
                'Heat 2 tablespoons olive oil in a non-stick pan over medium heat',
                'Add diced tomatoes and cook for 4-5 minutes until softened and slightly caramelized',
                'Beat 3 eggs in a bowl with a pinch of salt and pepper',
                'Pour beaten eggs into the pan with tomatoes',
                'Using a spatula, gently scramble the eggs with tomatoes for 2-3 minutes',
                'Remove from heat while eggs are still slightly creamy',
                'Garnish with fresh basil or parsley and serve immediately'
            ],
            tips: 'Remove tomato seeds to prevent excess moisture. The key is gentle heat and not overcooking the eggs!'
        },
        'potato,cheese': {
            name: 'Cheesy Potato Gratin',
            style: 'French-inspired',
            method: 'bake',
            instructions: [
                'Preheat oven to 375°F (190°C) and grease a baking dish',
                'Wash and peel 3 medium potatoes, then slice them very thinly (1/8 inch)',
                'Layer half the potato slices in the baking dish, overlapping slightly',
                'Sprinkle half the cheese (about 50g) over the potatoes',
                'Add the remaining potato slices in another layer',
                'Top with remaining cheese and a pinch of salt and pepper',
                'Cover with foil and bake for 35 minutes',
                'Remove foil and bake 15 more minutes until golden and bubbly',
                'Let rest for 10 minutes before serving'
            ],
            tips: 'Use a mandoline or sharp knife for even potato slices. Gruyere or cheddar work best for this dish!'
        },
        'cheese,potato': {
            name: 'Cheesy Potato Gratin',
            style: 'French-inspired',
            method: 'bake',
            instructions: [
                'Preheat oven to 375°F (190°C) and grease a baking dish',
                'Wash and peel 3 medium potatoes, then slice them very thinly (1/8 inch)',
                'Layer half the potato slices in the baking dish, overlapping slightly',
                'Sprinkle half the cheese (about 50g) over the potatoes',
                'Add the remaining potato slices in another layer',
                'Top with remaining cheese and a pinch of salt and pepper',
                'Cover with foil and bake for 35 minutes',
                'Remove foil and bake 15 more minutes until golden and bubbly',
                'Let rest for 10 minutes before serving'
            ],
            tips: 'Use a mandoline or sharp knife for even potato slices. Gruyere or cheddar work best for this dish!'
        },
        'chicken,rice': {
            name: 'One-Pot Chicken Rice Pilaf',
            style: 'Comfort food',
            method: 'one-pot',
            instructions: [
                'Cut 2 chicken breasts into bite-sized pieces and season with salt and pepper',
                'Heat 2 tablespoons oil in a large, heavy-bottomed pot over medium-high heat',
                'Brown chicken pieces on all sides (about 5-6 minutes total)',
                'Add 1 cup rice and stir for 2 minutes to lightly toast',
                'Pour in 2 cups chicken broth or water and bring to a boil',
                'Reduce heat to low, cover tightly, and simmer for 18-20 minutes',
                'Remove from heat and let stand 5 minutes without lifting lid',
                'Fluff with a fork and season with salt, pepper, and herbs'
            ],
            tips: 'Don\'t lift the lid while cooking - this releases steam needed for perfect rice!'
        },
        'rice,chicken': {
            name: 'One-Pot Chicken Rice Pilaf',
            style: 'Comfort food',
            method: 'one-pot',
            instructions: [
                'Cut 2 chicken breasts into bite-sized pieces and season with salt and pepper',
                'Heat 2 tablespoons oil in a large, heavy-bottomed pot over medium-high heat',
                'Brown chicken pieces on all sides (about 5-6 minutes total)',
                'Add 1 cup rice and stir for 2 minutes to lightly toast',
                'Pour in 2 cups chicken broth or water and bring to a boil',
                'Reduce heat to low, cover tightly, and simmer for 18-20 minutes',
                'Remove from heat and let stand 5 minutes without lifting lid',
                'Fluff with a fork and season with salt, pepper, and herbs'
            ],
            tips: 'Don\'t lift the lid while cooking - this releases steam needed for perfect rice!'
        },
        'banana,oats': {
            name: 'Creamy Banana Oat Bowl',
            style: 'Healthy breakfast',
            method: 'no-cook',
            instructions: [
                'Peel and mash 1 ripe banana in a bowl until mostly smooth',
                'Add 1/2 cup rolled oats to the mashed banana',
                'Mix well and add 1/4 cup milk or water if desired for creaminess',
                'Let the mixture sit for 5-10 minutes to allow oats to soften',
                'Slice the remaining banana and arrange on top',
                'Drizzle with honey or maple syrup if available',
                'Add a sprinkle of cinnamon for extra flavor'
            ],
            tips: 'Use very ripe bananas for natural sweetness. This can be made the night before for overnight oats!'
        },
        'oats,banana': {
            name: 'Creamy Banana Oat Bowl',
            style: 'Healthy breakfast',
            method: 'no-cook',
            instructions: [
                'Peel and mash 1 ripe banana in a bowl until mostly smooth',
                'Add 1/2 cup rolled oats to the mashed banana',
                'Mix well and add 1/4 cup milk or water if desired for creaminess',
                'Let the mixture sit for 5-10 minutes to allow oats to soften',
                'Slice the remaining banana and arrange on top',
                'Drizzle with honey or maple syrup if available',
                'Add a sprinkle of cinnamon for extra flavor'
            ],
            tips: 'Use very ripe bananas for natural sweetness. This can be made the night before for overnight oats!'
        },
        'pasta,tomato': {
            name: 'Simple Tomato Pasta',
            style: 'Italian classic',
            method: 'boil-and-sauté',
            instructions: [
                'Bring a large pot of salted water to boil for the pasta',
                'Dice 3 medium tomatoes, removing seeds and excess juice',
                'Cook pasta according to package directions until al dente',
                'While pasta cooks, heat olive oil in a large pan over medium heat',
                'Add diced tomatoes and cook for 5-6 minutes until softened',
                'Season tomatoes with salt, pepper, and Italian herbs',
                'Drain pasta and add directly to the tomato pan',
                'Toss everything together for 1-2 minutes and serve hot'
            ],
            tips: 'Save some pasta water to add if the dish seems dry - the starch helps bind everything!'
        },
        'tomato,pasta': {
            name: 'Simple Tomato Pasta',
            style: 'Italian classic',
            method: 'boil-and-sauté',
            instructions: [
                'Bring a large pot of salted water to boil for the pasta',
                'Dice 3 medium tomatoes, removing seeds and excess juice',
                'Cook pasta according to package directions until al dente',
                'While pasta cooks, heat olive oil in a large pan over medium heat',
                'Add diced tomatoes and cook for 5-6 minutes until softened',
                'Season tomatoes with salt, pepper, and Italian herbs',
                'Drain pasta and add directly to the tomato pan',
                'Toss everything together for 1-2 minutes and serve hot'
            ],
            tips: 'Save some pasta water to add if the dish seems dry - the starch helps bind everything!'
        },
        'apple,cheese': {
            name: 'Caramelized Apple & Cheese Melt',
            style: 'Comfort food',
            method: 'pan-cook',
            instructions: [
                'Core and slice 2 apples into thin wedges (leave skin on)',
                'Heat butter in a large skillet over medium heat',
                'Add apple slices and cook for 4-5 minutes until starting to caramelize',
                'Flip apples and cook another 3-4 minutes until golden',
                'Grate or slice cheese and place over the apples',
                'Cover pan for 2-3 minutes to melt the cheese',
                'Season with a pinch of salt and black pepper',
                'Serve immediately while cheese is still melty'
            ],
            tips: 'Sharp cheddar or gruyere work best with apples. A drizzle of honey adds extra sweetness!'
        },

        'milk,bread': {
            name: 'Classic French Toast',
            style: 'Breakfast classic',
            method: 'pan-fry',
            instructions: [
                'Pour 1/2 cup milk into a shallow bowl',
                'Add a pinch of salt and whisk the milk',
                'Dip each slice of bread into the milk, letting it soak for 10 seconds per side',
                'Heat butter or oil in a non-stick pan over medium heat',
                'Place soaked bread slices in the hot pan',
                'Cook for 2-3 minutes until golden brown on the bottom',
                'Flip and cook another 2-3 minutes until golden on both sides',
                'Serve hot with honey, syrup, or fresh fruit'
            ],
            tips: 'Use slightly stale bread for better absorption. Add a beaten egg to the milk for richer French toast!'
        },
        'bread,milk': {
            name: 'Classic French Toast',
            style: 'Breakfast classic',
            method: 'pan-fry',
            instructions: [
                'Pour 1/2 cup milk into a shallow bowl',
                'Add a pinch of salt and whisk the milk',
                'Dip each slice of bread into the milk, letting it soak for 10 seconds per side',
                'Heat butter or oil in a non-stick pan over medium heat',
                'Place soaked bread slices in the hot pan',
                'Cook for 2-3 minutes until golden brown on the bottom',
                'Flip and cook another 2-3 minutes until golden on both sides',
                'Serve hot with honey, syrup, or fresh fruit'
            ],
            tips: 'Use slightly stale bread for better absorption. Add a beaten egg to the milk for richer French toast!'
        },
        'onion,potato': {
            name: 'Crispy Hash Browns with Onions',
            style: 'American comfort',
            method: 'pan-fry',
            instructions: [
                'Peel and grate 3 medium potatoes using a box grater',
                'Dice 1 medium onion into small pieces',
                'Squeeze grated potatoes in a clean kitchen towel to remove excess moisture',
                'Heat 3 tablespoons oil in a large skillet over medium-high heat',
                'Add diced onions and cook for 3-4 minutes until softened',
                'Add grated potatoes and spread evenly in the pan',
                'Cook without stirring for 5-6 minutes until bottom is golden',
                'Flip in sections and cook another 4-5 minutes until crispy',
                'Season with salt and pepper, serve immediately'
            ],
            tips: 'Removing moisture from potatoes is key for crispiness. Press down with spatula while cooking!'
        },
        'potato,onion': {
            name: 'Crispy Hash Browns with Onions',
            style: 'American comfort',
            method: 'pan-fry',
            instructions: [
                'Peel and grate 3 medium potatoes using a box grater',
                'Dice 1 medium onion into small pieces',
                'Squeeze grated potatoes in a clean kitchen towel to remove excess moisture',
                'Heat 3 tablespoons oil in a large skillet over medium-high heat',
                'Add diced onions and cook for 3-4 minutes until softened',
                'Add grated potatoes and spread evenly in the pan',
                'Cook without stirring for 5-6 minutes until bottom is golden',
                'Flip in sections and cook another 4-5 minutes until crispy',
                'Season with salt and pepper, serve immediately'
            ],
            tips: 'Removing moisture from potatoes is key for crispiness. Press down with spatula while cooking!'
        },
        'garlic,butter': {
            name: 'Perfect Garlic Butter',
            style: 'Condiment/sauce',
            method: 'melt-and-mix',
            instructions: [
                'Peel and finely mince 4-5 garlic cloves',
                'Let butter (4 tablespoons) come to room temperature',
                'Heat a small pan over low heat',
                'Add minced garlic and cook gently for 1-2 minutes until fragrant',
                'Remove from heat and let cool slightly',
                'Mix the cooked garlic into the soft butter',
                'Add a pinch of salt and mix well',
                'Use immediately or refrigerate for later use'
            ],
            tips: 'Don\'t let garlic brown or it will taste bitter. This is perfect for bread, vegetables, or pasta!'
        },
        'butter,garlic': {
            name: 'Perfect Garlic Butter',
            style: 'Condiment/sauce',
            method: 'melt-and-mix',
            instructions: [
                'Peel and finely mince 4-5 garlic cloves',
                'Let butter (4 tablespoons) come to room temperature',
                'Heat a small pan over low heat',
                'Add minced garlic and cook gently for 1-2 minutes until fragrant',
                'Remove from heat and let cool slightly',
                'Mix the cooked garlic into the soft butter',
                'Add a pinch of salt and mix well',
                'Use immediately or refrigerate for later use'
            ],
            tips: 'Don\'t let garlic brown or it will taste bitter. This is perfect for bread, vegetables, or pasta!'
        },

        'broccoli,cheese': {
            name: 'Cheesy Broccoli Bake',
            style: 'Comfort food',
            method: 'steam-and-bake',
            instructions: [
                'Cut 1 large head of broccoli into bite-sized florets',
                'Steam broccoli for 4-5 minutes until bright green and tender-crisp',
                'Preheat oven to 375°F (190°C)',
                'Place steamed broccoli in a greased baking dish',
                'Grate cheese and sprinkle generously over broccoli',
                'Add a pinch of salt, pepper, and garlic powder',
                'Bake for 15-20 minutes until cheese is melted and bubbly',
                'Serve hot as a side dish or light meal'
            ],
            tips: 'Don\'t overcook the broccoli - it should still have a slight crunch!'
        },
        'cheese,broccoli': {
            name: 'Cheesy Broccoli Bake',
            style: 'Comfort food',
            method: 'steam-and-bake',
            instructions: [
                'Cut 1 large head of broccoli into bite-sized florets',
                'Steam broccoli for 4-5 minutes until bright green and tender-crisp',
                'Preheat oven to 375°F (190°C)',
                'Place steamed broccoli in a greased baking dish',
                'Grate cheese and sprinkle generously over broccoli',
                'Add a pinch of salt, pepper, and garlic powder',
                'Bake for 15-20 minutes until cheese is melted and bubbly',
                'Serve hot as a side dish or light meal'
            ],
            tips: 'Don\'t overcook the broccoli - it should still have a slight crunch!'
        },
        'mushroom,garlic': {
            name: 'Garlic Sautéed Mushrooms',
            style: 'European classic',
            method: 'sauté',
            instructions: [
                'Clean and slice 300g mushrooms (button or cremini work well)',
                'Peel and finely mince 4-5 garlic cloves',
                'Heat 2 tablespoons olive oil in a large pan over medium-high heat',
                'Add sliced mushrooms and cook for 5-6 minutes without stirring',
                'Stir mushrooms and cook another 3-4 minutes until golden',
                'Add minced garlic and cook for 1-2 minutes until fragrant',
                'Season with salt, pepper, and fresh herbs if available',
                'Serve immediately while hot and aromatic'
            ],
            tips: 'Don\'t overcrowd the pan - cook mushrooms in batches if needed for better browning!'
        },
        'garlic,mushroom': {
            name: 'Garlic Sautéed Mushrooms',
            style: 'European classic',
            method: 'sauté',
            instructions: [
                'Clean and slice 300g mushrooms (button or cremini work well)',
                'Peel and finely mince 4-5 garlic cloves',
                'Heat 2 tablespoons olive oil in a large pan over medium-high heat',
                'Add sliced mushrooms and cook for 5-6 minutes without stirring',
                'Stir mushrooms and cook another 3-4 minutes until golden',
                'Add minced garlic and cook for 1-2 minutes until fragrant',
                'Season with salt, pepper, and fresh herbs if available',
                'Serve immediately while hot and aromatic'
            ],
            tips: 'Don\'t overcrowd the pan - cook mushrooms in batches if needed for better browning!'
        },
        'spinach,eggs': {
            name: 'Spinach and Egg Scramble',
            style: 'Healthy breakfast',
            method: 'sauté-and-scramble',
            instructions: [
                'Wash 2 cups fresh spinach leaves thoroughly',
                'Beat 3 eggs in a bowl with salt and pepper',
                'Heat 1 tablespoon oil in a non-stick pan over medium heat',
                'Add spinach and cook for 2-3 minutes until wilted',
                'Pour beaten eggs over the spinach',
                'Gently scramble everything together for 2-3 minutes',
                'Cook until eggs are just set but still creamy',
                'Serve immediately with toast or on its own'
            ],
            tips: 'Fresh spinach wilts quickly - don\'t overcook it or it will become mushy!'
        },
        'eggs,spinach': {
            name: 'Spinach and Egg Scramble',
            style: 'Healthy breakfast',
            method: 'sauté-and-scramble',
            instructions: [
                'Wash 2 cups fresh spinach leaves thoroughly',
                'Beat 3 eggs in a bowl with salt and pepper',
                'Heat 1 tablespoon oil in a non-stick pan over medium heat',
                'Add spinach and cook for 2-3 minutes until wilted',
                'Pour beaten eggs over the spinach',
                'Gently scramble everything together for 2-3 minutes',
                'Cook until eggs are just set but still creamy',
                'Serve immediately with toast or on its own'
            ],
            tips: 'Fresh spinach wilts quickly - don\'t overcook it or it will become mushy!'
        },
        'shrimp,garlic': {
            name: 'Garlic Butter Shrimp',
            style: 'Mediterranean',
            method: 'sauté',
            instructions: [
                'Peel and devein 1 pound of shrimp, pat dry',
                'Mince 4-5 garlic cloves finely',
                'Heat 2 tablespoons butter in a large skillet over medium-high heat',
                'Add minced garlic and cook for 30 seconds until fragrant',
                'Add shrimp in a single layer, don\'t overcrowd',
                'Cook for 2-3 minutes until pink on one side',
                'Flip shrimp and cook another 1-2 minutes',
                'Season with salt, pepper, and fresh herbs if available'
            ],
            tips: 'Don\'t overcook shrimp - they become rubbery! They\'re done when pink and curled.'
        },
        'salmon,lemon': {
            name: 'Lemon Herb Salmon',
            style: 'Healthy gourmet',
            method: 'bake',
            instructions: [
                'Preheat oven to 400°F (200°C)',
                'Place salmon fillets on a lined baking sheet',
                'Drizzle with olive oil and season with salt and pepper',
                'Slice lemon into thin rounds and place on top of salmon',
                'Bake for 12-15 minutes depending on thickness',
                'Fish is done when it flakes easily with a fork',
                'Squeeze fresh lemon juice over cooked salmon',
                'Serve immediately with your favorite sides'
            ],
            tips: 'Don\'t overbake salmon - it should be moist and flaky, not dry!'
        },
        'pasta,parmesan': {
            name: 'Simple Parmesan Pasta',
            style: 'Italian classic',
            method: 'boil-and-toss',
            instructions: [
                'Bring a large pot of salted water to boil',
                'Cook pasta according to package directions until al dente',
                'Reserve 1/2 cup pasta cooking water before draining',
                'Drain pasta and return to pot',
                'Add a splash of pasta water and toss',
                'Add freshly grated Parmesan cheese generously',
                'Toss until cheese melts and coats the pasta',
                'Add more pasta water if needed for creaminess'
            ],
            tips: 'Use freshly grated Parmesan for the best flavor and texture!'
        },
        'tortilla,cheese': {
            name: 'Quick Cheese Quesadilla',
            style: 'Mexican comfort',
            method: 'pan-fry',
            instructions: [
                'Heat a large skillet or griddle over medium heat',
                'Place one tortilla in the pan',
                'Sprinkle grated cheese evenly over half the tortilla',
                'Fold the tortilla in half to cover the cheese',
                'Cook for 2-3 minutes until bottom is golden brown',
                'Flip carefully and cook another 2-3 minutes',
                'Remove from heat when cheese is melted',
                'Cut into wedges and serve immediately'
            ],
            tips: 'Keep heat at medium to avoid burning the tortilla before cheese melts!'
        }
    };
    
    // Try to find exact combination
    const key1 = `${ing1},${ing2}`;
    const key2 = `${ing2},${ing1}`;
    let recipe = combinations[key1] || combinations[key2];
    
    // If no specific combination, create a fusion recipe
    if (!recipe) {
        recipe = createFusionRecipe(ingredients);
    }
    
    return {
        name: recipe.name,
        cookingTime: calculateCookingTime(ingredients),
        servings: 2,
        difficulty: 'Easy',
        ingredients: generateIngredientsList(ingredients),
        instructions: recipe.instructions,
        tips: recipe.tips || generateTwoIngredientTips(ingredients)
    };
}

// Create fusion recipe for unique combinations
function createFusionRecipe(ingredients) {
    const [ing1, ing2] = ingredients;
    
    // Smart recipe creation based on ingredient types
    const recipe = createSmartRecipe(ing1, ing2);
    
    return {
        name: recipe.name,
        instructions: recipe.instructions,
        tips: recipe.tips
    };
}

// Create smart recipes based on ingredient analysis
function createSmartRecipe(ing1, ing2) {
    const proteins = ['chicken', 'beef', 'fish', 'eggs', 'tofu', 'beans', 'pork', 'turkey', 'lamb', 'shrimp', 'salmon', 'tuna', 'lentils', 'nuts', 'duck', 'crab', 'lobster', 'scallops', 'bacon', 'sausage', 'ham', 'chickpeas', 'quinoa'];
    const vegetables = ['tomato', 'onion', 'carrot', 'bell pepper', 'cucumber', 'broccoli', 'spinach', 'mushroom', 'zucchini', 'eggplant', 'cauliflower', 'cabbage', 'lettuce', 'corn', 'peas', 'garlic', 'ginger', 'celery', 'radish', 'beetroot', 'asparagus', 'green beans', 'sweet potato', 'leek', 'turnip', 'parsnip'];
    const grains = ['rice', 'pasta', 'quinoa', 'oats', 'bread', 'noodles', 'barley', 'couscous', 'bulgur', 'tortilla', 'crackers', 'cereal', 'flour', 'rye bread', 'bagel', 'pita bread', 'brown rice', 'wild rice', 'millet', 'buckwheat', 'cornmeal', 'polenta'];
    const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'parmesan', 'cheddar', 'ice cream', 'goat cheese', 'feta cheese', 'blue cheese', 'ricotta', 'mascarpone', 'heavy cream', 'buttermilk', 'greek yogurt', 'whipped cream'];
    
    const ing1Lower = ing1.toLowerCase();
    const ing2Lower = ing2.toLowerCase();
    
    // Protein + Vegetable combinations
    if (proteins.includes(ing1Lower) && vegetables.includes(ing2Lower)) {
        return {
            name: `${capitalizeFirst(ing1)} and ${capitalizeFirst(ing2)} Skillet`,
            instructions: [
                `Cut ${ing1} into bite-sized pieces and season with salt and pepper`,
                `Prepare ${ing2} by washing and chopping into appropriate pieces`,
                'Heat 2 tablespoons oil in a large skillet over medium-high heat',
                `Add ${ing1} and cook for 4-5 minutes until browned`,
                `Add ${ing2} and cook for 3-4 minutes until tender`,
                'Season with your favorite herbs and spices',
                'Cook for 2 more minutes until flavors combine',
                'Serve hot with rice or bread if desired'
            ],
            tips: `${capitalizeFirst(ing1)} pairs beautifully with ${ing2} - try adding garlic or herbs for extra flavor!`
        };
    }
    
    // Grain + Dairy combinations
    if (grains.includes(ing1Lower) && dairy.includes(ing2Lower)) {
        return {
            name: `Creamy ${capitalizeFirst(ing1)} with ${capitalizeFirst(ing2)}`,
            instructions: [
                `Cook ${ing1} according to package directions until tender`,
                `While ${ing1} cooks, prepare ${ing2} by bringing to room temperature`,
                `Drain ${ing1} and return to pot over low heat`,
                `Add ${ing2} gradually while stirring to create a creamy texture`,
                'Season with salt, pepper, and herbs to taste',
                'Cook for 2-3 minutes until well combined',
                'Adjust consistency with a little water if needed',
                'Serve immediately while warm and creamy'
            ],
            tips: `This combination creates a comforting, creamy dish perfect for any meal!`
        };
    }
    

    
    // Default creative combination
    return {
        name: `Creative ${capitalizeFirst(ing1)} and ${capitalizeFirst(ing2)} Medley`,
        instructions: [
            `Prepare both ${ing1} and ${ing2} by washing and cutting appropriately`,
            'Heat a pan with a little oil over medium heat',
            `Add the ingredient that takes longer to cook first (usually ${ing1})`,
            'Cook for 3-4 minutes, stirring occasionally',
            `Add ${ing2} and continue cooking for 3-4 minutes`,
            'Season with salt, pepper, and your favorite spices',
            'Cook until both ingredients are tender and well combined',
            'Taste and adjust seasoning before serving'
        ],
        tips: `This unique combination of ${ing1} and ${ing2} creates an interesting flavor profile - be creative with seasonings!`
    };
}

// Generate detailed fusion instructions
function generateFusionInstructions(ing1, ing2, method) {
    const baseInstructions = {
        'stir-fry': [
            `Prepare ${ing1} and ${ing2} by washing and cutting into uniform pieces`,
            'Heat 2 tablespoons oil in a wok or large pan over high heat',
            `Add ${ing1} first and stir-fry for 2-3 minutes`,
            `Add ${ing2} and continue stir-frying for another 2-3 minutes`,
            'Season with salt, pepper, and your choice of spices',
            'Stir everything together and cook for 1 more minute',
            'Serve immediately while hot and crispy'
        ],
        'sauté': [
            `Clean and prepare ${ing1} and ${ing2}, cutting into bite-sized pieces`,
            'Heat olive oil in a large skillet over medium heat',
            `Add ${ing1} and cook for 3-4 minutes until starting to soften`,
            `Add ${ing2} and continue cooking for 4-5 minutes`,
            'Season with salt, pepper, and herbs of your choice',
            'Cook until both ingredients are tender and well combined',
            'Taste and adjust seasoning before serving'
        ],
        'roasted': [
            'Preheat oven to 400°F (200°C)',
            `Prepare ${ing1} and ${ing2} by cutting into similar-sized pieces`,
            'Toss both ingredients with olive oil, salt, and pepper',
            'Arrange on a baking sheet in a single layer',
            'Roast for 20-25 minutes, stirring once halfway through',
            'Cook until both ingredients are golden and tender',
            'Serve hot with a squeeze of lemon if desired'
        ],
        'steamed': [
            `Prepare ${ing1} and ${ing2} by cleaning and cutting appropriately`,
            'Set up a steamer basket over boiling water',
            `Place ${ing1} in the steamer first if it needs longer cooking`,
            `Add ${ing2} after 3-4 minutes`,
            'Steam for 8-12 minutes until both are tender',
            'Season with salt, pepper, and a drizzle of olive oil',
            'Serve immediately while warm'
        ],
        'grilled': [
            'Preheat grill or grill pan to medium-high heat',
            `Prepare ${ing1} and ${ing2}, cutting into grill-friendly pieces`,
            'Brush both ingredients with oil and season with salt and pepper',
            `Grill ${ing1} for 4-5 minutes per side`,
            `Add ${ing2} and grill for 3-4 minutes per side`,
            'Cook until both have nice grill marks and are tender',
            'Serve hot with fresh herbs or a squeeze of citrus'
        ]
    };
    
    return baseInstructions[method] || baseInstructions['sauté'];
}

// Generate specific tips for two-ingredient recipes
function generateTwoIngredientTips(ingredients) {
    const [ing1, ing2] = ingredients.map(ing => ing.toLowerCase());
    
    const specificTips = {
        'tomato': 'Remove seeds from tomatoes to prevent excess moisture in your dish.',
        'eggs': 'Cook eggs on medium-low heat for the creamiest texture.',
        'potato': 'Soak cut potatoes in cold water for 30 minutes for crispier results.',
        'cheese': 'Add cheese at the end of cooking to prevent it from becoming stringy.',
        'chicken': 'Let chicken rest for 5 minutes after cooking for juicier meat.',
        'rice': 'Rinse rice until water runs clear for fluffier grains.',
        'banana': 'Use very ripe bananas for natural sweetness.',
        'oats': 'Let oats sit for a few minutes to absorb liquid and soften.'
    };
    
    const tips = [];
    ingredients.forEach(ing => {
        if (specificTips[ing]) {
            tips.push(specificTips[ing]);
        }
    });
    
    if (tips.length > 0) {
        return tips[Math.floor(Math.random() * tips.length)];
    }
    
    return `Perfect pairing! ${capitalizeFirst(ing1)} and ${capitalizeFirst(ing2)} complement each other beautifully.`;
}

// Generate simple recipe (3-4 ingredients)
function generateSimpleRecipe(ingredients) {
    const recipeName = generateCreativeRecipeName(ingredients);
    const cookingStyle = getOptimalCookingStyle(ingredients);
    
    return {
        name: recipeName,
        cookingTime: calculateCookingTime(ingredients),
        servings: 2,
        difficulty: getDifficulty(ingredients),
        ingredients: generateIngredientsList(ingredients),
        instructions: generateSmartInstructions(ingredients, cookingStyle),
        tips: generateAdvancedTips(ingredients)
    };
}

// Generate complex recipe (5+ ingredients)
function generateComplexRecipe(ingredients) {
    const recipeName = generateGourmetRecipeName(ingredients);
    const cookingStyle = getAdvancedCookingStyle(ingredients);
    
    return {
        name: recipeName,
        cookingTime: calculateCookingTime(ingredients) + 10, // More complex = more time
        servings: 3,
        difficulty: 'Advanced',
        ingredients: generateDetailedIngredientsList(ingredients),
        instructions: generateComplexInstructions(ingredients, cookingStyle),
        tips: generateProfessionalTips(ingredients)
    };
}

// Generate creative recipe names based on ingredients
function generateCreativeRecipeName(ingredients) {
    const adjectives = ['Rustic', 'Garden Fresh', 'Homestyle', 'Savory', 'Golden', 'Herb-Crusted', 'Caramelized'];
    const styles = ['Medley', 'Harmony', 'Fusion', 'Delight', 'Symphony', 'Creation', 'Masterpiece'];
    
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const mainIngredient = ingredients[0] || 'Mixed';
    
    return `${randomAdj} ${capitalizeFirst(mainIngredient)} ${randomStyle}`;
}

// Generate gourmet names for complex recipes
function generateGourmetRecipeName(ingredients) {
    const gourmetAdj = ['Artisanal', 'Chef\'s Special', 'Gourmet', 'Signature', 'Premium', 'Elevated'];
    const techniques = ['Seared', 'Braised', 'Roasted', 'Glazed', 'Infused', 'Layered'];
    
    const adj = gourmetAdj[Math.floor(Math.random() * gourmetAdj.length)];
    const technique = techniques[Math.floor(Math.random() * techniques.length)];
    const mainIngredient = ingredients[0] || 'Mixed';
    
    return `${adj} ${technique} ${capitalizeFirst(mainIngredient)} Ensemble`;
}

// Get optimal cooking style based on ingredients
function getOptimalCookingStyle(ingredients) {
    const proteins = ['chicken', 'beef', 'fish', 'eggs', 'tofu'];
    const vegetables = ['tomato', 'onion', 'carrot', 'bell pepper', 'potato'];
    const grains = ['rice', 'pasta', 'quinoa', 'oats'];
    
    const hasProtein = ingredients.some(ing => proteins.includes(ing.toLowerCase()));
    const hasVegetables = ingredients.some(ing => vegetables.includes(ing.toLowerCase()));
    const hasGrains = ingredients.some(ing => grains.includes(ing.toLowerCase()));
    
    if (hasProtein && hasVegetables && hasGrains) return 'one-pot';
    if (hasProtein && hasVegetables) return 'stir-fry';
    if (hasVegetables && hasGrains) return 'pilaf';
    if (hasProtein) return 'seared';
    return 'sauté';
}

// Get advanced cooking style for complex recipes
function getAdvancedCookingStyle(ingredients) {
    const styles = ['layered-bake', 'reduction-glaze', 'herb-crust', 'wine-braised', 'multi-stage'];
    return styles[Math.floor(Math.random() * styles.length)];
}

// Generate smart instructions based on cooking style
function generateSmartInstructions(ingredients, style) {
    const baseInstructions = {
        'one-pot': [
            'Heat oil in a large, heavy-bottomed pot over medium heat',
            'Add aromatics (onion, garlic) first and cook until fragrant',
            'Add protein and brown on all sides',
            'Add vegetables in order of cooking time needed',
            'Add grains and liquid, bring to a boil',
            'Reduce heat, cover, and simmer until tender',
            'Let rest 5 minutes, then season and serve'
        ],
        'stir-fry': [
            'Prepare all ingredients before starting (mise en place)',
            'Heat wok or large pan over high heat until smoking',
            'Add oil and swirl to coat',
            'Add protein first, cook until almost done',
            'Add hard vegetables, stir-fry for 2-3 minutes',
            'Add soft vegetables, stir-fry for 1-2 minutes',
            'Season with salt, pepper, and aromatics',
            'Serve immediately while hot'
        ],
        'seared': [
            'Pat protein dry and season generously',
            'Heat oil in a heavy pan over medium-high heat',
            'Sear protein without moving for 3-4 minutes',
            'Flip and sear other side until golden',
            'Add vegetables around the protein',
            'Cook until vegetables are tender',
            'Deglaze pan with liquid if desired',
            'Rest protein before serving'
        ]
    };
    
    return baseInstructions[style] || generateInstructions(ingredients);
}

// Generate complex instructions for advanced recipes
function generateComplexInstructions(ingredients, style) {
    const complexStyles = {
        'layered-bake': [
            'Preheat oven to 375°F (190°C)',
            'Prepare each ingredient separately with different seasonings',
            'Layer ingredients in a baking dish, alternating for best flavor',
            'Create a sauce or glaze to bind the layers',
            'Cover with foil and bake for 30 minutes',
            'Remove foil and bake 15 more minutes until golden',
            'Let rest 10 minutes before serving'
        ],
        'reduction-glaze': [
            'Prepare a flavorful reduction by simmering liquids',
            'Season and sear main ingredients separately',
            'Combine ingredients in stages based on cooking times',
            'Add the reduction and let it coat the ingredients',
            'Finish with fresh herbs and a touch of acid',
            'Plate artfully and drizzle with remaining glaze'
        ]
    };
    
    return complexStyles[style] || generateSmartInstructions(ingredients, 'one-pot');
}

// Generate detailed ingredients list for complex recipes
function generateDetailedIngredientsList(ingredients) {
    const detailed = generateIngredientsList(ingredients);
    // Add gourmet touches
    detailed.push('2 tbsp high-quality olive oil');
    detailed.push('Fresh herbs (thyme, rosemary, or parsley)');
    detailed.push('Sea salt and freshly cracked black pepper');
    detailed.push('1 tbsp butter for finishing');
    
    return detailed;
}

// Generate advanced tips
function generateAdvancedTips(ingredients) {
    const tips = [
        'Let ingredients come to room temperature before cooking for even results.',
        'Taste and adjust seasoning at each step of the cooking process.',
        'Use the fond (browned bits) in your pan to build deeper flavors.',
        'Fresh herbs added at the end brighten the entire dish.'
    ];
    
    // Add ingredient-specific tips
    if (ingredients.includes('garlic')) {
        tips.push('Crush garlic with the flat side of your knife to release more flavor.');
    }
    
    if (ingredients.some(ing => ['chicken', 'beef', 'fish'].includes(ing.toLowerCase()))) {
        tips.push('Use a meat thermometer to ensure perfect doneness every time.');
    }
    
    return tips[Math.floor(Math.random() * tips.length)];
}

// Generate professional tips for complex recipes
function generateProfessionalTips(ingredients) {
    const proTips = [
        'Mise en place (prepare everything first) is crucial for complex recipes.',
        'Control your heat - high heat for searing, medium for building flavors.',
        'Layer your seasonings throughout the cooking process, not just at the end.',
        'Let proteins rest after cooking to redistribute juices for maximum tenderness.',
        'Finish dishes with a touch of acid (lemon, vinegar) to brighten flavors.'
    ];
    
    return proTips[Math.floor(Math.random() * proTips.length)];
}

// Calculate estimated cooking time
function calculateCookingTime(ingredients) {
    const timeMap = {
        'chicken': 25, 'beef': 30, 'fish': 15, 'eggs': 10,
        'rice': 20, 'pasta': 15, 'potato': 25, 'beans': 30
    };
    
    let maxTime = 15; // minimum time
    ingredients.forEach(ingredient => {
        const time = timeMap[ingredient.toLowerCase()] || 10;
        maxTime = Math.max(maxTime, time);
    });
    
    return maxTime + 5; // add prep time
}

// Determine recipe difficulty
function getDifficulty(ingredients) {
    if (ingredients.length <= 3) return 'Easy';
    if (ingredients.length <= 5) return 'Medium';
    return 'Advanced';
}

// Generate ingredients list with quantities
function generateIngredientsList(ingredients) {
    const quantities = {
        'chicken': '2 pieces (300g)',
        'beef': '250g, sliced',
        'fish': '2 fillets (200g)',
        'eggs': '3 large eggs',
        'rice': '1 cup',
        'pasta': '200g',
        'potato': '2 medium potatoes',
        'tomato': '2 medium tomatoes',
        'onion': '1 medium onion',
        'garlic': '3 cloves',
        'carrot': '1 large carrot',
        'bell pepper': '1 bell pepper',
        'cucumber': '1 cucumber',
        'grapes': '1 cup',
        'mango': '1 ripe mango',
        'apple': '2 apples',
        'banana': '2 bananas',
        'orange': '2 oranges',
        'lemon': '1 lemon',
        'tofu': '200g block',
        'beans': '1 can (400g)',
        'quinoa': '1 cup',
        'oats': '1/2 cup',
        'noodles': '200g',
        'milk': '1 cup',
        'cheese': '100g',
        'yogurt': '1/2 cup',
        'butter': '2 tablespoons',
        'ginger': '1 inch piece',
        'bread': '4 slices'
    };
    
    return ingredients.map(ingredient => {
        const quantity = quantities[ingredient.toLowerCase()] || '1 portion';
        return `${quantity} ${ingredient}`;
    });
}

// Generate cooking instructions
function generateInstructions(ingredients) {
    const instructions = [];
    
    // Prep step
    instructions.push('Wash and prepare all ingredients. Chop vegetables into bite-sized pieces.');
    
    // Cooking steps based on ingredients
    if (ingredients.some(ing => ['chicken', 'beef', 'fish'].includes(ing.toLowerCase()))) {
        instructions.push('Heat oil in a large pan over medium-high heat.');
        instructions.push('Cook the protein until golden brown and cooked through.');
    }
    
    if (ingredients.some(ing => ['onion', 'garlic'].includes(ing.toLowerCase()))) {
        instructions.push('Add onions and garlic, cook until fragrant (about 2 minutes).');
    }
    
    if (ingredients.some(ing => ['tomato', 'bell pepper', 'carrot'].includes(ing.toLowerCase()))) {
        instructions.push('Add vegetables and cook until tender, stirring occasionally.');
    }
    
    if (ingredients.some(ing => ['rice', 'pasta', 'quinoa'].includes(ing.toLowerCase()))) {
        instructions.push('Cook grains according to package instructions in a separate pot.');
    }
    
    // Final steps
    instructions.push('Season with salt, pepper, and your favorite herbs.');
    instructions.push('Combine all ingredients and cook for 2-3 more minutes.');
    instructions.push('Taste and adjust seasoning. Serve hot and enjoy!');
    
    return instructions;
}

// Generate cooking tips
function generateTips(ingredients) {
    const tips = [
        'Always taste your food as you cook and adjust seasoning accordingly.',
        'Prep all ingredients before you start cooking for a smoother process.',
        'Don\'t overcrowd the pan - cook in batches if necessary.'
    ];
    
    // Add specific tips based on ingredients
    if (ingredients.includes('garlic')) {
        tips.push('Don\'t let garlic burn - it becomes bitter. Add it after onions.');
    }
    
    if (ingredients.some(ing => ['chicken', 'beef', 'fish'].includes(ing.toLowerCase()))) {
        tips.push('Let meat rest for a few minutes after cooking for better texture.');
    }
    
    if (ingredients.includes('rice')) {
        tips.push('Rinse rice before cooking to remove excess starch for fluffier results.');
    }
    
    return tips[Math.floor(Math.random() * tips.length)];
}

// Display the generated recipe
function displayRecipe(recipe) {
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('recipe-result');
    
    // Hide loading and show result
    loadingElement.style.display = 'none';
    resultElement.style.display = 'block';
    
    // Populate recipe details
    document.getElementById('recipe-title').textContent = recipe.name;
    document.getElementById('recipe-time').textContent = `⏱️ ${recipe.cookingTime} mins`;
    document.getElementById('recipe-servings').textContent = `👥 ${recipe.servings} servings`;
    document.getElementById('recipe-difficulty').textContent = `📊 ${recipe.difficulty}`;
    
    // Populate ingredients
    const ingredientsList = document.getElementById('recipe-ingredients');
    ingredientsList.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = ingredient;
        ingredientsList.appendChild(li);
    });
    
    // Populate instructions
    const instructionsList = document.getElementById('recipe-instructions');
    instructionsList.innerHTML = '';
    recipe.instructions.forEach(instruction => {
        const li = document.createElement('li');
        li.textContent = instruction;
        instructionsList.appendChild(li);
    });
    
    // Populate tips
    document.getElementById('recipe-tips').textContent = recipe.tips;
}

// Show fallback recipe when AI fails
function showFallbackRecipe() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const fallbackElement = document.getElementById('fallback-recipe');
    
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    
    // Create a simple fallback recipe
    const fallbackRecipe = createSimpleFallback(selectedIngredients);
    fallbackElement.innerHTML = `
        <h4>${fallbackRecipe.name}</h4>
        <p><strong>Instructions:</strong> ${fallbackRecipe.instructions}</p>
        <p><strong>Tip:</strong> ${fallbackRecipe.tip}</p>
    `;
}

// Create simple fallback recipe
function createSimpleFallback(ingredients) {
    const mainIngredient = ingredients[0] || 'ingredients';
    
    return {
        name: `Simple ${capitalizeFirst(mainIngredient)} Dish`,
        instructions: `Combine ${ingredients.join(', ')} in a pan with some oil, salt, and pepper. Cook over medium heat for 10-15 minutes, stirring occasionally, until everything is cooked through and well combined.`,
        tip: 'This is a basic preparation. Feel free to add your favorite spices and seasonings!'
    };
}

// Generate a new recipe with same ingredients
function generateNewRecipe() {
    generateRecipe();
}

// Start over - go back to page 1 and reset
function startOver() {
    selectedIngredients = [];
    
    // Reset all ingredient selections
    document.querySelectorAll('.ingredient-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Reset displays
    updateSelectedDisplay();
    
    // Go to page 1
    goToPage(1);
}

// Utility function to capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Camera functionality
let currentStream = null;
let currentFacingMode = 'environment'; // Start with back camera
let detectedIngredients = [];

// Open camera page
async function openCamera() {
    goToPage(3);
    
    // Update status
    updateCameraStatus('Initializing camera...');
    
    // Check available cameras first
    await checkAvailableCameras();
    
    // Start with back camera
    currentFacingMode = 'environment';
    updateCameraStatus('Starting back camera...');
    await startCamera();
}

// Check available cameras
async function checkAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available cameras:', videoDevices.length);
        videoDevices.forEach((device, index) => {
            console.log(`Camera ${index + 1}:`, device.label || `Camera ${index + 1}`);
        });
        
        // If no back camera available, start with front
        const hasBackCamera = videoDevices.some(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
        );
        
        if (!hasBackCamera && videoDevices.length > 0) {
            console.log('No back camera detected, will use available camera');
        }
        
    } catch (error) {
        console.error('Error checking cameras:', error);
    }
}

// Start camera
async function startCamera() {
    try {
        // Stop existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Try different constraint approaches for better camera support
        let constraints;
        
        if (currentFacingMode === 'environment') {
            // Back camera - try multiple approaches
            constraints = {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
        } else {
            // Front camera
            constraints = {
                video: {
                    facingMode: { exact: 'user' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
        }

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (exactError) {
            console.log('Exact facingMode failed, trying ideal:', exactError);
            // Fallback to ideal instead of exact
            constraints.video.facingMode = currentFacingMode;
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        const video = document.getElementById('cameraVideo');
        video.srcObject = currentStream;
        
        // Update button text to show current camera
        updateCameraButtonText();
        
        // Update camera status
        updateCameraStatus('Camera ready - ' + (currentFacingMode === 'environment' ? 'Back camera' : 'Front camera'));
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        
        // Try basic constraints as final fallback
        try {
            const basicConstraints = { video: true };
            currentStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
            const video = document.getElementById('cameraVideo');
            video.srcObject = currentStream;
            console.log('Using basic camera constraints');
        } catch (basicError) {
            updateCameraStatus('Camera access failed - Check permissions');
            alert('Unable to access camera. Please make sure you have granted camera permissions and your device has a camera.');
        }
    }
}

// Switch between front and back camera
async function switchCamera() {
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    console.log('Switching to:', currentFacingMode);
    await startCamera();
}

// Update camera button text to show current camera
function updateCameraButtonText() {
    const switchBtn = document.querySelector('.switch-camera-btn');
    if (switchBtn) {
        if (currentFacingMode === 'environment') {
            switchBtn.innerHTML = '🔄 Switch to Front';
        } else {
            switchBtn.innerHTML = '🔄 Switch to Back';
        }
    }
}

// Update camera status display
function updateCameraStatus(message) {
    const statusElement = document.getElementById('cameraStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// Capture photo and detect ingredients
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate ingredient detection (in real app, this would use AI/ML)
    detectIngredientsFromImage();
}

// Enhanced ingredient detection using color and shape analysis
function detectIngredientsFromImage() {
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    // Get image data for analysis
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Analyze colors in the image
    const colorAnalysis = analyzeImageColors(data);
    
    // Detect ingredients based on color patterns and dominant colors
    const detected = detectIngredientsByColor(colorAnalysis);
    
    detectedIngredients = detected;
    displayDetectedIngredients();
    displayColorAnalysis(colorAnalysis);
    
    // Provide audio feedback about detected ingredients
    if (detected.length > 0) {
        const ingredientList = detected.join(', ');
        speakText(`I detected ${ingredientList}. Does this look correct?`);
    } else {
        speakText("I couldn't detect any ingredients. Please try again with better lighting and clearer view of the ingredient.");
    }
    
    // Provide feedback about what colors were detected
    console.log('Detected colors:', colorAnalysis);
    console.log('Detected ingredients:', detected);
}

// Analyze dominant colors in the image
function analyzeImageColors(imageData) {
    const colorCounts = {};
    const totalPixels = imageData.length / 4;
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < imageData.length; i += 40) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const alpha = imageData[i + 3];
        
        // Skip transparent pixels
        if (alpha < 128) continue;
        
        // Categorize colors
        const colorCategory = categorizeColor(r, g, b);
        colorCounts[colorCategory] = (colorCounts[colorCategory] || 0) + 1;
    }
    
    // Calculate percentages
    const colorPercentages = {};
    for (const color in colorCounts) {
        colorPercentages[color] = (colorCounts[color] / (totalPixels / 10)) * 100;
    }
    
    return colorPercentages;
}

// Categorize RGB values into color groups
function categorizeColor(r, g, b) {
    // Define color ranges for common ingredient colors
    
    // Orange (carrots, oranges, sweet potatoes)
    if (r > 200 && g > 100 && g < 180 && b < 100) {
        return 'orange';
    }
    
    // Red (tomatoes, red peppers, strawberries)
    if (r > 150 && g < 100 && b < 100) {
        return 'red';
    }
    
    // Green (lettuce, broccoli, cucumbers, peppers)
    if (g > r && g > b && g > 100) {
        return 'green';
    }
    
    // Yellow (bananas, corn, yellow peppers)
    if (r > 200 && g > 200 && b < 150) {
        return 'yellow';
    }
    
    // Purple/Dark (eggplant, purple cabbage)
    if (r > 100 && r < 150 && g < 100 && b > 100) {
        return 'purple';
    }
    
    // Brown (potatoes, mushrooms, onions)
    if (r > 100 && r < 180 && g > 80 && g < 150 && b > 50 && b < 120) {
        return 'brown';
    }
    
    // White/Light (onions, garlic, cauliflower)
    if (r > 200 && g > 200 && b > 200) {
        return 'white';
    }
    
    // Dark Green (spinach, dark leafy greens)
    if (g > 80 && g > r && g > b && r < 100 && b < 100) {
        return 'darkgreen';
    }
    
    // Pink/Light Red (radishes, light tomatoes)
    if (r > 180 && g > 120 && g < 180 && b > 120 && b < 180) {
        return 'pink';
    }
    
    return 'other';
}

// Detect ingredients based on color analysis
function detectIngredientsByColor(colorAnalysis) {
    const detected = [];
    const threshold = 5; // Minimum percentage to consider a color significant
    
    // Define ingredient mappings based on dominant colors
    const colorToIngredients = {
        'orange': ['carrot', 'sweet potato', 'orange'],
        'red': ['tomato', 'bell pepper', 'strawberry'],
        'green': ['cucumber', 'broccoli', 'lettuce', 'spinach', 'bell pepper'],
        'yellow': ['banana', 'corn', 'bell pepper', 'lemon'],
        'purple': ['eggplant', 'purple cabbage'],
        'brown': ['potato', 'mushroom', 'onion'],
        'white': ['onion', 'garlic', 'cauliflower'],
        'darkgreen': ['spinach', 'broccoli', 'kale'],
        'pink': ['radish', 'pink onion']
    };
    
    // Analyze each significant color
    for (const [color, percentage] of Object.entries(colorAnalysis)) {
        if (percentage > threshold && colorToIngredients[color]) {
            const possibleIngredients = colorToIngredients[color];
            
            // Select the most likely ingredient based on color intensity
            let selectedIngredient;
            if (percentage > 20) {
                // High percentage - pick the most common ingredient for this color
                selectedIngredient = possibleIngredients[0];
            } else if (percentage > 10) {
                // Medium percentage - pick a random ingredient from the color group
                selectedIngredient = possibleIngredients[Math.floor(Math.random() * Math.min(2, possibleIngredients.length))];
            } else {
                // Low percentage - pick any ingredient from the group
                selectedIngredient = possibleIngredients[Math.floor(Math.random() * possibleIngredients.length)];
            }
            
            if (!detected.includes(selectedIngredient)) {
                detected.push(selectedIngredient);
            }
        }
    }
    
    // If no ingredients detected, provide a fallback
    if (detected.length === 0) {
        // Analyze the most dominant color
        const dominantColor = Object.keys(colorAnalysis).reduce((a, b) => 
            colorAnalysis[a] > colorAnalysis[b] ? a : b
        );
        
        if (colorToIngredients[dominantColor]) {
            detected.push(colorToIngredients[dominantColor][0]);
        } else {
            // Ultimate fallback - common ingredients
            const commonIngredients = ['tomato', 'onion', 'carrot', 'potato'];
            detected.push(commonIngredients[Math.floor(Math.random() * commonIngredients.length)]);
        }
    }
    
    // Limit to maximum 3 ingredients for better accuracy
    return detected.slice(0, 3);
}

// Display detected ingredients
function displayDetectedIngredients() {
    const container = document.getElementById('detectedIngredients');
    const generateBtn = document.querySelector('.generate-recipe-btn');

    if (detectedIngredients.length === 0) {
        container.innerHTML = '<p class="detection-hint">No ingredients detected. Try taking another photo!</p>';
        generateBtn.disabled = true;
        return;
    }

    container.innerHTML = detectedIngredients.map(ingredient => 
        `<span class="detected-ingredient">${capitalizeFirst(ingredient)}</span>`
    ).join('');

    generateBtn.disabled = false;
}

// Display color analysis to help users understand detection
function displayColorAnalysis(colorAnalysis) {
    const colorAnalysisDiv = document.getElementById('colorAnalysis');
    const colorResults = document.getElementById('colorResults');
    
    // Show color analysis if there are significant colors
    const significantColors = Object.entries(colorAnalysis).filter(([color, percentage]) => percentage > 3);
    
    if (significantColors.length > 0) {
        colorAnalysisDiv.style.display = 'block';
        
        // Define color mappings for display
        const colorDisplay = {
            'orange': '#FF8C00',
            'red': '#FF4444',
            'green': '#44AA44',
            'yellow': '#FFD700',
            'purple': '#8A2BE2',
            'brown': '#8B4513',
            'white': '#F5F5F5',
            'darkgreen': '#006400',
            'pink': '#FFB6C1',
            'other': '#808080'
        };
        
        colorResults.innerHTML = significantColors
            .sort(([,a], [,b]) => b - a) // Sort by percentage
            .map(([color, percentage]) => `
                <div class="color-item">
                    <div class="color-dot" style="background-color: ${colorDisplay[color] || '#808080'}"></div>
                    <span>${color}: ${percentage.toFixed(1)}%</span>
                </div>
            `).join('');
    } else {
        colorAnalysisDiv.style.display = 'none';
    }
}

// Generate recipe from detected ingredients
function generateFromDetected() {
    if (detectedIngredients.length < 2) {
        alert('Need at least 2 ingredients to generate a recipe!');
        return;
    }

    // Set detected ingredients as selected
    selectedIngredients = [...detectedIngredients];
    
    // Stop camera
    stopCamera();
    
    // Go to recipe generation page
    goToPage(4);
    generateRecipe();
}

// Stop camera when leaving camera page
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// Update goToPage function to handle camera cleanup
const originalGoToPage = goToPage;
goToPage = function(pageNumber) {
    // Stop camera when leaving camera page
    if (currentStream && pageNumber !== 3) {
        stopCamera();
    }
    
    originalGoToPage(pageNumber);
};
