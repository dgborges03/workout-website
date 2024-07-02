/**
 * Author: Donavan Borges
 * CS 132 Spring 2024
 * Date: June 19, 2024
 * 
 * Client-side JavaScript for displaying and managing the calendar and its workout.
 */

(function() {
    "use strict";

    const SERVER_BASE_URL = window.location.hostname === "localhost" ?
                        "http://localhost:3000" : "https://workout-website-f8ij.onrender.com";
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = '';
    let completedWorkouts = {};
    let userID = localStorage.getItem('userID')


    function init() {
        document.getElementById('prev-month').addEventListener('click', previousMonth);
        document.getElementById('next-month').addEventListener('click', nextMonth);
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
        document.getElementById('add-workout-btn').addEventListener('click', addWorkoutToDate);
        document.getElementById('workout-details').addEventListener('click', handleWorkoutDetailsClick);
        document.addEventListener('DOMContentLoaded', function() {
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(event) {
                    event.preventDefault();
                    logout();
                });
            }
        });
        drawCalendar();
        fetchAllWorkouts();
        fetchCompletedWorkouts(); 
    }
    
    /**
     * Handles events that are clicked within the workout details section.
     * @param {Event} event - The event triggered by clicking.
     */
    function handleWorkoutDetailsClick(event) {
        if (event.target.classList.contains('delete-workout-icon')) {
            const workoutId = event.target.getAttribute('data-workout-id');
            const date = event.target.getAttribute('data-workout-date');
            deleteWorkout(workoutId, date);
        }
    }

    /**
     * Draws the calendar for the current month.
     */
    function drawCalendar() {
        const calendarContainer = document.getElementById('calendar-days');
        const monthEl = document.getElementById('month');
        clearChildren(calendarContainer);

        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day', 'day-header');
            dayHeader.textContent = day;
            calendarContainer.appendChild(dayHeader);
        });

        const firstDay = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfWeek = firstDay.getDay();

        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarContainer.appendChild(createDay());
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = createDay(i);
            dayElement.addEventListener('click', () => {
                selectedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                openModal(`${months[currentMonth]} ${i}, ${currentYear}`);
            });
            calendarContainer.appendChild(dayElement);
        }

        monthEl.textContent = `${months[currentMonth]} ${currentYear}`;
    }

    /**
     * Creates a day element for the calendar.
     * @param {number} dayNumber - The day number to create.
     * @returns {Element} The day element.
     */
    function createDay(dayNumber) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        if (dayNumber) {
            const numberElement = document.createElement('span');
            numberElement.classList.add('day-number');
            numberElement.textContent = dayNumber;
            dayElement.appendChild(numberElement);

            const formattedDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
            dayElement.setAttribute('data-date', formattedDate);

            if (completedWorkouts[formattedDate]) {
                const checkmarkIcon = document.createElement('span');
                checkmarkIcon.textContent = '✓';
                checkmarkIcon.className = 'checkmark';
                dayElement.appendChild(checkmarkIcon);
            }
        }
        return dayElement;
    }

    /**
     * Opens the modal for a specific date.
     * @param {string} date - The date in YYYY-MM-DD format.
     */
    function openModal(date) {
        document.getElementById('modal-date').textContent = `Workout for ${date}`;
        const formattedDate = formatDateForAPI(date);
        fetchWorkoutsForDate(formattedDate);
        document.getElementById('workout-modal').classList.add('visible');
    }
    
    
    /**
     * Fetches all workouts associated with the current user and populates the workout select dropdown.
     */
    async function fetchAllWorkouts() {
        const select = document.getElementById('workout-select');
        clearElement(select);
    
        const url = `${SERVER_BASE_URL}/api/workouts/all?userId=${userID}`;
        let resp = await fetch(url);
        if (resp.ok) {
            const workouts = await resp.json();
            workouts.forEach(workout => {
                const option = document.createElement('option');
                option.value = workout.workoutId;
                option.textContent = workout.name;
                select.appendChild(option);
            });
        } else {
            handleError('Error fetching workouts:', resp);
        }
    }
    

    /**
     * Adds a workout to the specified date.
     */
    async function addWorkoutToDate() {
        const workoutId = document.getElementById('workout-select').value;
        const workoutDetails = document.getElementById('workout-details');
        clearElement(workoutDetails);

        const userId = localStorage.getItem('userID');
        if (!userId) {
            displayMessage('User ID is missing.', false);
            return;
        }

        const resp = await fetch(`${SERVER_BASE_URL}/api/workouts/all?userId=${userId}`);
        if (!resp.ok) {
            handleError('Error fetching workout details', resp);
            return;
        }
        const workouts = await resp.json();
        const workout = workouts.find(w => w.workoutId === workoutId);
        if (workout) {
            displayWorkoutDetails(workout);
            updateWorkoutDate(workoutId, selectedDate);
        }
    }

    /**
     * Logs the weights for the specified exercises.
     * @param {string} workoutId - The ID of the workout.
     * @param {Array} exercises - The exercises to log weights for.
     */
    async function logExerciseWeights(workoutId, exercises) {
        const weights = exercises.map(exercise => {
            const inputId = `weight-for-${exercise.replace(/\s+/g, '-')}`;
            return {
                exercise: exercise,
                weight: document.getElementById(inputId).value || '0'
            };
        });

        const resp = await fetch(`${SERVER_BASE_URL}/api/workouts/log-weights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: localStorage.getItem('userID'), workoutId, weights, date: selectedDate })
        });
        if (resp.ok) {
            const data = await resp.json();
            weights.forEach(weightInfo => {
                const exerciseId = `weight-for-${weightInfo.exercise.replace(/\s+/g, '-')}`;
                const weightInput = document.getElementById(exerciseId);
                if (weightInput) {
                    const parentElement = weightInput.parentNode;
                    const weightDisplayText = document.createElement('span');
                    weightDisplayText.textContent = `${weightInfo.weight} lbs`;
                    parentElement.replaceChild(weightDisplayText, weightInput);
                }
            });
        } else {
            console.error('Failed to log weights');
            handleError('Failed to log weights. Please try again.', resp);
        }
    }

    /**
     * Displays the workout details in the DOM.
     * @param {Object} workout - The workout data to display.
     */
    function displayWorkoutDetails(workout) {
        const workoutDetails = document.getElementById('workout-details');
        const workoutHeader = document.createElement('h3');
        workoutHeader.textContent = workout.name;
        workoutDetails.appendChild(workoutHeader);

        const exercisesList = document.createElement('ul');
        workout.exercises.forEach(exercise => {
            const exerciseItem = document.createElement('li');
            exerciseItem.textContent = exercise + " - Weight: ";
            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.placeholder = 'Enter weight (lbs)';
            weightInput.className = 'weight-input';
            weightInput.id = `weight-for-${exercise.replace(/\s+/g, '-')}`;

            if (workout.logs && workout.logs[selectedDate] && workout.logs[selectedDate][exercise]) {
                weightInput.value = workout.logs[selectedDate][exercise];
            }

            exerciseItem.appendChild(weightInput);
            exercisesList.appendChild(exerciseItem);
        });

        workoutDetails.appendChild(exercisesList);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Log Weights';
        saveButton.className = 'log-weights-button';
        saveButton.onclick = () => logExerciseWeights(workout.workoutId, workout.exercises);
        workoutDetails.appendChild(saveButton);
    }

    /**
     * Updates the date for a specific workout.
     * @param {string} workoutId - The ID of the workout to update.
     * @param {string} date - The new date for the workout.
     */
    async function updateWorkoutDate(workoutId, date) {
        const userId = localStorage.getItem('userID');
        if (!userId) {
            handleError('No user ID found');
            return;
        }

        const url = `${SERVER_BASE_URL}/api/workouts/update-date`;
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, workoutId, date })
        };

        let resp = await fetch(url, fetchOptions);
        if (resp.ok) {
            const data = await resp.json();
            console.log(`Workout date updated: ${data.message}`);
            completedWorkouts[date] = true;
            drawCalendar();
        } else {
            handleError('Error updating workout date', resp);
        }
    }

    /**
     * Fetches and displays workouts for a specific date.
     * @param {string} date - The date for which to fetch workouts.
     */
    async function fetchWorkoutsForDate(date) {
        const userId = localStorage.getItem('userID');
        if (!userId) {
            console.error('No user ID found');
            handleError('No user ID found');
            return;
        }

        const url = `${SERVER_BASE_URL}/api/workouts/by-date/${date}?userId=${userId}`;
        let resp = await fetch(url);
        if (resp.ok) {
            const workouts = await resp.json();
            console.log("Workouts fetched for date:", date, workouts);
            displayWorkouts(workouts);
        } else {
            console.error('Error fetching workouts for date:', date, resp);
            handleError('Error fetching workouts for date', resp);
        }
    }


    /**
     * Fetches the dates on which workouts were completed by the user.
     */
    async function fetchCompletedWorkouts() {
        const userId = localStorage.getItem('userID');
        if (!userId) {
            handleError('No user ID found');
            return;
        }
        
        const url = `${SERVER_BASE_URL}/api/workouts/completed-dates?userId=${userId}`;
        let resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            if (data.success && Array.isArray(data.completedDates)) {
                completedWorkouts = {};
                data.completedDates.forEach(date => {
                    completedWorkouts[date] = true;
                });
                drawCalendar();
            } else {
                handleError('Failed to fetch completed workout dates or invalid data structure', resp);
            }
        } else {
            handleError('Error fetching completed workout dates', resp);
        }
    }

    /**
     * Displays workout details on the calendar.
     * @param {Array} workouts - Array of workout objects.
     */
    function displayWorkouts(workouts) {
        const workoutDetails = document.getElementById('workout-details');
        clearElement(workoutDetails);
    
        if (workouts.length === 0) {
            const noWorkoutsMessage = document.createElement('p');
            noWorkoutsMessage.textContent = 'No workouts found for this date.';
            workoutDetails.appendChild(noWorkoutsMessage);
        } else {
            workouts.forEach(workout => {
                const detailsDiv = document.createElement('div');
                detailsDiv.classList.add('workout-details-card');
    
                const workoutHeader = document.createElement('h3');
                workoutHeader.textContent = workout.name;
                const deleteIcon = document.createElement('span');
                deleteIcon.textContent = "🗑️";
                deleteIcon.classList.add('delete-workout-icon');
                deleteIcon.title = 'Delete workout';
                deleteIcon.setAttribute('data-workout-id', workout.workoutId);
                deleteIcon.setAttribute('data-workout-date', formatDateForAPI(selectedDate));
    
                workoutHeader.appendChild(deleteIcon);
                detailsDiv.appendChild(workoutHeader);
    
                const exercisesList = document.createElement('ul');
                exercisesList.classList.add('exercises-list');
    
                workout.exercises.forEach(exercise => {
                    const exerciseLi = document.createElement('li');
                    const weightInfo = findWeightInfo(workout, exercise);
                    exerciseLi.textContent = `${exercise} - Weight: ${weightInfo}`;
                    exercisesList.appendChild(exerciseLi);
                });
    
                detailsDiv.appendChild(exercisesList);
                workoutDetails.appendChild(detailsDiv);
            });
        }
    }
    
    /**
     * Finds weight information for a specific exercise from the logged workouts.
     * @param {Object} workout - The workout object.
     * @param {string} exercise - The name of the exercise to find the weight for.
     * @returns {Object} - Returns the weight info object if found.
     */
    function findWeightInfo(workout, exercise) {
        const log = workout.logs.find(log => log.date === selectedDate);
        const weightInfo = log && log.weights.find(w => w.exercise === exercise);
        return weightInfo ? `${weightInfo.weight} lbs` : '[Weight not logged]';
    }
    
    /**
     * Deletes a specific workout.
     * @param {string} workoutId - ID of the workout.
     * @param {string} date - Date of the workout.
     */
    async function deleteWorkout(workoutId, date) {
        const workoutDetails = document.getElementById('workout-details');
        clearElement(workoutDetails);
    
        const url = `${SERVER_BASE_URL}/api/workouts/${workoutId}/date/${date}?userId=${userID}`;
        let resp = await fetch(url, {
            method: 'DELETE'
        });
        if (resp.ok) {
            fetchWorkoutsForDate(date);
        } else {
            handleError('Error deleting workout', resp);
        }
    }
    
    /**
     * Closes the workout modal.
     */
    function closeModal() {
        document.getElementById('workout-modal').classList.remove('visible');
    }

    /**
     * Removes all child nodes of a given parent DOM element.
     * @param {HTMLElement} parent - Parent element to clear.
     */
    function clearChildren(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    /**
     * Changes the current month displayed on the calendar to the previous month.
     */
    function previousMonth() {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        drawCalendar();
    }

    /**
     * Changes the current month displayed on the calendar to the next month.
     */
    function nextMonth() {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        drawCalendar();
    }

    /**
     * Formats a date string into the API's required format (YYYY-MM-DD).
     * @param {string} date - Date string to format.
     * @returns {string} - Formatted date string.
     */
    function formatDateForAPI(date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
    
        const parts = date.split(/[\s,]+/);
        if (parts.length < 3) {
            console.error("Date format is incorrect, expected format 'Month Day, Year' or 'YYYY-MM-DD':", date);
            return '';
        }
    
        const [month, day, year] = parts;
        const monthIndex = months.indexOf(month) + 1;
        if (monthIndex === 0) {
            console.error("Invalid month in date:", month);
            return '';
        }
    
        return `${year}-${monthIndex.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    /**
     * Clears all child elements from a DOM element.
     * @param {HTMLElement} element - Element to clear.
     */
    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Logs out the current user and redirects to the login page.
     */
    function logout() {
        localStorage.removeItem('userID');
        window.location.href = 'index.html';
    }

    /**
     * Displays a message to the user.
     * @param {string} message - Message text.
     * @param {boolean} isSuccess - Whether the message is a success (true) or error (false).
     */
    function displayMessage(message, isSuccess) {
        const messageBox = document.createElement('div');
        messageBox.textContent = message;
        messageBox.style.color = isSuccess
        document.body.appendChild(messageBox);
        setTimeout(() => {
            document.body.removeChild(messageBox);
        }, 3000);
    }

    /**
     * Handles errors during fetch operations.
     * @param {string} message - Error message.
     * @param {Response} response - Fetch response object.
     */
    function handleError(message, response) {
        console.error(message, response);
        displayMessage(message, false);
    }

    init();
})();