from flask import Flask, render_template, request, jsonify,session, redirect
from connec import get_connection
import secrets
from result import (
    view_timetable_by_section,
    view_timetable_by_teacher,
    get_teacher_free_slots,
    get_free_rooms,
    get_common_free_slots,
    get_teacher_status,
    get_common_free_slots_for_teachers
)

app = Flask(__name__)
#secret_key
secret_key = secrets.token_hex(16)
app.secret_key = secret_key
#  Main landing page 
@app.route('/')
def home():
    return render_template('main.html')

# --- Student page ---
@app.route('/student')
def student_page():
    return render_template('student.html')

# --- Teacher page ---
@app.route('/teacher')
def teacher_page():
    return render_template('teacher.html')

# --- APIs to fetch data ---
@app.route('/section_timetable', methods=['POST'])
def section_timetable():
    section_name = request.form.get('section_name')
    timetable = view_timetable_by_section(section_name)
    return jsonify({"section": section_name, "timetable": timetable})

@app.route('/teacher_timetable', methods=['POST'])
def teacher_timetable():
    teacher_id = request.form.get('teacher_id')
    timetable = view_timetable_by_teacher(teacher_id)
    return jsonify({"teacher_id": teacher_id, "timetable": timetable})

@app.route('/teacher_free', methods=['POST'])
def teacher_free():
    teacher_name = request.form.get('teacher_name')
    day = request.form.get('day')
    free_slots = get_teacher_free_slots(teacher_name, day)
    return jsonify({"teacher": teacher_name, "day": day, "free_slots": free_slots})

@app.route('/room_free', methods=['POST'])
def room_free():
    day = request.form.get('day')
    start_time = request.form.get('start_time')
    end_time = request.form.get('end_time')
    free_rooms = get_free_rooms(day, start_time, end_time)
    return jsonify({"day": day, "start": start_time, "end": end_time, "free_rooms": free_rooms})

@app.route('/sections_free', methods=['POST'])
def sections_free():
    day = request.form.get('day')
    sections = request.form.getlist('sections')  # for multiple sections (e.g. ['A', 'B', 'C'])
    free_slots = get_common_free_slots(sections, day)
    return jsonify({"day": day, "sections": sections, "free_slots": free_slots})

@app.route('/teacher_status', methods=['POST'])
def teacher_status():
    teacher_name = request.form.get('teacher_name')
    day = request.form.get('day')
    time_to_check = request.form.get('time')
    status = get_teacher_status(teacher_name, day, time_to_check)
    return jsonify({"teacher_name": teacher_name, "day": day, "time": time_to_check, "status": status})

@app.route('/teachers_free', methods=['POST'])
def teachers_free():
    day = request.form.get('day')
    teachers = request.form.getlist('teachers')  # allows multiple teachers
    free_slots = get_common_free_slots_for_teachers(teachers, day)
    return jsonify({"day": day, "teachers": teachers, "free_slots": free_slots})


@app.route('/request_temp_class', methods=['POST'])
def request_temp_class_route():
    teacher_id = session.get('teacher_id')
    data = request.get_json()
    subject_id = data.get('subject_id')
    sections = data.get('sections')
    day = data.get('day')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            CALL request_temp_class(%s, %s, %s, %s, %s, %s)
        """, (teacher_id, subject_id, day, start_time, end_time, sections))
        conn.commit()
        return jsonify({'success': True, 'message': 'Temporary class requested successfully.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cur.close()
        conn.close()
@app.route('/get_notifications/<int:section_id>')
def get_notifications(section_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT message, created_at
        FROM Notifications
        WHERE section_id = %s
        ORDER BY created_at DESC
    """, (section_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)


#ADMIN

@app.route("/admin_auth", methods=['POST'])
def admin_auth():
    username = request.form.get('username')
    password = request.form.get('password')

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT admin_id FROM admin WHERE username=%s AND password=%s", (username, password))
    result = cur.fetchone()
    cur.close()
    conn.close()

    if result:
        session["admin_authenticated"] = True
        return jsonify({"ok": True})
    else:
        return jsonify({"ok": False, "message":"Invalid credentials"}), 401


@app.route('/add_teacher', methods=['POST'])
def add_teacher():
    data = request.get_json()
    conn = get_connection()
    cur = conn.cursor()

    teacher_id = int(data['teacher_id'])
    name = data['name']
    dept_id = int(data['dept_id'])
    subject_ids = list(map(int, data['subject_ids']))

    cur.execute("CALL add_teacher_with_subject(%s, %s, %s, %s)", (teacher_id, name, dept_id, subject_ids))
    conn.commit()

    cur.close()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/delete_teacher', methods=['POST'])
def delete_teacher():
    data = request.get_json()
    teacher_id = data.get('teacher_id')

    if not teacher_id:
        return jsonify({'status': 'error', 'message': 'Teacher ID is required'}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("CALL delete_teacher_with_subjects(%s)", (int(teacher_id),))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Teacher deleted successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})





@app.route("/admin")
def admin_page():
    if not session.get("admin_authenticated"):
        return redirect("/")
    return render_template("admin.html")



if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000,debug=True)
