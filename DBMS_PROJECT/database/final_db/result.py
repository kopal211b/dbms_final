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

def get_common_free_slots(sections, day):
    conn = get_connection()
    if not conn:
        return []

    cur = conn.cursor()

    query = """
    WITH all_slots AS (
        SELECT unnest(ARRAY[
            '08:00-09:00', '09:00-10:00', '10:00-11:00',
            '11:00-12:00', '12:00-13:00', '13:00-14:00',
            '14:00-15:00', '15:00-16:00', '16:00-17:00',
            '17:00-18:00'
        ]) AS slot
    ),
    busy AS (
        SELECT DISTINCT ts.start_time AS busy_start, ts.end_time AS busy_end, t.section_id
        FROM Timetable t
        JOIN Timeslot ts ON t.timeslot_id = ts.timeslot_id
        WHERE t.day = %s
          AND t.section_id IN (
              SELECT section_id FROM Section WHERE section_name = ANY(%s)
          )
    ),
    section_count AS (
        SELECT COUNT(DISTINCT section_id) AS total_sections FROM busy
    ),
    free_slots AS (
        SELECT
            split_part(a.slot,'-',1)::time AS start_time,
            split_part(a.slot,'-',2)::time AS end_time
        FROM all_slots a
        WHERE NOT EXISTS (
            SELECT 1
            FROM busy b
            WHERE NOT (
                (split_part(a.slot,'-',2)::time) <= b.busy_start
                OR (split_part(a.slot,'-',1)::time) >= b.busy_end
            )
        )
    )
    SELECT start_time, end_time
    FROM free_slots
    ORDER BY start_time;
    """

    cur.execute(query, (day, sections))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def get_teacher_status(teacher_name, day, time_to_check):
    conn = get_connection()
    if not conn:
        return []

    cur = conn.cursor()

    query = """
    WITH teacher_status AS (
        SELECT 
            te.teacher_name,
            s.section_name,
            t.room_id,
            ts.start_time,
            ts.end_time,
            t.day
        FROM teacher te
        LEFT JOIN timetable t ON te.teacher_id = t.teacher_id
        LEFT JOIN section s ON t.section_id = s.section_id
        LEFT JOIN timeslot ts ON t.timeslot_id = ts.timeslot_id
        WHERE te.teacher_name = %s
          AND t.day = %s
    )
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM teacher_status 
                WHERE %s BETWEEN start_time AND end_time
            )
            THEN (
                SELECT CONCAT('Teaching Section ', section_name, ' in Room ', room_id)
                FROM teacher_status 
                WHERE %s BETWEEN start_time AND end_time
                LIMIT 1
            )
            ELSE CONCAT('In office/cabin assigned to ', %s)
        END AS status;
    """

    cur.execute(query, (teacher_name, day, time_to_check, time_to_check, teacher_name))
    result = cur.fetchone()[0]
    cur.close()
    conn.close()
    return result

def get_common_free_slots_for_teachers(teachers, day):
    conn = get_connection()
    if not conn:
        return []

    cur = conn.cursor()

    query = """
    WITH all_slots AS (
        SELECT unnest(ARRAY[
            '08:00-09:00', '09:00-10:00', '10:00-11:00',
            '11:00-12:00', '12:00-13:00', '13:00-14:00',
            '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
        ]) AS slot
    ),
    selected_teachers AS (
        SELECT teacher_id, teacher_name
        FROM teacher
        WHERE teacher_name = ANY(%s)
    ),
    busy AS (
        SELECT DISTINCT ts.start_time, ts.end_time, t.teacher_id
        FROM timetable t
        JOIN timeslot ts ON t.timeslot_id = ts.timeslot_id
        WHERE t.day = %s
          AND t.teacher_id IN (SELECT teacher_id FROM selected_teachers)
    ),
    total_teachers AS (
        SELECT COUNT(DISTINCT teacher_id) AS cnt FROM selected_teachers
    )
    SELECT 
        split_part(a.slot,'-',1)::time AS start_time,
        split_part(a.slot,'-',2)::time AS end_time
    FROM all_slots a, total_teachers tt
    WHERE (
        SELECT COUNT(DISTINCT teacher_id)
        FROM busy b
        WHERE NOT (
            (split_part(a.slot,'-',2)::time <= b.start_time)
            OR (split_part(a.slot,'-',1)::time >= b.end_time)
        )
    ) = 0
    ORDER BY start_time;
    """

    cur.execute(query, (teachers, day))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

#REMOVE THIS WHEN CONNECTED TO FRONTEND - : ADD GET_COMMMON_FREE_SLOTS QUERY BOTH IN STDUENT PAGE AND TEACHER PAGE
#FOR STUDENT PAGE-> TO CHECK HIS FRIENDS ARE FREE SO THAT THEY CAN DO GROUP STUDY
#FOR TEACHER PAGE-> TO CHECK IF A CLASS CAN BE CONDUCTED FOR MULTIPLE SECTION IF THEY ARE FREE AT THE SAME TIME
'''if __name__ == '__main__':
    slots = get_common_free_slots(['A','B','C'], 'Thursday')  #input is mutiple sections ticked and day choosen to check when are multiple section free together 
    print(slots)
    
    print(get_teacher_status('Dr. Priya Nair', 'Monday', '8:00:00')) #button in stduent page to check with th teacher name,day and time to see where the etacher is present
    
    free_slots = get_common_free_slots_for_teachers(
    ['Dr. Priya Nair', 'Prof. Manoj Verma'],
    'Monday'
        )
    for start, end in free_slots:
         print(f"{start} - {end}")  #add this button in teacher page so that mutiple teacher can do a meeting 

         '''
