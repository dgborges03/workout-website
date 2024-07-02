/**
 * Author: Donavan Borges
 * CS 132 Spring 2024
 * Date: June 4, 2024
 * 
 * Sever-side Javascript for the my FitLog applicaiton. It is an API created
 * to handle users' login and registration and workout logger and management.
 */


"use strict";

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(express.static("public"));
app.use(cors());

const EXERCISES_FILE = path.join(__dirname, "exercises.json");
const USERS_FILE = path.join(__dirname, "users.json");
const WORKOUTS_FILE = path.join(__dirname, "workouts.json");

/**
 * Logs in a user by checking username and email against the stored user data.
 */
app.post("/api/users/login", async (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ success: false, error: "Username and email are required." });
    }

    const users = JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
    const user = users.find(u => u.username === username && u.email === email);
    if (user) {
        res.json({ success: true, message: "User logged in successfully.", userId: user.userId });
    } else {
        res.status(400).json({ success: false, error: "User not found. Please check your login credentials." });
    }
});

/**
 * Registers a new user with provided name, email, and phone number.
 */
app.post("/api/users/register", async (req, res) => {
    const { name, email, phone_number } = req.body;
    try {
        const users = JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
        
        const existingUser = users.find(u => u.username === name || u.email === email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: "Username or email already exists. Please login instead." });
        }

        const userId = await getNextUserId();
        const newUser = { userId: userId.toString(), username: name, email, phone_number };
        users.push(newUser);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, message: "User registered successfully.", userId: newUser.userId });
    } catch (err) {
        console.error("Failed to register user:", err);
        res.status(500).json({ success: false, error: "Error registering user." });
    }
});

/**
 * Retrieves all exercises from the backend.
 */
app.get("/api/exercises", async (req, res) => {
    try {
        const exercises = await fs.readFile(EXERCISES_FILE, "utf8");
        res.json(JSON.parse(exercises));
    } catch (err) {
        res.status(500).json({ success: false, error: "Error fetching exercises." });
    }
});

/**
 * Creates a custom workout with a given user ID, workout name, and a list of exercises.
 */
app.post("/api/workouts/custom", async (req, res) => {
    const { userId, name, exercises } = req.body;
    if (!userId || !name || !exercises) {
        return res.status(400).json({ success: false, error: "Missing required fields: userId, name, and exercises are required." });
    }
    try {
        const newWorkoutId = await getNextWorkoutId();
        const newWorkout = { workoutId: newWorkoutId.toString(), userId, name, exercises };
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        workouts.push(newWorkout);
        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: "Custom workout created successfully.", workoutId: newWorkoutId });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error creating workout." });
    }
});

/**
 * Retrieves saved workouts for a specific user by their user ID.
 */
app.get("/api/workouts/saved/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const userWorkouts = workouts.filter(workout => workout.userId === userId);
        if (userWorkouts.length === 0) {
            return res.status(400).json({ success: false, error: "No workouts found for this user." });
        }
        res.json({ success: true, savedWorkouts: userWorkouts });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error retrieving saved workouts." });
    }
});

/**
 * Adds an exercise to an existing workout by workout ID.
 */
app.post("/api/workouts/:workoutId/add-exercise", async (req, res) => {
    const { workoutId } = req.params;
    const { exerciseName } = req.body;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const workout = workouts.find(w => w.workoutId === workoutId);
        if (!workout) {
            return res.status(400).json({ success: false, error: "Workout not found." });
        }
        workout.exercises.push(exerciseName);
        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: "Exercise added successfully to workout.", updatedWorkout: workout });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error adding exercise to workout." });
    }
});

/**
 * Removes an exercise from an existing workout by workout ID.
 */
app.post("/api/workouts/:workoutId/remove-exercise", async (req, res) => {
    const { workoutId } = req.params;
    const { exerciseName } = req.body;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const workout = workouts.find(w => w.workoutId === workoutId);
        if (!workout) {
            return res.status(400).json({ success: false, error: "Workout not found." });
        }
        workout.exercises = workout.exercises.filter(e => e !== exerciseName);
        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: "Exercise removed successfully from workout.", updatedWorkout: workout });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error removing exercise from workout." });
    }
});

/**
 * Deletes a workout by its workout ID.
 */
app.delete("/api/workouts/:workoutId", async (req, res) => {
    const { workoutId } = req.params;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const updatedWorkouts = workouts.filter(workout => workout.workoutId !== workoutId);
        
        if (workouts.length === updatedWorkouts.length) {
            return res.status(404).json({ success: false, error: "Workout not found." });
        }

        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(updatedWorkouts, null, 2));
        res.json({ success: true, message: "Workout deleted successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Error deleting workout." });
    }
});

/**
 * Retrieves all workouts for a user by user ID.
 */
app.get("/api/workouts/all", async (req, res) => {
    const { userId } = req.query;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const userWorkouts = workouts.filter(workout => workout.userId === userId);
        res.json(userWorkouts);
    } catch (error) {
        console.error("Failed to fetch workouts:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
});

/**
 * Updates the date of a workout by workout ID.
 */
app.post('/api/workouts/update-date', async (req, res) => {
    const { workoutId, date } = req.body;

    if (!workoutId || !date) {
        return res.status(400).json({ success: false, message: "Workout ID and date are required." });
    }

    try {
        const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
        const workouts = JSON.parse(data);
        const index = workouts.findIndex(workout => workout.workoutId === workoutId);

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Workout not found." });
        }

        workouts[index].dates = workouts[index].dates || [];
        if (!workouts[index].dates.includes(date)) {
            workouts[index].dates.push(date);
        }

        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: "Workout date updated successfully." });
    } catch (error) {
        console.error('Error updating workout date:', error);
        res.status(500).json({ success: false, error: 'Internal server error while updating workout date.' });
    }
});

/**
 * Retrieves workouts by date for a specific user by user ID and date.
 */
app.get("/api/workouts/by-date/:date", async (req, res) => {
    const { userId } = req.query;
    const { date } = req.params;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const userWorkouts = workouts.filter(workout => 
            workout.userId === userId && workout.dates && workout.dates.includes(date)
        );
        res.json(userWorkouts);
    } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
});

/**
 * Logs weights for a workout session by workout ID.
 */
app.post('/api/workouts/log-weights', async (req, res) => {
    const { workoutId, weights, date } = req.body;

    try {
        const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
        let workouts = JSON.parse(data);
        
        let workout = workouts.find(w => w.workoutId === workoutId);
        if (!workout) {
            return res.status(404).json({ success: false, message: 'Workout not found.' });
        }

        if (!workout.logs) {
            workout.logs = [];
        }

        let logIndex = workout.logs.findIndex(log => log.date === date);
        if (logIndex === -1) {
            workout.logs.push({ date, weights });
        } else {
            workout.logs[logIndex].weights = weights;
        }

        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: 'Weights logged successfully.' });
    } catch (error) {
        console.error('Failed to log weights:', error);
        res.status(500).json({ success: false, message: 'Internal server error while logging weights.' });
    }
});

/**
 * Deletes a workout log and date by workout ID and date.
 */
app.delete('/api/workouts/:workoutId/date/:date', async (req, res) => {
    const { workoutId, date } = req.params;
    try {
        const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
        let workouts = JSON.parse(data);

        const workoutIndex = workouts.findIndex(w => w.workoutId === workoutId);
        if (workoutIndex === -1) {
            return res.status(404).json({ success: false, message: 'Workout not found.' });
        }

        const dates = workouts[workoutIndex].dates || [];
        workouts[workoutIndex].dates = dates.filter(d => d !== date);

        const logs = workouts[workoutIndex].logs || [];
        workouts[workoutIndex].logs = logs.filter(log => log.date !== date);

        await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2));
        res.json({ success: true, message: 'Workout log and date deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete workout log:', error);
        res.status(500).json({ success: false, message: 'Internal server error while deleting workout log.' });
    }
});


/**
 * Retrieves all dates where workouts were completed/logged by an user.
 */
app.get("/api/workouts/completed-dates", async (req, res) => {
    const { userId } = req.query;
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const completedDates = workouts
            .filter(workout => workout.userId === userId && workout.dates)
            .flatMap(workout => workout.dates);

        res.json({ success: true, completedDates });
    } catch (error) {
        console.error("Failed to fetch completed workout dates:", error);
        res.status(500).json({ success: false, error: "Internal server error.", completedDates: [] });
    }
});


// Helper Functions
/**
 * Retrieves the next available user ID from the users file.
 * @returns {Promise<number>} The next available user ID.
 */
async function getNextUserId() {
    try {
        const users = JSON.parse(await fs.readFile(USERS_FILE, "utf8"));
        const maxId = users.reduce((max, user) => Math.max(max, parseInt(user.userId)), 0);
        return maxId + 1;
    } catch (err) {
        console.error("Error getting next user ID:", err);
        return 1;
    }
}

/**
 * Retrieves the next available workout ID from the workouts json file.
 * @returns {Promise<number>} The next available workout ID.
 */
async function getNextWorkoutId() {
    try {
        const workouts = JSON.parse(await fs.readFile(WORKOUTS_FILE, "utf8"));
        const maxId = workouts.reduce((max, workout) => Math.max(max, parseInt(workout.workoutId)), 0);
        return maxId + 1;
    } catch (err) {
        console.error("Error getting next workout ID:", err);
        return 1;
    }
}

// For publishing on Render
app.use(cors({
    origin: ['https://workout-website-f8ij.onrender.com', 'http://localhost:3000']
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
