
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

