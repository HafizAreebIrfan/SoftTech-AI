import React, { useState } from "react";
import styles from "./App.module.css";
import { useTodoStore } from "./store";

function App() {
  const { tasks, isAdding, busyTodoIds, addTodo, completeTodo } = useTodoStore();
  const [titleInput, setTitleInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = titleInput.trim();
    if (!title || isAdding) return;
    await addTodo(title);
    setTitleInput("");
  };

  const handleCheckboxChange = async (id: string, checked: boolean) => {
    if (!checked) return; // Can only mark as completed, not uncheck based on complete_todo logic
    if (busyTodoIds.includes(id)) return;
    await completeTodo(id);
  };

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Todo list</h2>
      <form id="add-form" className={styles.form} onSubmit={handleSubmit} autoComplete="off">
        <input
          id="todo-input"
          className={styles.input}
          name="title"
          placeholder="Add a task"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />
        <button className={styles.button} type="submit" disabled={isAdding}>
          {isAdding ? "Adding…" : "Add"}
        </button>
      </form>
      <ul id="todo-list" className={styles.list}>
        {tasks.map((task) => {
          const isBusy = busyTodoIds.includes(task.id);
          const isCompleted = task.completed;

          return (
            <li
              key={task.id}
              className={`${styles.item} ${isBusy ? styles.busy : ""}`}
              data-id={task.id}
              data-completed={String(isCompleted)}
              data-busy={String(isBusy)}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isCompleted}
                  disabled={isBusy}
                  onChange={(e) => handleCheckboxChange(task.id, e.target.checked)}
                />
                <span className={isCompleted ? styles.completed : styles.itemSpan}>
                  {task.title}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default App;
