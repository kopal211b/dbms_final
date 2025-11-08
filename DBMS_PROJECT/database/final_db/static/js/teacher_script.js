//NAVBAR switching
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.dataset.target;

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    pages.forEach(p => p.classList.remove('visible'));
    document.getElementById(targetId).classList.add('visible');
  });
});

//TEACHER TIMETABLE
document.getElementById('viewTimetableBtn').addEventListener('click', async () => {
    const teacherId = document.getElementById('teacherIdInput').value;
    const container = document.getElementById('timetableContainer');

    if (!teacherId) {
        container.innerHTML = '<p style="color:#b91c1c;">Please enter your Teacher ID.</p>';
        return;
    }

    const formData = new FormData();
    formData.append('teacher_id', teacherId);

    try {
        const response = await fetch('/teacher_timetable', { method: 'POST', body: formData });
        const data = await response.json();

        if (!data.timetable || data.timetable.length === 0) {
            container.innerHTML = `<p>No timetable found for Teacher ID ${teacherId}</p>`;
            return;
        }

        const grouped = {};
        const timeSlots = new Set();
        data.timetable.forEach(row => {
            if (!grouped[row.day]) grouped[row.day] = {};
            grouped[row.day][row.time] = row;
            timeSlots.add(row.time);
        });

        const timeSlotList = Array.from(timeSlots).sort();

        let html = `<h4 style="margin:0 0 10px 0;">Timetable — Teacher ID ${teacherId}</h4>
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
                  html += `<td class="slot-cell"><span class="sub">${row.subject}</span><br><span class="tch">${row.section}</span><br><span class="rm">${row.room}</span></td>`;
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
        container.innerHTML = '<p style="color:#b91c1c;">Error fetching teacher timetable.</p>';
    }
});

// ROOM AVAILABILITY
document.getElementById('checkRoomBtn').addEventListener('click', async () => {
    const day = document.getElementById('roomDay').value;
    const start_time = document.getElementById('roomStartTime').value;
    const end_time = document.getElementById('roomEndTime').value;
    const container = document.getElementById('roomAvailabilityContainer');

    if (!day || !start_time || !end_time) {
        container.innerHTML = '<p style="color:#b91c1c;">Please select day, start time and end time.</p>';
        return;
    }

    const formData = new FormData();
    formData.append('day', day);
    formData.append('start_time', start_time);
    formData.append('end_time', end_time);

    try {
        const response = await fetch('/room_free', { method: 'POST', body: formData });
        const data = await response.json();

        if (!data.free_rooms || data.free_rooms.length === 0) {
            container.innerHTML = `<p>No free rooms found on ${day} between ${start_time} - ${end_time}</p>`;
            return;
        }

        let html = `<h4 style="margin:0 0 10px 0;">Free Rooms — ${day} (${start_time} - ${end_time})</h4><ul>`;
        data.free_rooms.forEach(slot => {
            html += `<li>${slot.room_name}</li>`;
        });
        html += `</ul>`;
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:#b91c1c;">Error fetching room availability.</p>';
    }
});
