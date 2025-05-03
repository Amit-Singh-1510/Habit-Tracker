"use client";
import { useState, useEffect } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const habits = [
  {
    id: "sleep",
    name: "Sleep",
    unit: "hrs",
    goal: 8,
  },
  {
    id: "water",
    name: "Water",
    unit: "cups",
    goal: 8,
  },
  {
    id: "screen",
    name: "Screen Time",
    unit: "hrs",
    goal: 2,
  },
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Home() {
  const [inputValues, setInputValues] = useState<Record<string, number[]>>({});
  const [completionStatus, setCompletionStatus] = useState<Record<string, number[]>>({});
  const [streak, setStreak] = useState(0);
  const [missedGoals, setMissedGoals] = useState<string[]>([]);
  const [todayIndex, setTodayIndex] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
console.log("todayIndex", setTodayIndex);
  // Initialize localStorage data
  useEffect(() => {
    const savedData = localStorage.getItem("habitInputValues");
    const savedStatus = localStorage.getItem("completionStatus");

    if (savedData) {
      setInputValues(JSON.parse(savedData));
    } else {
      setInputValues(
        habits.reduce((acc, habit) => {
          acc[habit.id] = new Array(7).fill(0);
          return acc;
        }, {} as Record<string, number[]>)
      );
    }

    if (savedStatus) {
      setCompletionStatus(JSON.parse(savedStatus));
    } else {
      setCompletionStatus(
        habits.reduce((acc, habit) => {
          acc[habit.id] = new Array(7).fill(0);
          return acc;
        }, {} as Record<string, number[]>)
      );
    }
  }, []);

  // Update localStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("habitInputValues", JSON.stringify(inputValues));
      localStorage.setItem("completionStatus", JSON.stringify(completionStatus));
    }
  }, [inputValues, completionStatus]);

  // Handle input change for today's data
  const handleInputChange = (habitId: string, value: string) => {
    const numericValue = isNaN(parseFloat(value)) ? 0 : parseFloat(value);

    const updatedValues = [...inputValues[habitId]];
    updatedValues[todayIndex] = numericValue;
    const updatedInputValues = {
      ...inputValues,
      [habitId]: updatedValues,
    };
    setInputValues(updatedInputValues);

    const updatedCompletion = updatedValues.map((val) =>
      val >= habits.find((h) => h.id === habitId)!.goal ? 1 : 0
    );
    const updatedCompletionStatus = {
      ...completionStatus,
      [habitId]: updatedCompletion,
    };
    setCompletionStatus(updatedCompletionStatus);

    const missed = numericValue < habits.find((h) => h.id === habitId)!.goal;
    if (missed) {
      const missedGoalMessage = `You missed the goal for ${habitId} on ${days[todayIndex]}`;
      setMissedGoals((prev) => {
        if (!prev.includes(missedGoalMessage)) {
          return [...prev, missedGoalMessage];
        }
        return prev;
      });
    }

    // Update streak
    const today = new Date().getDay(); // Sunday = 0, Monday = 1, ...
    let newStreak = 0;

    for (let i = today === 0 ? 6 : today - 1; i >= 0; i--) {
      const allMet = habits.every((habit) => {
        return updatedCompletionStatus[habit.id]?.[i] === 1;
      });
      if (allMet) {
        newStreak++;
      } else {
        break;
      }
    }

    setStreak(newStreak);
  };

  // Reset all data
  const resetData = () => {
    setInputValues(
      habits.reduce((acc, habit) => {
        acc[habit.id] = new Array(7).fill(0);
        return acc;
      }, {} as Record<string, number[]>)
    );
    setCompletionStatus(
      habits.reduce((acc, habit) => {
        acc[habit.id] = new Array(7).fill(0);
        return acc;
      }, {} as Record<string, number[]>)
    );
    setStreak(0);
    setMissedGoals([]);
    localStorage.clear();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">📊 Habit Tracker</h1>

      {/* Streak Tracker */}
      <div className="mt-6 text-center text-xl font-semibold">
        🚀 Streak: {streak} day{streak !== 1 ? "s" : ""}
      </div>

      {/* Only show form for today's data */}
      <div className="grid md:grid-cols-2 gap-6">
        {habits.map((habit) => (
          <div key={habit.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">{habit.name}</h2>

            {/* Display graph for past input */}
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inputValues[habit.id]?.map((val, i) => ({
                  day: days[i],
                  value: val,
                  goal: habit.goal,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Line type="monotone" dataKey="goal" stroke="#ff0000" dot={false} strokeWidth={2} name="Goal" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Form for Today's Input */}
            <div className="mb-2">
              <label className="block text-sm text-gray-600">
                {days[todayIndex]} ({habit.unit})
              </label>
              <input
                type="number"
                value={inputValues[habit.id]?.[todayIndex] || ""}
                onChange={(e) => handleInputChange(habit.id, e.target.value)}
                className="w-full border-2 border-gray-300 rounded p-2"
                placeholder={`Enter ${habit.name} for today`}
              />
              <div className="text-sm text-gray-600">
                Goal: {habit.goal} {habit.unit} - You entered: {inputValues[habit.id]?.[todayIndex]} {habit.unit}
              </div>
            </div>

            {/* Show the number of days the goal was met */}
            <div className="mt-auto text-sm text-green-600 font-medium">
              🔥 Days Goal Met: {completionStatus[habit.id]?.reduce((acc, val) => acc + val, 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Missed Goals Reminder for Today */}
      {missedGoals.length > 0 && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="font-semibold">Missed Goals Today:</h3>
          <ul>
            {missedGoals.map((goal, index) => (
              <li key={index} className="text-sm">{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-4 text-center">
        <button
          onClick={resetData}
          className="bg-red-500 text-white py-2 px-4 rounded-full"
        >
          Reset Data
        </button>
      </div>
    </div>
  );
}
