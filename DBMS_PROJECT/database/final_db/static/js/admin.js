//Tabs 
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

//Teacherrs
const teachersTable = document.getElementById('teachersTable');

function renderTeachers(list) {
  if (!list || list.length === 0) {
    teachersTable.innerHTML = '<p class="muted">No teachers found.</p>';
    return;
  }
  const rows = list.map(t => `
    <div class="row">
      <div class="cell"><b>${t.teacher_id}</b></div>
      <div class="cell">${t.teacher_name}</div>
      <div class="cell">${t.dept_name}</div>
    </div>`).join('');
  teachersTable.innerHTML = `
    <div class="table-head">
      <div class="cell">ID</div>
      <div class="cell">Name</div>
      <div class="cell">Department</div>
    </div>${rows}`;
}

// demo datta
let demoTeachers = [
  { teacher_id: 'T001', teacher_name: 'Dr. Priya Nair', dept_name: 'CSE' },
  { teacher_id: 'T002', teacher_name: 'Prof. Amit Singh', dept_name: 'CSE' },
];
renderTeachers(demoTeachers);

document.getElementById('refreshTeachersBtn')?.addEventListener('click', () => {
  // TODO: fetch('/admin/teachers')
  renderTeachers(demoTeachers);
});

document.getElementById('addTeacherBtn')?.addEventListener('click', () => {
  const id = document.getElementById('teacher_id').value.trim();
  const name = document.getElementById('teacher_name').value.trim();
  const dept = document.getElementById('dept_name').value.trim();
  if (!id || !name || !dept) { alert('Fill all fields'); return; }
  demoTeachers.push({ teacher_id: id, teacher_name: name, dept_name: dept });
  renderTeachers(demoTeachers);
});

document.getElementById('editTeacherBtn')?.addEventListener('click', () => {
  const id = document.getElementById('teacher_id').value.trim();
  const name = document.getElementById('teacher_name').value.trim();
  const dept = document.getElementById('dept_name').value.trim();
  const idx = demoTeachers.findIndex(t => t.teacher_id === id);
  if (idx === -1) { alert('Teacher ID not found'); return; }
  if (name) demoTeachers[idx].teacher_name = name;
  if (dept) demoTeachers[idx].dept_name = dept;
  renderTeachers(demoTeachers);
});

document.getElementById('deleteTeacherBtn')?.addEventListener('click', () => {
  const id = document.getElementById('teacher_id').value.trim();
  demoTeachers = demoTeachers.filter(t => t.teacher_id !== id);
  renderTeachers(demoTeachers);
});

//Sections
const sectionsTable = document.getElementById('sectionsTable');

function renderSections(list) {
  if (!list || list.length === 0) {
    sectionsTable.innerHTML = '<p class="muted">No sections found.</p>';
    return;
  }
  const rows = list.map(s => `
    <div class="row">
      <div class="cell"><b>${s.section_id}</b></div>
      <div class="cell">${s.section_name}</div>
      <div class="cell">${s.sem_id}</div>
      <div class="cell">${s.strength}</div>
    </div>`).join('');
  sectionsTable.innerHTML = `
    <div class="table-head">
      <div class="cell">ID</div>
      <div class="cell">Section</div>
      <div class="cell">Semester</div>
      <div class="cell">Strength</div>
    </div>${rows}`;
}

let demoSections = [
  { section_id: 'S01', section_name: 'A', sem_id: 5, strength: 60 },
  { section_id: 'S02', section_name: 'B', sem_id: 5, strength: 58 },
];
renderSections(demoSections);

document.getElementById('refreshSectionsBtn')?.addEventListener('click', () => {
  renderSections(demoSections);
});

document.getElementById('addSectionBtn')?.addEventListener('click', () => {
  const id = document.getElementById('section_id').value.trim();
  const name = document.getElementById('section_name').value.trim();
  const sem = document.getElementById('sem_id').value.trim();
  const strength = document.getElementById('strength').value.trim();
  if (!id || !name || !sem || !strength) { alert('Fill all fields'); return; }
  demoSections.push({ section_id: id, section_name: name, sem_id: +sem, strength: +strength });
  renderSections(demoSections);
});

document.getElementById('editSectionBtn')?.addEventListener('click', () => {
  const id = document.getElementById('section_id').value.trim();
  const idx = demoSections.findIndex(s => s.section_id === id);
  if (idx === -1) { alert('Section ID not found'); return; }
  const name = document.getElementById('section_name').value.trim();
  const sem = document.getElementById('sem_id').value.trim();
  const strength = document.getElementById('strength').value.trim();
  if (name) demoSections[idx].section_name = name;
  if (sem) demoSections[idx].sem_id = +sem;
  if (strength) demoSections[idx].strength = +strength;
  renderSections(demoSections);
});

document.getElementById('deleteSectionBtn')?.addEventListener('click', () => {
  const id = document.getElementById('section_id').value.trim();
  demoSections = demoSections.filter(s => s.section_id !== id);
  renderSections(demoSections);
});

//Timetable with (manual entry)
const ttPreview = document.getElementById('ttPreview');
let ttEntries = [];

function renderTT() {
  if (ttEntries.length === 0) {
    ttPreview.innerHTML = '<p class="muted">No entries yet.</p>';
    return;
  }
  const rows = ttEntries.map(e => `
    <div class="row">
      <div class="cell"><b>${e.day}</b></div>
      <div class="cell">${e.time}</div>
      <div class="cell">${e.subject}</div>
      <div class="cell">${e.teacher_id}</div>
      <div class="cell">${e.section_id}</div>
      <div class="cell">${e.room}</div>
    </div>`).join('');
  ttPreview.innerHTML = `
    <div class="table-head">
      <div class="cell">Day</div>
      <div class="cell">Time</div>
      <div class="cell">Subject</div>
      <div class="cell">Teacher ID</div>
      <div class="cell">Section ID</div>
      <div class="cell">Room</div>
    </div>${rows}`;
}

document.getElementById('addTTBtn')?.addEventListener('click', () => {
  const day = document.getElementById('tt_day').value;
  const time = document.getElementById('tt_time').value.trim();
  const subject = document.getElementById('tt_subject').value.trim();
  const teacher_id = document.getElementById('tt_teacher_id').value.trim();
  const section_id = document.getElementById('tt_section_id').value.trim();
  const room = document.getElementById('tt_room').value.trim();
  if (!day || !time || !subject || !teacher_id || !section_id || !room) { alert('Fill all fields'); return; }
  ttEntries.push({ day, time, subject, teacher_id, section_id, room });
  renderTT();
});

document.getElementById('clearTTBtn')?.addEventListener('click', () => {
  document.getElementById('tt_day').value = '';
  document.getElementById('tt_time').value = '';
  document.getElementById('tt_subject').value = '';
  document.getElementById('tt_teacher_id').value = '';
  document.getElementById('tt_section_id').value = '';
  document.getElementById('tt_room').value = '';
});

document.getElementById('clearPreviewBtn')?.addEventListener('click', () => {
  ttEntries = [];
  renderTT();
});

renderTT();

// Overview
function loadOverview() {
  // Replace with backend
  const freeTeachers = ['Dr. Neha Gupta', 'Prof. Amit Singh', 'Dr. Kavita Joshi'];
  const freeRooms = ['A2', 'A5', 'Lab L3'];

  document.getElementById('freeTeachers').innerHTML = freeTeachers.map(t => `<li>${t}</li>`).join('');
  document.getElementById('freeRooms').innerHTML = freeRooms.map(r => `<li>${r}</li>`).join('');
}
loadOverview();

document.getElementById('refreshFreeTeachersBtn')?.addEventListener('click', loadOverview);
document.getElementById('refreshFreeRoomsBtn')?.addEventListener('click', loadOverview);
