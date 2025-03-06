document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const studentForm = document.getElementById('studentForm');
    const studentTableBody = document.getElementById('studentTableBody');
    const exportBtn = document.getElementById('exportBtn');
    const gradeSelect = document.getElementById('grado');
    const attendanceDate = document.getElementById('fecha');
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    attendanceDate.value = today;
    
    // Student data by grade
    const grades = ['1', '2', '3', '4', '5'];
    const students = {};
    
    // Initialize or load student data
    initializeStudentData();
    
    // Load attendance data
    loadTableData();
    
    // Update charts
    updateAllCharts();
    
    // Form submit event
    studentForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const grado = document.getElementById('grado').value;
        const fecha = document.getElementById('fecha').value;
        const presente = document.getElementById('presente').checked;
        
        // Create attendance data
        const attendanceData = {
            nombre,
            grado,
            fecha,
            presente
        };
        
        // Save attendance
        saveAttendanceData(attendanceData);
        
        // Update table
        loadTableData();
        
        // Update charts
        updateAllCharts();
        
        // Reset form
        studentForm.reset();
        attendanceDate.value = today;
    });
    
    // Export event
    exportBtn.addEventListener('click', function() {
        exportAllData();
    });
    
    // Grade filter change
    gradeSelect.addEventListener('change', function() {
        loadTableData();
    });
    
    // Initialize student data with 10 students per grade
    function initializeStudentData() {
        // Check if data already exists
        const existingData = localStorage.getItem('fagua_students');
        
        if (!existingData) {
            // Create 10 students per grade
            grades.forEach(grade => {
                students[grade] = [];
                for (let i = 1; i <= 10; i++) {
                    students[grade].push({
                        id: `G${grade}-${i}`,
                        nombre: `Estudiante ${i} de ${grade}°`,
                        grado: grade
                    });
                }
            });
            
            // Save to localStorage
            localStorage.setItem('fagua_students', JSON.stringify(students));
        } else {
            // Load existing students
            Object.assign(students, JSON.parse(existingData));
        }
    }
    
    // Save attendance data
    function saveAttendanceData(data) {
        // Get existing attendance records
        let attendance = JSON.parse(localStorage.getItem('fagua_attendance')) || {};
        
        // Create date key if doesn't exist
        if (!attendance[data.fecha]) {
            attendance[data.fecha] = [];
        }
        
        // Check if record already exists
        const existingIndex = attendance[data.fecha].findIndex(
            record => record.nombre === data.nombre && record.grado === data.grado
        );
        
        if (existingIndex >= 0) {
            // Update existing record
            attendance[data.fecha][existingIndex] = data;
        } else {
            // Add new record
            attendance[data.fecha].push(data);
        }
        
        // Save back to localStorage
        localStorage.setItem('fagua_attendance', JSON.stringify(attendance));
    }
    
    // Load table data
    function loadTableData() {
        const selectedGrade = gradeSelect.value;
        const attendance = JSON.parse(localStorage.getItem('fagua_attendance')) || {};
        const currentDate = attendanceDate.value;
        
        // Clear table
        studentTableBody.innerHTML = '';
        
        // Get students for the selected grade
        const gradeStudents = selectedGrade === 'all' 
            ? Object.values(students).flat() 
            : students[selectedGrade] || [];
        
        // Add rows for each student
        gradeStudents.forEach(student => {
            // Find attendance record
            let isPresent = false;
            let recordExists = false;
            
            if (attendance[currentDate]) {
                const record = attendance[currentDate].find(
                    r => r.nombre === student.nombre && r.grado === student.grado
                );
                
                if (record) {
                    recordExists = true;
                    isPresent = record.presente;
                }
            }
            
            // Create row
            const row = document.createElement('tr');
            row.className = isPresent ? 'student-present' : (recordExists ? 'student-absent' : '');
            
            row.innerHTML = `
                <td>${student.nombre}</td>
                <td>${student.grado}°</td>
                <td>${currentDate}</td>
                <td>
                    <label class="checkbox-group">
                        <input type="checkbox" class="attendance-checkbox" 
                               data-name="${student.nombre}" 
                               data-grade="${student.grado}" 
                               ${isPresent ? 'checked' : ''}>
                        ${isPresent ? 'Presente' : 'Ausente'}
                    </label>
                </td>
                <td>
                    <button class="action-btn" onclick="toggleAttendance('${student.nombre}', '${student.grado}')">Cambiar</button>
                </td>
            `;
            
            studentTableBody.appendChild(row);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const nombre = this.getAttribute('data-name');
                const grado = this.getAttribute('data-grade');
                toggleAttendance(nombre, grado);
            });
        });
    }
    
    // Toggle attendance status
    window.toggleAttendance = function(nombre, grado) {
        const currentDate = attendanceDate.value;
        const attendance = JSON.parse(localStorage.getItem('fagua_attendance')) || {};
        
        if (!attendance[currentDate]) {
            attendance[currentDate] = [];
        }
        
        // Find if student already has a record
        const existingIndex = attendance[currentDate].findIndex(
            record => record.nombre === nombre && record.grado === grado
        );
        
        if (existingIndex >= 0) {
            // Toggle attendance status
            attendance[currentDate][existingIndex].presente = !attendance[currentDate][existingIndex].presente;
        } else {
            // Create new record
            attendance[currentDate].push({
                nombre,
                grado,
                fecha: currentDate,
                presente: true // Default to present when first creating
            });
        }
        
        // Save and reload
        localStorage.setItem('fagua_attendance', JSON.stringify(attendance));
        loadTableData();
        updateAllCharts();
    };
    
    // Export attendance data
    function exportAllData() {
        const attendance = JSON.parse(localStorage.getItem('fagua_attendance')) || {};
        
        if (Object.keys(attendance).length === 0) {
            alert('No hay registros de asistencia para exportar');
            return;
        }
        
        // Create blob and download
        const dataStr = JSON.stringify(attendance, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asistencia_fagua_' + new Date().toISOString().slice(0, 10) + '.json';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
        
        alert('Datos de asistencia guardados correctamente');
    }
    
    // Update all attendance charts
    function updateAllCharts() {
        const attendance = JSON.parse(localStorage.getItem('fagua_attendance')) || {};
        const currentDate = attendanceDate.value;
        
        // Clear charts container
        const chartsContainer = document.getElementById('chartsContainer');
        chartsContainer.innerHTML = '';
        
        // Create chart for each grade
        grades.forEach(grade => {
            const chartBox = document.createElement('div');
            chartBox.className = 'chart-box';
            chartBox.innerHTML = `<h3>Asistencia ${grade}° Grado</h3>`;
            
            // Get attendance data for this grade
            const gradeStudents = students[grade] || [];
            let present = 0;
            let absent = 0;
            
            if (attendance[currentDate]) {
                gradeStudents.forEach(student => {
                    const record = attendance[currentDate].find(
                        r => r.nombre === student.nombre && r.grado === student.grado
                    );
                    
                    if (record) {
                        record.presente ? present++ : absent++;
                    } else {
                        // Count as absent if no record
                        absent++;
                    }
                });
            } else {
                // If no records for this date, all are absent
                absent = gradeStudents.length;
            }
            
            // Create SVG chart
            const totalStudents = gradeStudents.length;
            const presentPercent = totalStudents > 0 ? (present / totalStudents) * 100 : 0;
            const absentPercent = totalStudents > 0 ? (absent / totalStudents) * 100 : 0;
            
            chartBox.innerHTML += `
                <svg width="100%" height="200" viewBox="0 0 300 200">
                    <rect x="10" y="10" width="${presentPercent * 2.8}" height="40" fill="#4CAF50" />
                    <rect x="10" y="60" width="${absentPercent * 2.8}" height="40" fill="#f44336" />
                    <text x="${presentPercent * 2.8 + 20}" y="35" fill="#333">Presentes (${present})</text>
                    <text x="${absentPercent * 2.8 + 20}" y="85" fill="#333">Ausentes (${absent})</text>
                </svg>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="attendance-icon present-icon"></span> Presentes
                    </div>
                    <div class="legend-item">
                        <span class="attendance-icon absent-icon"></span> Ausentes
                    </div>
                </div>
            `;
            
            chartsContainer.appendChild(chartBox);
        });
    }
});