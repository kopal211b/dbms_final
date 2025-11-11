// ------------------- Tabs -------------------
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tabpanel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.target;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// ------------------- Teachers -------------------
const teachersTable = document.getElementById('teachersTable');

function renderTeachers(list) {
  if (!list || list.length === 0) {
    teachersTable.innerHTML = '<p class="muted">No teachers found.</p>';
    return;
  }
  const rows = list.map(t => `
    <div class="row">
      <div class="cell"><b>${t.teacher_id}</b></div>
      <div class="cell">${t.name}</div>
      <div class="cell">${t.department || '-'}</div>
      <div class="cell">${t.subjects?.join(', ') || '-'}</div>
    </div>`).join('');
  teachersTable.innerHTML = `
    <div class="table-head">
      <div class="cell">ID</div>
      <div class="cell">Name</div>
      <div class="cell">Department</div>
      <div class="cell">Subjects</div>
    </div>${rows}`;
}

async function fetchTeachers() {
  const res = await fetch('/admin/teachers');
  const data = await res.json();
  renderTeachers(data.teachers || []);
}

// Add Teacher
document.getElementById('addTeacherForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    teacher_id: document.getElementById('teacher_id').value,
    name: document.getElementById('teacher_name').value,
    dept_id: document.getElementById('dept_id').value,
    subject_ids: document.getElementById('subject_ids').value.split(',').map(id => id.trim())
  };
  const res = await fetch('/add_teacher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  alert(result.message);
  fetchTeachers();
});

// Delete Teacher
document.getElementById('deleteTeacherBtn').addEventListener('click', async () => {
  const teacherId = document.getElementById('delete_teacher_id').value;
  if (!teacherId) return alert('Please enter a teacher ID.');

  const res = await fetch('/delete_teacher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacher_id: teacherId })
  });
  const result = await res.json();

  if (result.status === 'success') {
    alert('Teacher deleted successfully.');
    fetchTeachers();
  } else {
    alert('Error: ' + result.message);
  }
});

// Refresh
document.getElementById('refreshTeachersBtn')?.addEventListener('click', fetchTeachers);
fetchTeachers();

// ------------------- Overview -------------------
function loadOverview() {
  const freeTeachers = ['Dr. Neha Gupta', 'Prof. Amit Singh', 'Dr. Kavita Joshi'];
  const freeRooms = ['A2', 'A5', 'Lab L3'];
  document.getElementById('freeTeachers').innerHTML = freeTeachers.map(t => `<li>${t}</li>`).join('');
  document.getElementById('freeRooms').innerHTML = freeRooms.map(r => `<li>${r}</li>`).join('');
}
document.getElementById('refreshFreeTeachersBtn')?.addEventListener('click', loadOverview);
document.getElementById('refreshFreeRoomsBtn')?.addEventListener('click', loadOverview);
loadOverview();
