// This file represents the database schema for the SehatNama system
// In a real application, this would be implemented using an ORM like Prisma or TypeORM

/*
Database Schema for SehatNama Healthcare System

Tables:
1. users - Stores user authentication information
2. patients - Stores patient information
3. doctors - Stores doctor information
4. admins - Stores admin information
5. appointments - Stores appointment information
6. prescriptions - Stores prescription information
7. prescription_medications - Stores medications in prescriptions
8. medications - Stores medication information
9. lab_reports - Stores lab report information
10. lab_report_results - Stores individual test results in lab reports
11. hospitals - Stores hospital and lab information
12. medical_history - Stores patient medical history
13. allergies - Stores patient allergies
14. documents - Stores scanned documents and notes (MongoDB)

Indexes:
- users: email (unique)
- patients: patient_id (unique)
- medications: name, category (for fast searches)
- prescriptions: patient_id, date (for fast searches)
- lab_reports: patient_id, date (for fast searches)
- appointments: patient_id, doctor_id, date (for fast searches)

PL/SQL Procedures:
1. create_prescription - Creates a prescription with medication checks
2. update_patient_history - Updates patient history when new data is added
3. check_medicine_interactions - Checks for medicine interactions
4. generate_patient_timeline - Generates a timeline of patient events
*/

// Example PL/SQL procedure for checking medicine interactions
/*
CREATE OR REPLACE PROCEDURE check_medicine_interactions(
  p_patient_id IN VARCHAR2,
  p_medicine_ids IN VARCHAR2_TABLE,
  p_warnings OUT SYS_REFCURSOR
)
AS
BEGIN
  OPEN p_warnings FOR
    WITH patient_meds AS (
      -- Get patient's current medications
      SELECT m.medication_id, m.name
      FROM prescriptions p
      JOIN prescription_medications pm ON p.prescription_id = pm.prescription_id
      JOIN medications m ON pm.medication_id = m.medication_id
      WHERE p.patient_id = p_patient_id
      AND p.status = 'Active'
    ),
    new_meds AS (
      -- Convert input medicine IDs to a table
      SELECT column_value AS medication_id
      FROM TABLE(p_medicine_ids)
    ),
    interactions AS (
      -- Check for interactions between new medicines
      SELECT 
        m1.name AS med1_name,
        m2.name AS med2_name,
        mi.severity,
        mi.description
      FROM new_meds nm1
      JOIN new_meds nm2 ON nm1.medication_id < nm2.medication_id
      JOIN medications m1 ON nm1.medication_id = m1.medication_id
      JOIN medications m2 ON nm2.medication_id = m2.medication_id
      JOIN medicine_interactions mi ON 
        (mi.med1_id = m1.medication_id AND mi.med2_id = m2.medication_id)
        OR (mi.med1_id = m2.medication_id AND mi.med2_id = m1.medication_id)
      
      UNION ALL
      
      -- Check for interactions between new and existing medicines
      SELECT 
        m1.name AS med1_name,
        m2.name AS med2_name,
        mi.severity,
        mi.description
      FROM new_meds nm
      JOIN patient_meds pm ON 1=1
      JOIN medications m1 ON nm.medication_id = m1.medication_id
      JOIN medications m2 ON pm.medication_id = m2.medication_id
      JOIN medicine_interactions mi ON 
        (mi.med1_id = m1.medication_id AND mi.med2_id = m2.medication_id)
        OR (mi.med1_id = m2.medication_id AND mi.med2_id = m1.medication_id)
    )
    -- Return all found interactions
    SELECT 
      med1_name,
      med2_name,
      severity,
      description,
      CASE 
        WHEN severity = 'severe' THEN 1
        WHEN severity = 'moderate' THEN 2
        ELSE 3
      END AS severity_order
    FROM interactions
    ORDER BY severity_order;
END;
*/

// Example MongoDB schema for storing documents and scanned reports
/*
{
  _id: ObjectId,
  patient_id: String,
  document_type: String, // "lab_report", "prescription", "doctor_note", etc.
  file_name: String,
  file_path: String,
  file_type: String, // "pdf", "jpg", "png", etc.
  upload_date: Date,
  metadata: {
    uploaded_by: String,
    related_id: String, // ID of related entity (appointment, prescription, etc.)
    tags: Array,
    extracted_text: String, // Text extracted from document using OCR
    processed: Boolean // Whether the document has been processed by OCR
  }
}
*/

// Role-based access control schema
/*
{
  role: String, // "doctor", "admin", "patient"
  permissions: [
    {
      resource: String, // "patients", "prescriptions", "lab_reports", etc.
      actions: Array // "create", "read", "update", "delete"
    }
  ]
}

// Example permissions:
// Doctor:
// - Full access to own patients
// - Read-only access to other doctors' patients
// - Full access to prescriptions they create
// - Full access to lab reports they request

// Admin:
// - Full access to all resources
// - System configuration access
// - User management access

// Patient:
// - Read-only access to own records
// - No access to other patients' records
// - Cannot modify medical data
*/

export {}
