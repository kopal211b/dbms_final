from flask import Flask, render_template, request, jsonify,session, redirect
from connec import get_connection
import secrets
from result import (
    view_timetable_by_section,
    view_timetable_by_teacher,
    get_teacher_free_slots,
    get_free_rooms
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


@app.route("/admin")
def admin_page():
    if not session.get("admin_authenticated"):
        return redirect("/")
    return render_template("admin.html")



if __name__ == '__main__':
    app.run(host='0.0.0.0',port=8080,debug=True)
