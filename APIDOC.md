# Fitness App API Documentation
This API allows users to interact with my fitness application by providing functionality for managing workouts, saving customized routines, and handling user interactions such as logging in and registering as a loyal customer.

## POST /api/users/login
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Logs in the user by checking if the user exists in the system. (I will not use proper authentication)

**Supported Parameters** 
* `username` (required) - The username of the user trying to log in.
* `email` (required) - The email of the user trying to log in.

**Example Request:** `/api/users/login`
* `username = 'johnDoe'`
* `email = 'john.doe@example.com'`

**Example Response:**
```json
{
  "success": true,
  "message": "User logged in successfully."
}
```

**Error Handling:**
400: If the format parameter value is invalid, if both username and email are missing.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Missing required field: username or email"
}
```

## POST /api/users/register
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Registers a new loyal customer in the system.

**Supported Parameters**
* `username` (required) - The full name of the customer.
* `email` (required) - The email address of the customer.
* `phone_number` (required) - The contact phone number of the customer.

**Example Request:** `/api/users/register`
* `username = 'dborges'`
* `email = 'dborges@caltech.edu'`
* `phone_number = '123-456-7890'`

**Example Response:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "userId": "1"
}
```

**Error Handling:**
400: If the format parameter value is invalid, such as any missing fields.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Missing required field: username or email"
}
```

## GET /api/exercises
**Request Type:** GET

**Returned Data Format**: 
JSON

**Description:** 
Returns a list of all available exercises from the `exercises.json` file.

**Supported Parameters**
None

**Example Request:** `/api/exercises`

**Example Response:**
```json
[
  {
      "name": "Dumbbell Bench Press",
      "force": "push",
      "level": "beginner",
      "mechanic": "compound",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps"
      ],
      "instructions": [
        "Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.",
        "Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.",
        "Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.",
        "Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
        "Repeat the movement for the prescribed amount of repetitions of your training program."
      ],
      "category": "strength"
    }
]
```

**Error Handling:**
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Trouble processing that request"
}
```

## POST /api/workouts/custom
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Allows users to create a custom workout routine.

**Supported Parameters**
* `userID` (required) - The unique identifier of the user.
* `name` (required) - The name of the custom workout.
* `exercises` (required) - An array of exercise names

**Example Request:** `/api/workouts/custom`
`name = 'Ultimate Strength Builder'`
`exercises = ['3/4 Sit-Up', '90/90 Hamstring', 'Barbell Curl']`

**Example Response:**
```json
{
  "success": true,
  "message": "Custom workout created successfully.",
  "workoutId": "1"
}
```

**Error Handling:**
400: If the format parameter value is invalid, such as any missing fields.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Missing required field: exercises"
}
```

## GET /api/workouts/saved/:userId
**Request Type:** GET

**Returned Data Format**: 
JSON

**Description:** 
Retrieves all saved workouts for a specific user.
**URL Parameters:**
* `userId` (required) - The unique identifier of the user.

**Example Request:** `/api/workouts/saved/1`

**Example Response:**
```json
{
  "success": true,
  "savedWorkouts": [
    {
      "workoutId": "1",
      "name": "Morning Routine",
      "exercises": [
        "3/4 Sit-Up",
        "90/90 Hamstring",
        "Barbell Curl"
      ],
      "dateSaved": "2024-06-14"
    },
    {
      "workoutId": "2",
      "name": "Evening Strength",
      "exercises": [
        "Push-Ups",
        "Pull-Ups",
        "Deadlift"
      ],
      "dateSaved": "2024-06-14"
    }
  ]
}
```

**Error Handling:**
400: If there 'userID' does not exist or there are not saved workouts.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "User not found or no saved workouts available"
}
```

## POST /api/workouts/:workoutId/add-exercise
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Allows users to add an exercise to an existing workout.
**URL Parameters:**
- `workoutId` (required) - The unique identifier of the workout.

**Supported Parameters**
* `exerciseName` (required) - The name of the exercise to add to the workout.

**Example Request:** `/api/workouts/1/add-exercise`
  * `exerciseName = 'Dumbbell Curl'`

**Example Response:**
```json
{
  "success": true,
  "message": "Exercise added successfully to workout.",
  "updatedWorkout": {
    "workoutId": "1",
    "name": "Morning Routine",
    "exercises": [
      "3/4 Sit-Up",
      "90/90 Hamstring",
      "Barbell Curl",
      "Dumbbell Curl"
    ]
  }
}
```

**Error Handling:**
400: If 'exerciseName' or 'workoutID' is missing or does not exist.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Invalid exercise name provided"
}
```

## POST /api/workouts/:workoutId/remove-exercise
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Allows users to remove an exercise from an existing workout.

**URL Parameters:**
* `workoutId` (required) - The unique identifier of the workout.

**Supported Parameters**
* `exerciseName` (required) - The name of the exercise to remove from the workout.

**Example Request:** `/api/workouts/1/remove-exercise`
* `exerciseName = 'Barbell Curl'`

**Example Response:**
```json
{
  "success": true,
  "message": "Exercise removed successfully from workout.",
  "updatedWorkout": {
    "workoutId": "1",
    "name": "Morning Routine",
    "exercises": [
      "3/4 Sit-Up",
      "90/90 Hamstring"
    ]
  }
}
```

**Error Handling:**
400: If 'exerciseName' or 'workoutID' is missing or does not exist.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Invalid exercise name provided"
}
```

## POST /api/workouts/:workoutId/remove-exercise
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Allows users to remove an exercise from an existing workout.

**URL Parameters:**
* `workoutId` (required) - The unique identifier of the workout.

**Supported Parameters**
* `exerciseName` (required) - The name of the exercise to remove from the workout.

**Example Request:** `/api/workouts/1/remove-exercise`
* `exerciseName = 'Barbell Curl'`

**Example Response:**
```json
{
  "success": true,
  "message": "Exercise removed successfully from workout.",
  "updatedWorkout": {
    "workoutId": "1",
    "name": "Morning Routine",
    "exercises": [
      "3/4 Sit-Up",
      "90/90 Hamstring"
    ]
  }
}
```

**Error Handling:**
400: If 'exerciseName' or 'workoutID' is missing or does not exist.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Invalid exercise name provided"
}
```

## DELETE /api/workouts/:workoutId
**Request Type:** DELETE

**Returned Data Format**: 
JSON

**Description:** 
Deletes a specific workout from the backend.

**URL Parameters:**
* `workoutId` (required) - The unique identifier of the workout.

**Example Request:** `/api/workouts/1`

**Example Response:**
```json
{
  "success": true,
  "message": "Workout deleted successfully."
}
```

**Error Handling:**
400: If 'workoutID' is missing or does not exist.
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Invalid workout ID provided"
}
```

## GET /api/workouts/all
**Request Type:** GET

**Returned Data Format**: 
JSON

**Description:** 
Retrieves all workouts associated with a specific user

**Supported Parameters**
* `userID` (required) - The unique identifier of the user.

**Example Request:** `/api/workouts/all?userId=1`

**Example Response:**
```json
[
  {
    "workoutId": "1",
    "name": "Day 1",
    "exercises": [
      "3/4 Sit-Up",
      "90/90 Hamstring",
      "Barbell Curl"
    ]
  },
  {
    "workoutId": "2",
    "name": "Day 2",
    "exercises": [
      "Push-Ups",
      "Pull-Ups",
      "Deadlift"
    ]
  }
]
```

**Error Handling:**
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Trouble processing that request"
}
```

## POST /api/workouts/update-date
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Updates the date for a specific workout.

**Supported Parameters**
* `workoutId` (required) - The unique identifier of the workout.
* `date` (required) - The new date to associate with the workout.

**Example Request:** `/api/workouts/update-date`

**Example Response:**
```json
{
  "workoutId": "1",
  "date": "2024-04-21"
}
```

**Error Handling:**
400: If workoutId or date is missing/invalid/does not exist. 
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Workout ID and date are required."
}
```

## GET /api/workouts/by-date/:date
**Request Type:** GET

**Returned Data Format**: 
JSON

**Description:** 
Retrieves all workouts for a specified user that are scheduled on the given date.

**URL Parameters:**
* `date` (required) - The specific date to retrieve workouts.

**Supported Parameters**
* `userId` (required) - The unique identifier of the user.

**Example Request:** `/api/workouts/by-date/2024-06-15?userId=1`

**Example Response:**
```json
[
  {
    "workoutId": "1",
    "name": "Morning Routine",
    "exercises": ["Push-Ups", "Pull-Ups", "Deadlift"],
    "dates": ["2024-06-15"]
  },
  {
    "workoutId": "2",
    "name": "Cardio Session",
    "exercises": ["Running", "Cycling"],
    "dates": ["2024-06-15"]
  }
]
```

**Error Handling:**
400: If userId or date is missing/invalid/does not exist. 
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "No workouts found for this date."
}
```

## POST /api/workouts/log-weights
**Request Type:** POST

**Returned Data Format**: 
JSON

**Description:** 
Logs the weights for a specific workout.

**Supported Parameters**
* `workoutId` (required) - The unique identifier of the workout.
* `weights` (required) - An array that has the exercise name and weight lifted.
* `date` (required) - The date on which the workout took place.

**Example Request:** `/api/workouts/log-weights`

**Example Response:**
```json
{
  "workoutId": "1",
  "weights": [
    {
      "exercise": "Push-Ups",
      "weight": "bodyweight"
    },
    {
      "exercise": "Dumbbell Curl",
      "weight": "15 lbs"
    }
  ],
  "date": "2024-06-15"
}
```

**Error Handling:**
400: If workoutId, weights, or date is missing/invalid/does not exist. 
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Missing required fields: workoutId, weights, or date."
}
```

## DELETE /api/workouts/:workoutId/date/:date
**Request Type:** DELETE

**Returned Data Format**: 
JSON

**Description:** 
Deletes a specific workout log and the date associated with it from the user's records.

**URL Parameters**
* `workoutId` (required) - The unique identifier of the workout.
* `date` (required) - The date on which the workout took place.

**Example Request:** `/api/workouts/1/date/2024-06-15`

**Example Response:**
```json
{
  "success": true,
  "message": "Workout log and date deleted successfully."
}
```

**Error Handling:**
404: workoutId or date does not exist. 
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "message": "Workout not found."
}
```

## GET /api/workouts/completed-dates
**Request Type:** GET

**Returned Data Format**: 
JSON

**Description:** 
Retrieves a list of all dates where the user logged their workouts on.

**Supported Parameters**
* `userId` (required) - The unique identifier of the user.


**Example Request:** `/api/workouts/completed-dates?userId=1`

**Example Response:**
```json
{
  "success": true,
  "completedDates": ["2024-06-15", "2024-06-20", "2024-06-25"]
}
```

**Error Handling:**
400: If the userId is missing or invalid. 
500: If there's a server-side problem processing the request.

**Example Response:**
```json
{
  "success": false,
  "error": "Internal server error."
}
```