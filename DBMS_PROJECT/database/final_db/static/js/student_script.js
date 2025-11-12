
// NAVBAR
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.dataset.target;

    // active state
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    pages.forEach(p => p.classList.remove('visible'));
    document.getElementById(targetId).classList.add('visible');
  });
});

// TIMETABLE  
document.getElementById('viewTimetableBtn').addEventListener('click', async () => {
  const semester = document.getElementById('semesterSelect').value;
  const section = document.getElementById('sectionSelect').value;
  const container = document.getElementById('timetableContainer');

  if (!semester || !section) {
    container.innerHTML = '<p style="color: #b91c1c;">Please select both semester and section.</p>';
    return;
  }

  const formData = new FormData();
  formData.append('section_name', section);

  try {
    const response = await fetch('/section_timetable', { method: 'POST', body: formData });
    const data = await response.json();

    if (!data.timetable || data.timetable.length === 0) {
      container.innerHTML = `<p>No timetable found for Semester ${semester}, Section ${section}</p>`;
      return;
    }

    // Group by day and collect unique time slots
    const grouped = {};
    const timeSlots = new Set();
    data.timetable.forEach(row => {
      if (!grouped[row.day]) grouped[row.day] = {};
      grouped[row.day][row.time] = row;
      timeSlots.add(row.time);
    });

    const timeSlotList = Array.from(timeSlots).sort();

    
    let html = `<h4 style="margin:0 0 10px 0;">Timetable — Semester ${semester}, Section ${section}</h4>
    <table class="timetable">
      <thead>
        <tr><th>Day</th>${timeSlotList.map(t => `<th>${t}</th>`).join('')}</tr>
      </thead>
      <tbody>`;

    Object.keys(grouped).forEach(day => {
      html += `<tr><td class="day-label">${day}</td>`;
      timeSlotList.forEach(t => {
        const row = grouped[day][t];
        if (row) {
          html += `<td class="slot-cell"><span class="sub">${row.subject}</span><br><span class="tch">${row.teacher}</span><br><span class="rm">${row.room}</span></td>`;
        } else {
          html += `<td class="slot-cell">-</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:#b91c1c;">Error fetching timetable.</p>';
  }
});

// Initialize Choices.js for multi-select teachers
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('sectionschoose')) {
    window.teacherChoices = new Choices('#sectionschoose', {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Select Section',
      noResultsText: 'No Section found',
      noChoicesText: 'No Sections available'
    });
  }
});



// TEACHER FREE SLOTS
document.getElementById('checkAvailabilityBtn').addEventListener('click', async () => {
  const teacher = document.getElementById('teacherSelect').value;
  const day = document.getElementById('teacherDay').value;
  const container = document.getElementById('teacherAvailabilityContainer');

  if (!teacher || !day) {
    container.innerHTML = '<p style="color:#b91c1c;">Please select teacher and day.</p>';
    return;
  }

  const formData = new FormData();
  formData.append('teacher_name', teacher);
  formData.append('day', day);

  try {
    const response = await fetch('/teacher_free', { method: 'POST', body: formData });
    const data = await response.json();

    if (!data.free_slots || data.free_slots.length === 0) {
      container.innerHTML = `<p>No free slots found for ${teacher} on ${day}.</p>`;
      return;
    }

    let html = `<h4 style="margin:0 0 10px 0;">Free Time Slots — ${teacher} (${day})</h4><ul>`;
    data.free_slots.forEach(slot => {
      html += `<li>${slot.start} - ${slot.end}</li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:#b91c1c;">Error fetching teacher availability.</p>';
  }
});


// Common Free Slots
document.getElementById('findCommonSlotsBtn').addEventListener('click', async () => {
  const day = document.getElementById('commonDay').value;
  const sections = [...document.getElementById('sectionschoose').selectedOptions].map(o => o.value);
  const container = document.getElementById('sectionsFreeResult');
  if (!day || !sections.length) {
    container.innerHTML = '<p class="error">Select a day and at least one section.</p>';
    return;
  }

  const params = new URLSearchParams();
  params.append('day', day);
  sections.forEach(s => params.append('sections', s));
  const res = await fetch('/sections_free', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await res.json();
  if (!data.free_slots?.length) {
    container.innerHTML = `<p>No common free slots on ${day} for sections ${sections.join(', ')}</p>`;
    return;
  }
  container.innerHTML = `<h4>Common Free Slots</h4>
  <ul>${data.free_slots.map(s => `<li>${s.start} - ${s.end}</li>`).join('')}</ul>`;
});

//  Teacher Status
document.getElementById('checkStatusBtn').addEventListener('click', async () => {
  const teacher = statusTeacher.value, day = statusDay.value, time = statusTime.value;
  const result = document.getElementById('teacherStatusResult');
  if (!teacher || !day || !time) {
    result.innerHTML = '<p class="error">Please fill all fields.</p>';
    return;
  }

  const fd = new FormData();
  fd.append('teacher_name', teacher);
  fd.append('day', day);
  fd.append('time', time);
  const res = await fetch('/teacher_status', { method: 'POST', body: fd });
  const data = await res.json();
  result.innerHTML = `<p class="info">${data.status}</p>`;
});

//  Notifications
document.getElementById('loadNotifications').addEventListener('click', async () => {
  const sectionId = document.getElementById('sectionNotifySelect').value;
  const container = document.getElementById('notificationList');
  const res = await fetch(`/get_notifications/${sectionId}`);
  const data = await res.json();
  if (!data.length) {
    container.innerHTML = `<p>No notifications for this section.</p>`;
    return;
  }
  container.innerHTML = `<ul>${data.map(n => `<li>${n.message} <small>(${n.created_at})</small></li>`).join('')}</ul>`;
});


