export interface StudentListItemDto {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber?: string;
  email?: string;
  userName?: string;
}

export interface CreateStudentDto {
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber: string;
  email?: string;
}

export interface UpdateStudentDto {
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber: string;
  email?: string;
}

export interface StudentEnrollmentDto {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  isActive: boolean;
}

export interface TeacherDto {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber?: string;
  email?: string;
  userId?: string;
  classTeacherEnrollments: TeacherEnrollmentDto[];
}

export interface CreateTeacherDto {
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber: string;
  email?: string;
}

export interface UpdateTeacherDto {
  name: string;
  fatherName: string;
  motherName: string;
  nationalityNumber: string;
  email?: string;
}

export interface TeacherEnrollmentDto {
  id: string;
  teacherId: string;
  isMainTeacher: boolean;
  classId: string;
}

export interface EnrollInClassDto {
  classId: string;
  isMainTeacher?: boolean;
}
