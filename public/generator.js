/**
 * Author: Donavan Borges
 * CS 132 Spring 2024
 * Date: June 19, 2024
 * 
 * Client-side JavaScript for generating custom workout on the FitLog application.
 */

(function() {
    "use strict";

    const SERVER_BASE_URL = window.location.hostname === "localhost" ?
                        "http://localhost:3000" : "https://workout-website-f8ij.onrender.com";
    const userId = localStorage.getItem('userID');
    let currentGeneratedWorkout = [];

    /**
     * Initializes the event listeners and sets up the workout generation form.
     */
    function init() {
        document.querySelector("#generate-workout-btn").addEventListener("click", generateWorkout);
        document.querySelector("#save-workout-btn").addEventListener("click", saveWorkout);
        document.addEventListener('DOMContentLoaded', function() {
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(event) {
                    event.preventDefault();
                    logout();
                });
            }
        });
    }

    /**
     * Handles the form submission to generate a workout based on user input.
     * @param {Event} event - The form submission event.
     */
    async function generateWorkout(event) {
        event.preventDefault();

        const category = document.querySelector("#category").value;
        const location = document.querySelector("#location").value;

        const exercises = await fetchExercises(category, location);
        if (exercises) {
            currentGeneratedWorkout = exercises;
            displayWorkout(exercises);
            showWorkoutControls();
            showWorkoutSection();
        } else {
            displayMessage("Failed to generate workout. Please try again.", "error");
        }
    }

    /**
     * Fetches exercises from the API based on the selected category and location, ensuring inclusion of key muscle groups.
     * @param {string} category - Selected workout category.
     * @param {string} location - Selected workout location.
     * @returns - A promise that resolves to a list of filtered exercises.
     */
    async function fetchExercises(category, location) {
        const url = `${SERVER_BASE_URL}/api/exercises`;
        let resp = await fetch(url);
        if (!resp.ok) {
            handleError("Unable to fetch exercises. Please try again later.");
            return null;
        }
        const data = await resp.json();
        return processExercises(data.exercises, category, location);
    }

    /**
     * Filters and ensures muscle group inclusion in the exercises based on user preferences.
     * @param {Array} exercises - List of all available exercises.
     * @param {string} category - Selected workout category.
     * @param {string} location - Selected workout location.
     * @returns {Array} - Filtered and adjusted list of exercises.
     */
    function processExercises(exercises, category, location) {
        let filtered = exercises.filter(ex => ex.category === category && isSuitableForLocation(ex, location));
        filtered = shuffleArray(filtered);
        
        if (category !== 'stretching' && category !== 'cardio') {
            return ensureMuscleGroupInclusion(filtered);
        }
        return filtered.slice(0, 5);
    }

    /**
     * Ensures that the workout includes exercises for the chest, back, and quadriceps, chosen randomly.
     * @param {Array} exercises - List of exercises.
     * @returns {Array} - Adjusted list of exercises with required muscle group inclusions.
     */
    function ensureMuscleGroupInclusion(exercises) {
        const muscleGroups = ['chest', 'back', 'quadriceps'];
        let selectedExercises = new Set();

        muscleGroups.forEach(group => {
            let groupExercises = exercises.filter(ex => ex.primaryMuscles.includes(group));
            if (groupExercises.length > 0) {
                selectedExercises.add(randomChoice(groupExercises));
            }
        });

        while (selectedExercises.size < 5) {
            selectedExercises.add(randomChoice(exercises));
        }

        return Array.from(selectedExercises);
    }

    /**
     * Determines if an exercise is suitable for the selected location.
     * @param {Object} exercise - The exercise to check.
     * @param {string} location - The selected workout location.
     * @returns {boolean} - True if the exercise can be performed at the selected location.
     */
    function isSuitableForLocation(exercise, location) {
        const homeEquipment = ['machine', 'None', 'foam roll', 'dumbbell', 'exercise ball', 'bands', 'other', 'kettlebells', 'medicine ball', 'body only'];
        const gymEquipment = homeEquipment.concat(['barbell', 'cable', 'e-z curl bar']);
        return (location === 'home' ? homeEquipment : gymEquipment).includes(exercise.equipment);
    }

    /**
     * Displays the generated workout on the page.
     * @param {Array} exercises - Exercises to display.
     */
    function displayWorkout(exercises) {
        const workoutList = document.querySelector("#workout-list");
        clearElement(workoutList);
        exercises.forEach(ex => {
            const li = document.createElement("li");
            const card = document.createElement("div");
            card.classList.add("exercise-card");

            const exerciseName = document.createElement("h4");
            exerciseName.textContent = ex.name;
            card.appendChild(exerciseName);

            const equipment = document.createElement("p");
            equipment.textContent = `Equipment: ${ex.equipment || 'None'}`;
            card.appendChild(equipment);

            const instructions = document.createElement("p");
            instructions.textContent = `Instructions: ${ex.instructions.join(" ")}`;
            card.appendChild(instructions);

            li.appendChild(card);
            workoutList.appendChild(li);
        });
    }

    /**
     * Shows the workout controls for regenerating and saving the workout.
     */
    function showWorkoutControls() {
        const workoutControls = document.querySelector("#workout-controls");
        workoutControls.classList.remove("hidden");
    }

    /**
     * Shows the workout display section.
     */
    function showWorkoutSection() {
        const workoutDisplaySection = document.querySelector("#workout-display-section");
        workoutDisplaySection.classList.add("visible");
    }

    /**
     * Clears the content of a given DOM element.
     * @param {Element} element - The DOM element to clear.
     */
    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Shuffles an array using the Durstenfeld shuffle, an optimized version of Fisher-Yates.
     * @param {Array} array - Array to shuffle.
     * @returns {Array} - Shuffled array.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Randomly selects an element from an array.
     * @param {Array} array - Array from which to select an element.
     * @returns {Object} - Randomly selected element.
     */
    function randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Saves the current workout into workouts.json.
     * @param {Event} event - The form submission event.
     */
    async function saveWorkout(event) {
        event.preventDefault();
        const workoutName = document.querySelector("#workout-name").value;
        if (!userId) {
            handleError("No user logged in. Please log in to save your workout.");
            return;
        }

        const workout = {
            userId: userId.toString(),
            name: workoutName,
            exercises: currentGeneratedWorkout.map(ex => ex.name)
        };

        const url = `${SERVER_BASE_URL}/api/workouts/custom`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workout)
        };

        let resp = await fetch(url, fetchOptions);
        if (resp.ok) {
            displayMessage("Workout saved successfully!", "success");
            document.querySelector("#workout-name").value = '';
        } else {
            handleError("Failed to save unamed workout. Please name your workout and try again.");
        }
    }

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success' or 'error').
     */
    function displayMessage(msg, isSuccess = false) {
        const messageBox = document.querySelector("#message-box");
        messageBox.textContent = msg;
        if (isSuccess) {
            messageBox.classList.add("success");
            messageBox.classList.remove("error");
        } else {
            messageBox.classList.add("error");
            messageBox.classList.remove("success");
        }
        messageBox.classList.add("visible");
        setTimeout(() => {
            messageBox.classList.remove("visible");
        }, 3000);
    }

    /**
     * Logs out the current user and redirects to the login page.
     */
    function logout() {
        localStorage.removeItem('userID');
        window.location.href = 'index.html';
    }

    /**
     * Handles errors that occur during the fetch process.
     * @param {string} message - The error message to display.
     */
    function handleError(message) {
        console.error(message);
        displayMessage(message, "error");
    }

    init();
})();