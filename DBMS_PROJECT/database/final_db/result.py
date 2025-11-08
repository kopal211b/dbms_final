from connec import get_connection
from datetime import time

def view_timetable_by_section(section_name):
    conn = get_connection()
    if not conn:
        return []

    cursor = conn.cursor()
    query = """
        SELECT 
            t.day,
            ts.start_time,
            ts.end_time,
            sub.subject_name,
            te.teacher_name,
            r.room_name
        FROM Timetable t
        JOIN Section s ON t.section_id = s.section_id
        JOIN Subject sub ON t.subject_id = sub.subject_id
        JOIN Teacher te ON t.teacher_id = te.teacher_id
        JOIN Room r ON t.room_id = r.room_id
        JOIN Timeslot ts ON t.timeslot_id = ts.timeslot_id
        WHERE s.section_name = %s
        ORDER BY 
            CASE 
                WHEN t.day = 'Monday' THEN 1
                WHEN t.day = 'Tuesday' THEN 2
                WHEN t.day = 'Wednesday' THEN 3
                WHEN t.day = 'Thursday' THEN 4
                WHEN t.day = 'Friday' THEN 5
                WHEN t.day = 'Saturday' THEN 6
                WHEN t.day = 'Sunday' THEN 7
            END,
            ts.start_time;
    """
    cursor.execute(query, (section_name,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    timetable = []
    for r in rows:
        timetable.append({
            "day": r[0],
            "time": f"{r[1]} - {r[2]}",
            "subject": r[3],
            "teacher": r[4],
            "room": r[5]
        })
    return timetable


def view_timetable_by_teacher(teacher_id):
    conn = get_connection()
    if not conn:
        return []

    cursor = conn.cursor()
    query = """
        SELECT 
            t.day,
            ts.start_time,
            ts.end_time,
            sub.subject_name,
            s.section_name,
            r.room_name
        FROM Timetable t
        JOIN Teacher te ON t.teacher_id = te.teacher_id
        JOIN Subject sub ON t.subject_id = sub.subject_id
        JOIN Section s ON t.section_id = s.section_id
        JOIN Room r ON t.room_id = r.room_id
        JOIN Timeslot ts ON t.timeslot_id = ts.timeslot_id
        WHERE te.teacher_id = %s
        ORDER BY 
            CASE 
                WHEN t.day = 'Monday' THEN 1
                WHEN t.day = 'Tuesday' THEN 2
                WHEN t.day = 'Wednesday' THEN 3
                WHEN t.day = 'Thursday' THEN 4
                WHEN t.day = 'Friday' THEN 5
                WHEN t.day = 'Saturday' THEN 6
                WHEN t.day = 'Sunday' THEN 7
            END,
            ts.start_time;
    """
    cursor.execute(query, (teacher_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    timetable = []
    for r in rows:
        timetable.append({
            "day": r[0],
            "time": f"{r[1]} - {r[2]}",
            "subject": r[3],
            "section": r[4],
            "room": r[5]
        })
    return timetable


def get_teacher_free_slots(teacher_name, day):
    conn = get_connection()
    if not conn:
        return []

    cursor = conn.cursor()
    cursor.execute("""
        SELECT ts.start_time, ts.end_time
        FROM Timetable t
        JOIN Teacher te ON te.teacher_id = t.teacher_id
        JOIN Department d ON d.dept_id = te.dept_id
        JOIN Timeslot ts ON ts.timeslot_id = t.timeslot_id
        WHERE te.teacher_name ILIKE %s
          AND d.dept_id = 1
          AND t.day = %s
        ORDER BY ts.start_time
    """, (teacher_name, day))
    busy_slots = cursor.fetchall()
    cursor.close()
    conn.close()

    full_day_slots = [
        (time(8, 0), time(9, 0)),
        (time(9, 0), time(10, 0)),
        (time(10, 0), time(11, 0)),
        (time(11, 0), time(12, 0)),
        (time(12, 0), time(13, 0)),
        (time(13, 0), time(14, 0)),
        (time(14, 0), time(15, 0)),
        (time(15, 0), time(16, 0)),
        (time(16, 0), time(17, 0)),
        (time(17, 0), time(18, 0))
    ]

    busy_ranges = [(b[0], b[1]) for b in busy_slots]
    free_ranges = []
    current_free_start = None

    for slot_start, slot_end in full_day_slots:
        is_busy = any(bs <= slot_start < be for bs, be in busy_ranges)
        if not is_busy:
            if current_free_start is None:
                current_free_start = slot_start
        else:
            if current_free_start:
                free_ranges.append({"start": str(current_free_start), "end": str(slot_start)})
                current_free_start = None

    if current_free_start:
        free_ranges.append({"start": str(current_free_start), "end": str(time(18, 0))})

    return free_ranges


def get_free_rooms(day, start_time, end_time):
    conn = get_connection()
    if not conn:
        return []

    cursor = conn.cursor()
    query = """
        SELECT r.room_id, r.room_name
        FROM Room r
        WHERE NOT EXISTS (
            SELECT 1
            FROM Timetable t
            JOIN Timeslot ts ON t.timeslot_id = ts.timeslot_id
            WHERE t.room_id = r.room_id
              AND t.day = %s
              AND (ts.start_time < %s AND ts.end_time > %s)
        )
        ORDER BY r.room_name;
    """
    cursor.execute(query, (day, end_time, start_time))
    free_rooms = cursor.fetchall()
    cursor.close()
    conn.close()

    room_list = [{"room_id": r[0], "room_name": r[1]} for r in free_rooms]
    return room_list
