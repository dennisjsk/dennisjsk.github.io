const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('menu-dropdown');
const moveDoneBtn = document.getElementById('move-done-btn');
const itemMenu = document.getElementById('item-menu');
const datePicker = document.getElementById('date-picker');
const pickerDateInput = document.getElementById('picker-date-input');
const dateOkBtn = document.getElementById('date-ok');
const dateCancelBtn = document.getElementById('date-cancel');
const dateRemoveBtn = document.getElementById('date-remove');
const statusBar = document.getElementById('status-bar');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');
const tagPicker = document.getElementById('tag-picker');
const tagInput = document.getElementById('tag-input');
const tagOkBtn = document.getElementById('tag-ok');
const tagCancelBtn = document.getElementById('tag-cancel');
const currentTagsDiv = document.getElementById('current-tags');

let todos = (JSON.parse(localStorage.getItem('todos')) || [])
  .map(function(t) { return { text: t.text, done: t.done, dueDate: t.dueDate || null, tags: t.tags || [] }; });

let swipeStartX = 0;
let touchStartY = 0;
let longPressTimer = null;
let isReorderMode = false;
let reorderSourceIndex = null;
let currentItemIndex = null;
let searchQuery = '';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  if (!dateStr) return '';
  var date = new Date(dateStr + 'T00:00:00');
  return date.getDate() + ' ' + MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear();
}

function getDateStatus(dateStr) {
  if (!dateStr) return null;
  var today = new Date();
  today.setHours(0,0,0,0);
  var due = new Date(dateStr + 'T00:00:00');
  var diffDays = Math.ceil((due - today) / 86400000);
  if (diffDays <= 0) return 'overdue';
  if (diffDays <= 3) return 'upcoming';
  return 'future';
}

function updateStatusBar() {
  var lastActionDate = localStorage.getItem('lastTodoAction');
  if (!lastActionDate) {
    statusBar.textContent = 'No export/import yet';
    statusBar.className = 'status-bar old';
    return;
  }
  var diff = Math.ceil((new Date() - new Date(lastActionDate + 'T00:00:00')) / 86400000);
  statusBar.textContent = 'Last exported/imported on ' + formatDate(lastActionDate);
  statusBar.className = 'status-bar ' + (diff > 3 ? 'old' : 'recent');
}

function setLastActionDate() {
  var today = new Date();
  var dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  localStorage.setItem('lastTodoAction', dateStr);
  updateStatusBar();
}

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function addTodo() {
  var text = todoInput.value.trim();
  if (!text) return;
  todos.unshift({ text: text, done: false, dueDate: null, tags: [] });
  saveTodos();
  renderTodos();
  todoInput.value = '';
}

function deleteTodo(index) {
  if (!confirm('Delete this item?')) return;
  todos.splice(index, 1);
  saveTodos();
  renderTodos();
}

function toggleStrikethrough(index) {
  todos[index].done = !todos[index].done;
  saveTodos();
  renderTodos();
}

function editTodo(index) {
  var li = todoList.children[index];
  if (!li || li.querySelector('.edit-input')) return;

  var todo = todos[index];
  var currentText = li.querySelector('span');
  currentText.style.display = 'none';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = todo.text;

  function saveEdit() {
    var newText = input.value.trim();
    if (newText) todos[index].text = newText;
    saveTodos();
    renderTodos();
  }

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') saveEdit();
  });
  li.appendChild(input);
  input.focus();
  input.select();
}

function moveDoneToBottom() {
  var done = todos.filter(function(t) { return t.done; });
  var notDone = todos.filter(function(t) { return !t.done; });
  todos = notDone.concat(done);
  saveTodos();
  renderTodos();
}

function enterReorderMode(index) {
  isReorderMode = true;
  reorderSourceIndex = index;
  if (navigator.vibrate) navigator.vibrate(50);
  renderTodos();
}

function moveToIndex(targetIndex) {
  if (reorderSourceIndex === null || reorderSourceIndex === targetIndex) {
    exitReorderMode();
    return;
  }
  var moved = todos.splice(reorderSourceIndex, 1);
  todos.splice(targetIndex, 0, moved[0]);
  saveTodos();
  exitReorderMode();
}

function exitReorderMode() {
  isReorderMode = false;
  reorderSourceIndex = null;
  renderTodos();
}

function showItemMenu(x, y, index) {
  currentItemIndex = index;
  var menuWidth = 160, menuHeight = 120;
  var left = x, top = y;
  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
  if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 10;
  itemMenu.style.left = left + 'px';
  itemMenu.style.top = top + 'px';
  itemMenu.classList.add('show');
}

function showDatePicker(index, menuRect) {
  currentItemIndex = index;
  pickerDateInput.value = todos[index].dueDate || '';
  var left = menuRect.left, top = menuRect.bottom + 5;
  if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
  if (top + 150 > window.innerHeight) top = menuRect.top - 150;
  datePicker.style.left = left + 'px';
  datePicker.style.top = top + 'px';
  datePicker.classList.add('show');
  pickerDateInput.focus();
}

function showTagPicker(index, menuRect) {
  currentItemIndex = index;
  tagInput.value = (todos[index].tags || []).join(', ');
  var left = menuRect.left, top = menuRect.bottom + 5;
  if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
  if (top + 200 > window.innerHeight) top = menuRect.top - 200;
  tagPicker.style.left = left + 'px';
  tagPicker.style.top = top + 'px';
  tagPicker.classList.add('show');
  tagInput.focus();
  renderCurrentTags();
}

function renderCurrentTags() {
  currentTagsDiv.innerHTML = '';
  if (currentItemIndex === null) return;
  var tags = todos[currentItemIndex].tags || [];
  tags.forEach(function(tag, i) {
    var span = document.createElement('span');
    span.className = 'current-tag';
    span.textContent = tag;
    var removeBtn = document.createElement('span');
    removeBtn.className = 'remove-tag';
    removeBtn.textContent = ' x';
    removeBtn.addEventListener('click', function() {
      todos[currentItemIndex].tags.splice(i, 1);
      saveTodos();
      renderCurrentTags();
      renderTodos();
    });
    span.appendChild(removeBtn);
    currentTagsDiv.appendChild(span);
  });
}

function createTodoElement(todo, index) {
  var li = document.createElement('li');
  li.setAttribute('data-index', index);
  li.setAttribute('draggable', true);
  if (todo.done) li.classList.add('strikethrough');
  if (isReorderMode && index === reorderSourceIndex) li.classList.add('reorder-source');

  var textSpan = document.createElement('span');
  textSpan.textContent = todo.text;
  textSpan.style.flex = '1';
  li.appendChild(textSpan);

  if (todo.dueDate) {
    var dueSpan = document.createElement('span');
    dueSpan.className = 'due-date';
    if (todo.done) {
      dueSpan.classList.add('grey-date');
    } else {
      var status = getDateStatus(todo.dueDate);
      if (status) dueSpan.classList.add(status);
    }
    dueSpan.textContent = formatDate(todo.dueDate);
    li.appendChild(dueSpan);
  }

  if (todo.tags && todo.tags.length > 0) {
    var tagsContainer = document.createElement('div');
    tagsContainer.className = 'tags-container';
    todo.tags.forEach(function(tag) {
      var tagSpan = document.createElement('span');
      tagSpan.className = 'tag clickable';
      tagSpan.textContent = tag;
      tagSpan.addEventListener('click', function(e) {
        e.stopPropagation();
        searchInput.value = tag;
        searchQuery = tag;
        renderTodos();
      });
      tagsContainer.appendChild(tagSpan);
    });
    li.appendChild(tagsContainer);
  }

  var doneBtn = document.createElement('button');
  doneBtn.className = 'action-btn done-btn' + (todo.done ? ' grey' : '');
  doneBtn.textContent = '\u2713';
  doneBtn.title = todo.done ? 'Mark as undone' : 'Mark as done';
  li.appendChild(doneBtn);

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete-btn';
  deleteBtn.textContent = 'X';
  deleteBtn.title = 'Delete';
  li.appendChild(deleteBtn);

  var overlay = document.createElement('div');
  overlay.className = 'swipe-overlay';
  li.appendChild(overlay);

  return li;
}

function getFilteredTodos() {
  if (!searchQuery) return todos;
  var query = searchQuery.toLowerCase();
  return todos.filter(function(todo) {
    var textMatch = todo.text.toLowerCase().indexOf(query) !== -1;
    var tagMatch = (todo.tags || []).some(function(tag) {
      return tag.toLowerCase().indexOf(query) !== -1;
    });
    return textMatch || tagMatch;
  });
}

function renderTodos() {
  todoList.innerHTML = '';
  var filteredTodos = getFilteredTodos();

  if (filteredTodos.length === 0) {
    emptyState.style.display = 'flex';
    if (!searchQuery) {
      emptyState.querySelector('.empty-text').textContent = 'No tasks yet';
      emptyState.querySelector('.empty-hint').textContent = 'Add a task above to get started';
    } else {
      emptyState.querySelector('.empty-text').textContent = 'No tasks found';
      emptyState.querySelector('.empty-hint').textContent = 'Try a different search term';
    }
  } else {
    emptyState.style.display = 'none';
  }

  if (isReorderMode) {
    var instructions = document.createElement('div');
    instructions.className = 'reorder-instructions';
    instructions.innerHTML = 'Tap where to move the item  <button style="padding:2px 8px;font-size:0.8rem;cursor:pointer;background:#999;color:white;border:1px solid #666;border-radius:3px;" onclick="window.exitReorderMode()">Cancel</button>';
    todoList.appendChild(instructions);
    window.exitReorderMode = exitReorderMode;
  }

  filteredTodos.forEach(function(todo, displayIndex) {
    var originalIndex = todos.indexOf(todo);
    todoList.appendChild(createTodoElement(todo, originalIndex));
  });
  updateStatusBar();
}

searchInput.addEventListener('input', function() {
  searchQuery = searchInput.value.trim();
  renderTodos();
});

todoList.addEventListener('click', function(e) {
  var li = e.target.closest('li');
  if (!li || !li.getAttribute('data-index')) return;
  var index = parseInt(li.getAttribute('data-index'));

  if (e.target.classList.contains('done-btn')) {
    if (!isReorderMode) toggleStrikethrough(index);
  } else if (e.target.classList.contains('delete-btn')) {
    if (!isReorderMode) deleteTodo(index);
  } else if (isReorderMode) {
    moveToIndex(index);
  }
});

todoList.addEventListener('dragstart', function(e) {
  if (isReorderMode) { e.preventDefault(); return; }
  var li = e.target.closest('li');
  if (!li) return;
  var index = parseInt(li.getAttribute('data-index'));
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', '');
  setTimeout(function() { li.classList.add('dragging'); }, 0);
  window.__dragIndex = index;
});

todoList.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  todoList.querySelectorAll('li').forEach(function(item) { item.classList.remove('drag-over'); });
  var li = e.target.closest('li');
  if (li) li.classList.add('drag-over');
});

todoList.addEventListener('drop', function(e) {
  e.preventDefault();
  var li = e.target.closest('li');
  if (li && window.__dragIndex !== null) {
    var targetIndex = parseInt(li.getAttribute('data-index'));
    if (window.__dragIndex !== targetIndex) {
      var moved = todos.splice(window.__dragIndex, 1);
      todos.splice(targetIndex, 0, moved[0]);
      saveTodos();
      renderTodos();
    }
  }
});

todoList.addEventListener('dragend', function() {
  todoList.querySelectorAll('li').forEach(function(item) {
    item.classList.remove('dragging');
    item.classList.remove('drag-over');
  });
  window.__dragIndex = null;
});

todoList.addEventListener('touchstart', function(e) {
  var li = e.target.closest('li');
  if (!li || !li.getAttribute('data-index')) return;
  var index = parseInt(li.getAttribute('data-index'));
  swipeStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  li.style.transition = 'none';

  if (isReorderMode) return;

  longPressTimer = setTimeout(function() {
    currentItemIndex = index;
    showItemMenu(e.touches[0].clientX, e.touches[0].clientY, index);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 500);
}, { passive: true });

todoList.addEventListener('touchmove', function(e) {
  if (isReorderMode) { e.preventDefault(); return; }
  if (!swipeStartX) return;
  clearTimeout(longPressTimer);
  var diffX = e.touches[0].clientX - swipeStartX;
  var diffY = e.touches[0].clientY - touchStartY;
  if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
    e.preventDefault();
    var li = e.target.closest('li');
    if (!li) return;
    var index = parseInt(li.getAttribute('data-index'));
    li.style.transform = 'translateX(' + diffX + 'px)';
    var overlay = li.querySelector('.swipe-overlay');
    overlay.style.opacity = Math.min(Math.abs(diffX) / 80, 1);
    overlay.className = 'swipe-overlay ' + (diffX < 0 ? 'swipe-left' : 'swipe-right');
    overlay.textContent = diffX < 0 ? (todos[index].done ? 'UNDO' : 'DONE') : 'DELETE';
  }
}, { passive: false });

todoList.addEventListener('touchend', function(e) {
  if (isReorderMode) return;
  var li = e.target.closest('li');
  if (!li || !li.getAttribute('data-index')) return;
  clearTimeout(longPressTimer);
  var index = parseInt(li.getAttribute('data-index'));
  if (!swipeStartX) return;
  var diffX = li.style.transform ? parseInt(li.style.transform.replace('translateX(', '').replace('px)', '')) : 0;
  li.style.transition = 'transform 0.2s';
  li.style.transform = '';
  var overlay = li.querySelector('.swipe-overlay');
  overlay.style.opacity = 0;
  overlay.className = 'swipe-overlay';
  if (diffX < -60) toggleStrikethrough(index);
  else if (diffX > 60) deleteTodo(index);
  swipeStartX = 0;
  touchStartY = 0;
});

todoList.addEventListener('contextmenu', function(e) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  e.preventDefault();
  var li = e.target.closest('li');
  if (!li || !li.getAttribute('data-index')) return;
  var index = parseInt(li.getAttribute('data-index'));
  showItemMenu(e.clientX, e.clientY, index);
});

menuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  menuDropdown.classList.toggle('show');
});

document.addEventListener('click', function(e) {
  if (!menuDropdown.contains(e.target) && !menuBtn.contains(e.target)) menuDropdown.classList.remove('show');
  if (!itemMenu.contains(e.target) && !e.target.closest('#todo-list li') && !datePicker.contains(e.target) && !tagPicker.contains(e.target)) {
    itemMenu.classList.remove('show');
    currentItemIndex = null;
  }
  if (!datePicker.contains(e.target) && !e.target.closest('[data-action="set-due"]')) datePicker.classList.remove('show');
  if (!tagPicker.contains(e.target) && !e.target.closest('[data-action="tags"]')) tagPicker.classList.remove('show');
});

itemMenu.querySelectorAll('button').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var action = btn.getAttribute('data-action');
    var menuRect = itemMenu.getBoundingClientRect();
    itemMenu.classList.remove('show');
    if (currentItemIndex === null) return;
    switch(action) {
      case 'edit': editTodo(currentItemIndex); currentItemIndex = null; break;
      case 'set-due': showDatePicker(currentItemIndex, menuRect); break;
      case 'tags': showTagPicker(currentItemIndex, menuRect); break;
      case 'reorder': enterReorderMode(currentItemIndex); currentItemIndex = null; break;
    }
  });
});

dateOkBtn.addEventListener('click', function() {
  if (currentItemIndex !== null) {
    todos[currentItemIndex].dueDate = pickerDateInput.value || null;
    saveTodos();
    renderTodos();
  }
  datePicker.classList.remove('show');
  currentItemIndex = null;
});

dateCancelBtn.addEventListener('click', function() { datePicker.classList.remove('show'); currentItemIndex = null; });
dateRemoveBtn.addEventListener('click', function() {
  if (currentItemIndex !== null) { todos[currentItemIndex].dueDate = null; saveTodos(); renderTodos(); }
  datePicker.classList.remove('show');
  currentItemIndex = null;
});

tagOkBtn.addEventListener('click', function() {
  if (currentItemIndex !== null) {
    var tags = tagInput.value.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; });
    todos[currentItemIndex].tags = tags;
    saveTodos();
    renderTodos();
  }
  tagPicker.classList.remove('show');
  currentItemIndex = null;
});

tagCancelBtn.addEventListener('click', function() { tagPicker.classList.remove('show'); currentItemIndex = null; });

function exportTodos() {
  menuDropdown.classList.remove('show');
  var blob = new Blob([JSON.stringify(todos, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'todo-list.json';
  a.click();
  URL.revokeObjectURL(url);
  setLastActionDate();
}

function importTodos() {
  menuDropdown.classList.remove('show');
  fileInput.click();
}

fileInput.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(event) {
    try {
      var imported = JSON.parse(event.target.result);
      if (Array.isArray(imported) && imported.every(function(t) { return t.text !== undefined; })) {
        if (imported.length > 0 && confirm('Import ' + imported.length + ' items? This will append to your current list.')) {
          todos.push.apply(todos, imported.map(function(t) { return { text: t.text, done: !!t.done, dueDate: t.dueDate || null, tags: t.tags || [] }; }));
          saveTodos();
          renderTodos();
          setLastActionDate();
        }
      } else { alert('Invalid file format'); }
    } catch (err) { alert('Invalid JSON file'); }
  };
  reader.readAsText(file);
  fileInput.value = '';
});

moveDoneBtn.addEventListener('click', function() { menuDropdown.classList.remove('show'); moveDoneToBottom(); });
clearBtn.addEventListener('click', function() {
  if (todos.length === 0 || !confirm('Clear all items?')) return;
  todos = [];
  saveTodos();
  renderTodos();
});

exportBtn.addEventListener('click', exportTodos);
importBtn.addEventListener('click', importTodos);

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') addTodo(); });

renderTodos();
