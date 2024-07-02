/**
 * Author: Donavan Borges
 * CS 132 Spring 2024
 * Date: June 19, 2024
 * 
 * Client-side JavaScript for displaying and managing saved workouts on the FitLog application.
 */

(function() {
    "use strict";

    const SERVER_BASE_URL = window.location.hostname === "localhost" ?
                        "http://localhost:3000" : "https://workout-website-f8ij.onrender.com";
    let userId = localStorage.getItem('userID');

    /**
     * Initializes the event listeners and loads saved workouts.
     */
    function init() {
        document.querySelector("#add-workout-btn").addEventListener("click", showAddWorkoutForm);
        document.querySelector("#save-workout-btn").addEventListener("click", addCustomWorkout);
        document.querySelector("#cancel-workout-btn").addEventListener("click", hideAddWorkoutForm);
        document.addEventListener('DOMContentLoaded', function() {
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(event) {
                    event.preventDefault();
                    logout();
                });
            }
        });
        loadSavedWorkouts();
    }

    /**
     * Loads saved workouts from the server and displays them.
     */
    async function loadSavedWorkouts() {
        const url = `${SERVER_BASE_URL}/api/workouts/saved/${userId}`;
        let resp = await fetch(url);
        if (resp.ok) {
            const data = await checkStatus(resp).json();
            displayWorkouts(data.savedWorkouts);
        }
    }

    /**
     * Displays the list of saved workouts on the page.
     * @param {Array} workouts - Array of saved workouts.
     */
    function displayWorkouts(workouts) {
        const workoutList = document.querySelector("#saved-workouts-list");
        clearElement(workoutList);
        workouts.forEach(workout => {
            const workoutLi = document.createElement("li");
            const workoutCard = document.createElement("div");
            workoutCard.classList.add("workout-card");
            workoutCard.dataset.workoutId = workout.workoutId;

            const workoutName = document.createElement("h4");
            workoutName.textContent = workout.name;

            const deleteIcon = document.createElement("span");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.textContent = "🗑️";
            deleteIcon.addEventListener("click", () => deleteWorkout(workout.workoutId));

            workoutName.appendChild(deleteIcon);
            workoutCard.appendChild(workoutName);

            const exerciseList = document.createElement("ul");
            exerciseList.classList.add("exercises-list");
            workout.exercises.forEach(exercise => {
                const li = document.createElement("li");
                li.textContent = exercise;

                const deleteExerciseIcon = document.createElement("span");
                deleteExerciseIcon.classList.add("delete-icon");
                deleteExerciseIcon.textContent = "🗑️";
                deleteExerciseIcon.addEventListener("click", () => deleteExercise(workout.workoutId, exercise));

                li.appendChild(deleteExerciseIcon);
                exerciseList.appendChild(li);
            });

            const addExerciseBtn = document.createElement("button");
            addExerciseBtn.classList.add("add-exercise-btn");
            addExerciseBtn.textContent = "Add Exercise";
            addExerciseBtn.addEventListener("click", () => showAddExerciseForm(workout.workoutId));

            workoutCard.appendChild(exerciseList);
            workoutCard.appendChild(addExerciseBtn);

            workoutLi.appendChild(workoutCard);
            workoutList.appendChild(workoutLi);
        });
    }

    /**
     * Shows the form to add a custom workout.
     */
    function showAddWorkoutForm() {
        document.querySelector("#custom-workout-form").classList.remove("hidden");
    }

    /**
     * Hides the form to add a custom workout and clears the form fields.
     */
    function hideAddWorkoutForm() {
        document.querySelector("#custom-workout-form").classList.add("hidden");
        document.querySelector("#workout-name").value = '';
        document.querySelector("#exercise-names").value = '';
    }

    /**
     * Handles the form submission to add a custom workout.
     * @param {Event} event - The form submission event.
     */
    async function addCustomWorkout(event) {
        event.preventDefault();

        const workoutName = document.querySelector("#workout-name").value;
        const exerciseNames = document.querySelector("#exercise-names").value.split(",").map(name => name.trim());

        const workout = {
            userId: userId.toString(),
            name: workoutName,
            exercises: exerciseNames
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
            const jsonResp = await checkStatus(resp).json();
            displayMessage("Workout saved successfully!", "success");
            loadSavedWorkouts();
            hideAddWorkoutForm();
        } else {
            handleError("Failed to save workout. Please try again.");
        }
    }

    /**
     * Deletes a workout.
     * @param {string} workoutId - The ID of the workout to delete.
     */
    async function deleteWorkout(workoutId) {
        const url = `${SERVER_BASE_URL}/api/workouts/${workoutId}`;
        const fetchOptions = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let resp = await fetch(url, fetchOptions);
        if (resp.ok) {
            displayMessage("Workout deleted successfully!", "success");
            removeWorkoutFromDOM(workoutId);
        } else {
            handleError("Failed to delete workout. Please try again.");
        }
    }

    /**
     * Deletes an exercise from a workout.
     * @param {string} workoutId - The ID of the workout.
     * @param {string} exercise - The name of the exercise to delete.
     */
    async function deleteExercise(workoutId, exercise) {
        const url = `${SERVER_BASE_URL}/api/workouts/${workoutId}/remove-exercise`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ exerciseName: exercise })
        };

        let resp = await fetch(url, fetchOptions);
        if (resp.ok) {
            displayMessage("Exercise removed successfully!", "success");
            loadSavedWorkouts();
        } else {
            handleError("Failed to remove exercise. Please try again.");
        }
    }

    /**
     * Removes a workout from the DOM.
     * @param {string} workoutId - The ID of the workout to remove.
     */
    function removeWorkoutFromDOM(workoutId) {
        const workoutCard = document.querySelector(`.workout-card[data-workout-id="${workoutId}"]`);
        if (workoutCard) {
            workoutCard.parentElement.remove();
        }
    }

    /**
     * Shows the add exercise form for a workout.
     * @param {string} workoutId - The ID of the workout.
     */
    function showAddExerciseForm(workoutId) {
        const workoutCard = document.querySelector(`.workout-card[data-workout-id="${workoutId}"]`);
        const existingForm = workoutCard.querySelector(".add-exercise-form");
        if (existingForm) {
            existingForm.remove();
        }

        document.querySelectorAll(".add-exercise-form").forEach(form => form.remove());

        const template = document.querySelector("#add-exercise-form-template");
        const form = template.content.cloneNode(true);
        const input = form.querySelector(".new-exercise-name");
        const submitBtn = form.querySelector(".submit-exercise-btn");
        const cancelBtn = form.querySelector(".cancel-exercise-btn");

        submitBtn.addEventListener("click", (event) => {
            event.preventDefault();
            addExercise(workoutId, input.value);
        });
        cancelBtn.addEventListener("click", (event) => {
            event.preventDefault();
            workoutCard.querySelector(".add-exercise-form").remove();
        });

        workoutCard.appendChild(form);
    }

    /**
     * Adds an exercise to a workout.
     * @param {string} workoutId - The ID of the workout.
     * @param {string} exerciseName - The name of the exercise to add.
     */
    async function addExercise(workoutId, exerciseName) {
        const url = `${SERVER_BASE_URL}/api/workouts/${workoutId}/add-exercise`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ exerciseName })
        };

        let resp = await fetch(url, fetchOptions);
        if (resp.ok) {
            displayMessage("Exercise added successfully!", "success");
            loadSavedWorkouts();
        } else {
            handleError("Failed to add exercise. Please try again.");
        }
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
     * Handles errors that occur during the fetch process.
     * @param {string} message - The error message to display.
     */
    function handleError(message) {
        console.error(message);
        displayMessage(message, "error");
    }

    /**
     * Helper function to return the Response data if successful, otherwise
     * returns an Error that needs to be caught.
     * @param {Response} response - Response with status to check for success/error.
     * @returns {Response} - The Response object if successful, otherwise an Error that
     * needs to be caught.
     */
    function checkStatus(response) {
        if (!response.ok) {
            throw new Error(`Error in request: ${response.statusText}`);
        }
        return response;
    }

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success' or 'error').
     */
    function displayMessage(message, type) {
        const messageBox = document.querySelector("#message-box");
        messageBox.textContent = message;
        messageBox.className = type === "success" ? "success" : "error";
        messageBox.classList.add("visible");
        setTimeout(() => {
            messageBox.classList.remove("visible");
        }, 700);
    }

    /**
     * Logs out the current user and redirects to the login page.
     */
    function logout() {
        localStorage.removeItem('userID');
        window.location.href = 'index.html';
    }

    init();
})();
