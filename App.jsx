import React, { useState, useEffect, useOptimistic, useRef } from 'react';
import './App.css';

export default function App() {
  const formRef = useRef(null);
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [notification, setNotification] = useState('');

  // 1. Data Persistence (Local Storage)
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Helper for Notifications
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // 2. Theme Logic (Dark Mode)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // 3. React 19 Optimistic State
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask) => [...state, newTask]
  );

  // 4. Actions & Handlers
  const formAction = async (formData) => {
    const title = formData.get('title');
    const category = formData.get('category');
    if (!title.trim()) return;

    const newTask = { 
      id: crypto.randomUUID(), 
      title, 
      category, 
      isCompleted: false, 
      pending: true 
    };

    addOptimisticTask(newTask);
    formRef.current.reset();

    // Simulate Network Delay (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setTasks((prev) => [...prev, { ...newTask, pending: false }]);
    showToast('✅ Task added successfully!');
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('🗑️ Task deleted');
  };
  
  const toggleComplete = (id) => {
    setTasks((prev) => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return setEditingId(null);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editText } : t));
    setEditingId(null);
    showToast('📝 Task updated');
  };

  const clearCompleted = () => {
    const completedCount = tasks.filter(t => t.isCompleted).length;
    if (completedCount === 0) return;
    setTasks(prev => prev.filter(t => !t.isCompleted));
    showToast(`🧹 Cleared ${completedCount} completed tasks`);
  };

  // 5. Derived State (Calculated on every render)
  const filteredTasks = optimisticTasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return task.isCompleted;
    if (filter === 'Pending') return !task.isCompleted;
    return task.category === filter;
  });

  const totalTasks = optimisticTasks.length;
  const completedTasks = optimisticTasks.filter(t => t.isCompleted).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="app-container">
      <div className="card">
        {/* Notification Popup */}
        {notification && <div className="toast-notification">{notification}</div>}

        <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
        
        <h1>Task Manager</h1>

        {/* Progress Bar Section */}
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-text">{completedTasks} of {totalTasks} tasks done</span>
            <span className="progress-badge">{progressPercentage}%</span>
          </div>
          <div className="progress-track">
            <div 
              className={`progress-fill ${progressPercentage === 100 ? 'finished' : ''}`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-footer">
             <button onClick={clearCompleted} className="clear-btn">Clear Completed</button>
          </div>
        </div>

        {/* Add Task Form */}
        <form action={formAction} ref={formRef} className="task-form">
          <input type="text" name="title" placeholder="What needs doing?" required />
          <select name="category" className="category-select">
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Urgent">Urgent</option>
          </select>
          <button type="submit" className="add-btn">Add</button>
        </form>

        {/* Filter Navigation */}
        <div className="filter-bar">
          {['All', 'Work', 'Personal', 'Urgent', 'Completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'active' : ''}>{f}</button>
          ))}
        </div>

        {/* The Task List */}
        <ul className="task-list">
          {filteredTasks.map((task) => (
            <li key={task.id} className={`task-item ${task.pending ? 'pending' : ''} ${task.isCompleted ? 'completed' : ''}`}>
              <div className="task-content">
                {editingId === task.id ? (
                  <input 
                    className="edit-input" 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    autoFocus
                  />
                ) : (
                  <>
                    <input type="checkbox" checked={task.isCompleted} onChange={() => toggleComplete(task.id)} disabled={task.pending} />
                    <span className="task-title" onDoubleClick={() => {setEditingId(task.id); setEditText(task.title);}}>{task.title}</span>
                    <span className="task-tag">{task.category}</span>
                  </>
                )}
              </div>
              <div className="task-actions">
                <button onClick={() => {setEditingId(task.id); setEditText(task.title);}} className="edit-btn-small">Edit</button>
                <button onClick={() => handleDeleteTask(task.id)} className="delete-btn" disabled={task.pending}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        
        {filteredTasks.length === 0 && <p className="empty-state">No {filter.toLowerCase()} tasks! ✨</p>}
      </div>
    </div>
  );
}