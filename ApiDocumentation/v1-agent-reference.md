# AlAshmar API v1 Technical Reference for Agents

## 1. API Overview & Architecture

`ApiDocumentation/v1.json` is an OpenAPI 3.1.1 specification for a single-server backend at `http://alashmar.runasp.net/`. The API is resource-oriented and models an educational/admin domain centered on students, teachers, classes/halaqas, attendance, points, memorization progress, forms, and aggregated reports.

The spec follows a predictable pattern:

- Collection endpoints expose list, create, and sometimes paged query variants.
- Item endpoints expose read, update, and delete by `{id}`.
- Relationship endpoints expose parent-child traversal using identifiers such as `semesterId`, `courseId`, `teacherId`, `studentId`, `halaqaId`, `formId`, and `questionId`.
- Report endpoints are read-only aggregations that combine summary DTOs with time-bucketed detail records.
- Auth endpoints return JWT-style tokens and refresh tokens.
- Attachment endpoints accept multipart file uploads via `IFormFile`.

### Data Model Relationship Map

The domain is centered on a few core chains:

- `Semester -> Course -> Halaqa -> Teacher/Student activity`
- `Teacher -> ClassTeacherEnrollment -> Attendance / Points / Student progress`
- `Student -> Attendance / Points / Memorization / Attachments`
- `Form -> FormQuestion -> FormQuestionOption -> FormResponse -> FormAnswer`
- `Category / Event / Enrollment / Semester` identifiers are reused across points, attendance, and reporting endpoints.

### Security and Transport Notes

- The server is documented as a Bearer JWT API, but many operations have empty security requirements in the spec.
- Responses are frequently duplicated across `application/json`, `text/json`, and `text/plain`.
- Upload routes use `multipart/form-data`.
- Many endpoints return 200 only, so a generated client should not assume detailed error models are present in the spec.

### Schema Surface

- The spec contains 132 component schemas.
- There are many create/update/read DTO triplets that differ only in whether an `id` is present and whether relation fields are required.
- Several schemas are wrappers around the same pagination envelope.

## 2. Data Schema Dictionary

### 2.1 Auth and Session Schemas

#### `LoginRequest`
- `username` | String | Login identity submitted to `/api/Auth/login`.
- `password` | String | Cleartext password submitted to `/api/Auth/login`.
- Constraints: required request body; no format constraints are declared beyond non-empty strings.
- Relationships: consumed by `AuthResult` generation on successful login.

#### `AuthResult`
- `token` | String | JWT access token returned on successful login.
- `expiresAt` | String or DateTime-style string | Expiration timestamp for the access token.
- Constraints: returned by `/api/Auth/login`.
- Relationships: stored client-side and used for authenticated requests.

#### `RefreshTokenRequest`
- `refreshToken` | String | Refresh token used to exchange for a new access token.
- Constraints: required request body for `/api/Auth/refresh`.
- Relationships: paired with `RefreshTokenResponse`.

#### `RefreshTokenResponse`
- `accessToken` | String | New JWT access token.
- Constraints: returned by `/api/Auth/refresh`.
- Relationships: replaces the previous access token.

### 2.2 Primitive Enums and Infrastructure Schemas

#### `AudienceType`
- Type: Integer-coded enum placeholder.
- Description: Audience classification for forms.
- Constraints: the spec does not publish the value set.
- Relationships: used by `FormDto`, `CreateFormDto`, and `UpdateFormDto`.

#### `FormType`
- Type: Integer-coded enum placeholder.
- Description: Form classification.
- Constraints: value set is not enumerated in the spec.
- Relationships: used by form DTOs.

#### `QuestionType`
- Type: Integer-coded enum placeholder.
- Description: Question input type.
- Constraints: value set is not enumerated in the spec.
- Relationships: used by question DTOs.

#### `ReportPeriodType`
- Type: Integer-coded enum placeholder.
- Description: Period selector for report endpoints.
- Constraints: value set is not enumerated in the spec.
- Relationships: used by report queries and report DTOs.

#### `IFormFile`
- Type: Binary file payload.
- Description: Uploaded file content.
- Constraints: appears in multipart upload endpoints.
- Relationships: used by attachment endpoints for teachers, students, and managers.

### 2.3 Reference / Catalog DTOs

#### `AllowableExtensionDto`
- `id` | UUID/String | Identifier.
- `extName` | String | Extension name.
- Relationships: read model for allowable file extensions.

#### `CreateAllowableExtensionDto`
- `extName` | String | Extension name to create.
- Relationships: create payload for `AllowableExtensionDto`.

#### `UpdateAllowableExtensionDto`
- `extName` | String | Updated extension name.
- Relationships: update payload for an allowable extension record.

#### `BookDto`
- `id` | UUID/String | Identifier.
- `name` | String | Book name.
- Relationships: referenced by hadith models.

#### `CreateBookDto`
- `name` | String | Book name.
- Relationships: create payload for books.

#### `UpdateBookDto`
- `name` | String | Updated book name.
- Relationships: update payload for books.

#### `SemesterDto`
- `id` | UUID/String | Identifier.
- `name` | String | Semester name.
- `startDate` | Nullable DateTime-style string | Semester start.
- `endDate` | Nullable DateTime-style string | Semester end.
- Relationships: parent of courses; used by semester reports and student/teacher semester-scoped reports.

#### `CreateSemesterDto`
- `name` | String | Semester name.
- `startDate` | Nullable DateTime-style string | Start date.
- `endDate` | Nullable DateTime-style string | End date.
- Relationships: create payload for semesters.

#### `UpdateSemesterDto`
- `name` | String | Updated semester name.
- `startDate` | Nullable DateTime-style string | Updated start date.
- `endDate` | Nullable DateTime-style string | Updated end date.
- Relationships: update payload for semesters.

#### `PointCategoryDto`
- `id` | UUID/String | Identifier.
- `type` | String | Category label.
- Relationships: referenced by point records and breakdown reports.

#### `CreatePointCategoryDto`
- `type` | String | Category label.
- Relationships: create payload for point categories.

#### `UpdatePointCategoryDto`
- `type` | String | Updated category label.
- Relationships: update payload for point categories.

#### `RoleDto`
- `id` | UUID/String | Identifier.
- `type` | String | Role name/type.
- `permissions` | Array of `PermissionDto` | Assigned permissions.
- Relationships: admin role model.

#### `CreateRoleDto`
- `type` | String | Role name/type.
- Relationships: create payload for roles.

#### `UpdateRoleDto`
- `type` | String | Updated role name/type.
- Relationships: update payload for roles.

#### `PermissionDto`
- `id` | UUID/String | Identifier.
- `name` | String | Permission name.
- `description` | String | Human-readable description.
- `resource` | String | Affected resource name.
- `action` | String | Allowed action.
- Relationships: nested in `RoleDto`.

#### `Course` family
- `CreateCourseDto` | `eventName` (String), `semesterId` (UUID/String).
- `UpdateCourseDto` | `eventName` (String), `semesterId` (UUID/String).
- `CourseDto` is not present as a named component in the inventory; the spec uses create/update payloads and collection/item endpoints.
- Relationships: `semesterId` links course records to semesters.

#### `Halaqa` family
- `CreateHalaqaDto` | `className` (String), `courseId` (UUID/String).
- `UpdateHalaqaDto` | `className` (String), `courseId` (UUID/String).
- `HalaqaDto` is not present as a named component in the inventory; the spec uses create/update payloads and collection/item endpoints.
- Relationships: `courseId` links halaqas to courses.

### 2.4 Manager / Admin DTOs

#### `CreateManagerFormDto`
- `name` | String | Manager display name.
- `userName` | String | Login username.
- `password` | String | Initial password.
- Relationships: create payload for manager accounts.

#### `UpdateManagerDto`
- `name` | String | Updated display name.
- `userId` | Nullable UUID/String | Bound user identity if present.
- Relationships: update payload for managers.

#### `UpdatePasswordDto`
- `newPassword` | String | Replacement password.
- Relationships: used by manager, student, and teacher password-change endpoints.

### 2.5 Teacher Profile and Contact DTOs

#### `CreateTeacherDto`
- `name` | String | Teacher first/display name.
- `fatherName` | String | Father name.
- `motherName` | String | Mother name.
- `nationalityNumber` | String | National identifier.
- `email` | Nullable String | Contact email.
- `userId` | Nullable UUID/String | Linked user account.
- `contactInfos` | Nullable Array of `CreateTeacherContactInfoDto` | Optional contact records.
- Relationships: create payload for a teacher profile.

#### `UpdateTeacherDto`
- `name` | String | Updated name.
- `fatherName` | String | Updated father name.
- `motherName` | String | Updated mother name.
- `nationalityNumber` | String | Updated national identifier.
- `email` | Nullable String | Updated email.
- Relationships: update payload for a teacher profile.

#### `CreateTeacherContactInfoDto`
- `number` | String | Contact number.
- `email` | Nullable String | Optional contact email.
- `isActive` | Boolean | Active flag; defaults to true.
- Relationships: nested in `CreateTeacherDto`.

### 2.6 Student Profile DTOs

#### `CreateStudentDto`
- `name` | String | Student display name.
- `fatherName` | String | Father name.
- `motherName` | String | Mother name.
- `nationalityNumber` | String | National identifier.
- `email` | Nullable String | Contact email.
- Relationships: create payload for a student profile.

#### `UpdateStudentDto`
- `name` | String | Updated name.
- `fatherName` | String | Updated father name.
- `motherName` | String | Updated mother name.
- `nationalityNumber` | String | Updated national identifier.
- `email` | Nullable String | Updated email.
- Relationships: update payload for a student profile.

#### `StudentBriefDto`
- `id` | UUID/String | Student identifier.
- `name` | String | Student display name.
- Relationships: minimal projection used in class reports and pickers.

### 2.7 Attendance DTOs

#### Teacher attendance

##### `CreateTeacherAttendanceDto`
- `startDate` | DateTime-style string | Attendance period start.
- `endDate` | DateTime-style string | Attendance period end.
- `classTeacherId` | UUID/String | Links to a teacher-class assignment.

##### `UpdateTeacherAttendanceDto`
- `startDate` | DateTime-style string | Updated period start.
- `endDate` | DateTime-style string | Updated period end.
- `classTeacherId` | UUID/String | Links to a teacher-class assignment.

##### `TeacherAttendanceDto`
- `id` | UUID/String | Identifier.
- `startDate` | DateTime-style string | Attendance period start.
- `endDate` | DateTime-style string | Attendance period end.
- `classTeacherId` | UUID/String | Teacher-class assignment link.

##### `TeacherAttendanceDetailDto`
- `teacherId` | UUID/String | Teacher identifier.
- `teacherName` | String | Teacher display name.
- `presentDays` | Integer | Count of present days.
- `absentDays` | Integer | Count of absent days.
- `attendancePercentage` | Number | Attendance ratio.
- `absenceDates` | Array of DateTime-style strings | Specific absences.

##### `TeacherAttendanceSummary`
- `totalTeachingDays` | Integer | Total measured days.
- `presentDays` | Integer | Days present.
- `attendancePercentage` | Number | Attendance ratio.
- `classAssignments` | Integer | Count of assigned classes.

#### Student attendance

##### `CreateStudentAttendanceDto`
- `startDate` | DateTime-style string | Attendance period start.
- `endDate` | DateTime-style string | Attendance period end.
- `classStudentId` | UUID/String | Links to a student-class enrollment.

##### `UpdateStudentAttendanceDto`
- `startDate` | DateTime-style string | Updated period start.
- `endDate` | DateTime-style string | Updated period end.
- `classStudentId` | UUID/String | Links to a student-class enrollment.

##### `StudentAttendanceDto`
- `id` | UUID/String | Identifier.
- `startDate` | DateTime-style string | Attendance period start.
- `endDate` | DateTime-style string | Attendance period end.
- `classStudentId` | UUID/String | Student-class enrollment link.

##### `StudentAttendancePeriodDto`
- `startDate` | DateTime-style string | Period start.
- `endDate` | DateTime-style string | Period end.

##### `StudentAttendanceSummary`
- `totalDays` | Integer | Total measured days.
- `presentDays` | Integer | Days present.
- `absentDays` | Integer | Days absent.
- `attendancePercentage` | Number | Attendance ratio.
- `attendancePeriods` | Array of `StudentAttendancePeriodDto` | Range breakdown.

##### `StudentAttendanceRecordDto`
- `studentId` | UUID/String | Student identifier.
- `studentName` | String | Student display name.
- `presentDays` | Integer | Days present.
- `totalDays` | Integer | Total measured days.
- `attendancePercentage` | Number | Attendance ratio.

##### `StudentAttendanceDetailDto`
- `studentId` | UUID/String | Student identifier.
- `studentName` | String | Student display name.
- `presentDays` | Integer | Days present.
- `absentDays` | Integer | Days absent.
- `attendancePercentage` | Number | Attendance ratio.
- `absenceDates` | Array of DateTime-style strings | Specific absences.

### 2.8 Teacher-Class and Student-Class Linking DTOs

#### `ClassTeacherEnrollmentDto`
- `id` | UUID/String | Identifier.
- `teacherId` | UUID/String | Teacher reference.
- `classId` | UUID/String | Class/halaqa reference.
- `isMainTeacher` | Boolean | Primary teacher flag.
- Relationships: central join entity between teachers and classes.

#### `CreateClassTeacherEnrollmentDto`
- `teacherId` | UUID/String | Teacher reference.
- `classId` | UUID/String | Class/halaqa reference.
- `isMainTeacher` | Boolean | Primary teacher flag.

#### `UpdateClassTeacherEnrollmentDto`
- `teacherId` | UUID/String | Updated teacher reference.
- `classId` | UUID/String | Updated class reference.
- `isMainTeacher` | Boolean | Primary teacher flag.

#### `EnrollTeacherInClassRequest`
- `classId` | UUID/String | Class/halaqa reference.
- `isMainTeacher` | Boolean | Defaults to false.
- Relationships: used by teacher enrollment routes.

#### `EnrollInClassCommand`
- `studentId` | UUID/String | Student reference.
- `classId` | UUID/String | Class reference.
- Relationships: used to enroll a student in a class.

#### `ClassAssignmentDto`
- `classId` | UUID/String | Class reference.
- `isMainTeacher` | Boolean | Primary teacher flag.
- `studentNames` | Array of String | Human-readable list of assigned students.
- Relationships: teacher assignment view.

#### `ConfirmAttendanceDto`
- `enrollmentId` | UUID/String | Enrollment reference.
- `startDate` | DateTime-style string | Confirmation window start.
- `endDate` | DateTime-style string | Confirmation window end.
- Relationships: used when confirming teacher attendance.

### 2.9 Points and Point Category DTOs

#### `PointDto`
- `id` | UUID/String | Identifier.
- `studentId` | UUID/String | Student reference.
- `eventId` | UUID/String | Event reference.
- `classId` | UUID/String | Class reference.
- `smesterId` | UUID/String | Semester reference; the spec uses this spelling consistently.
- `pointValue` | Number | Points awarded.
- `categoryId` | UUID/String | Point category reference.
- `givenByTeacherId` | UUID/String | Teacher reference.

#### `CreatePointDto`
- `studentId` | UUID/String | Student reference.
- `eventId` | UUID/String | Event reference.
- `classId` | UUID/String | Class reference.
- `smesterId` | UUID/String | Semester reference.
- `pointValue` | Number | Points awarded.
- `categoryId` | UUID/String | Point category reference.
- `givenByTeacherId` | UUID/String | Teacher reference.

#### `UpdatePointDto`
- `studentId` | UUID/String | Student reference.
- `eventId` | UUID/String | Event reference.
- `classId` | UUID/String | Class reference.
- `smesterId` | UUID/String | Semester reference.
- `pointValue` | Number | Points awarded.
- `categoryId` | UUID/String | Point category reference.
- `givenByTeacherId` | UUID/String | Teacher reference.

#### `PointEventDto`
- `eventDate` | DateTime-style string | Event date.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.
- `totalPoints` | Number | Sum of point buckets.
- `notes` | String | Optional free-form explanation.

#### `PointBreakdownDto`
- `date` | DateTime-style string | Aggregation date.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.
- `totalPoints` | Number | Sum of point buckets.
- `notes` | String | Optional notes.

#### `PointCategoryBreakdownDto`
- `categoryId` | Nullable UUID/String | Category reference.
- `categoryType` | Nullable String | Category label.
- `pointsCount` | Integer | Count of points.
- `totalPointsValue` | Number | Total point value.

#### `PointsSummaryDto`
- `totalPoints` | Number | Total points.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.
- `totalEvents` | Integer | Number of point events.

#### `PointsOverviewReportDto`
- `semesterId` | Nullable UUID/String | Semester filter.
- `semesterName` | Nullable String | Semester label.
- `fromDate` | Nullable DateTime-style string | Report range start.
- `toDate` | Nullable DateTime-style string | Report range end.
- `overallSummary` | `PointsSummaryDto` | Aggregate totals.
- `studentPointsDetails` | Array of `StudentPointsDetailDto` | Student breakdowns.
- `teacherPointsGiven` | Array of `TeacherPointsGivenDto` | Teacher breakdowns.

#### `TeacherPointsGivenDto`
- `teacherId` | UUID/String | Teacher reference.
- `teacherName` | String | Teacher display name.
- `totalPointsGiven` | Number | Total points issued.
- `pointsByCategory` | Array of `PointCategoryBreakdownDto` | Category-level breakdown.
- `studentsCount` | Integer | Distinct student count.

#### `StudentPointsRecordDto`
- `studentId` | UUID/String | Student reference.
- `studentName` | String | Student display name.
- `totalPoints` | Number | Total points.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.

#### `StudentPointsSummary`
- `totalPoints` | Number | Total points.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.
- `pointBreakdowns` | Array of `PointBreakdownDto` | Time-based breakdowns.

#### `StudentPointsDetailDto`
- `studentId` | UUID/String | Student reference.
- `studentName` | String | Student display name.
- `totalPoints` | Number | Total points.
- `quranPoints` | Number | Quran-related points.
- `hadithPoints` | Number | Hadith-related points.
- `attendancePoints` | Number | Attendance-related points.
- `behaviorPoints` | Number | Behavior-related points.
- `pointEvents` | Array of `PointEventDto` | Event-level detail.

#### `StudentProgressUnderTeacherDto`
- `studentId` | UUID/String | Student reference.
- `studentName` | String | Student display name.
- `quranPagesMemorized` | Integer | Memorized Quran pages.
- `hadithsMemorized` | Integer | Memorized hadith count.
- `pointsReceived` | Number | Total points received.
- `lastMemorizationDate` | Nullable DateTime-style string | Most recent memorization activity.

### 2.10 Memorization, Quran, and Hadith DTOs

#### `QuranProgressDto`
- `pageNumber` | Integer | Quran page number.
- `memorizedAt` | Nullable DateTime-style string | Memorization timestamp.
- `status` | Nullable String | Progress status.
- `notes` | Nullable String | Teacher/student notes.
- `teacherId` | Nullable UUID/String | Responsible teacher reference.
- `teacherName` | Nullable String | Responsible teacher name.

#### `HadithProgressDto`
- `hadithId` | UUID/String | Hadith reference.
- `hadithText` | String | Hadith text.
- `memorizedAt` | Nullable DateTime-style string | Memorization timestamp.
- `status` | Nullable String | Progress status.
- `notes` | Nullable String | Teacher/student notes.
- `teacherId` | Nullable UUID/String | Responsible teacher reference.
- `teacherName` | Nullable String | Responsible teacher name.

#### `StudentMemorizationSummary`
- `quranPagesMemorized` | Integer | Memorized Quran pages.
- `hadithsMemorized` | Integer | Memorized hadiths.
- `quranProgress` | Array of `QuranProgressDto` | Quran progress rows.
- `hadithProgress` | Array of `HadithProgressDto` | Hadith progress rows.

#### `StudentMemorizationRecordDto`
- `studentId` | UUID/String | Student reference.
- `studentName` | String | Student display name.
- `quranPagesCount` | Integer | Memorized Quran page count.
- `hadithsCount` | Integer | Memorized hadith count.
- `quranPageNumbers` | Array of Integer | Memorized page numbers.
- `hadithTexts` | Array of String | Memorized hadith texts.

#### `HadithDto`
- `id` | UUID/String | Identifier.
- `text` | String | Hadith text.
- `bookId` | Nullable UUID/String | Linked book reference.
- `chapter` | Nullable String | Chapter or section label.
- `book` | Nullable `BookDto` | Nested book projection.
- Relationships: hadith entries can be grouped by book.

#### `CreateHadithDto`
- `text` | String | Hadith text.
- `bookId` | Nullable UUID/String | Linked book reference.
- `chapter` | Nullable String | Chapter or section label.

#### `UpdateHadithDto`
- `text` | String | Updated hadith text.
- `bookId` | Nullable UUID/String | Linked book reference.
- `chapter` | Nullable String | Chapter or section label.

### 2.11 Forms and Responses DTOs

#### `FormDto`
- `id` | UUID/String | Identifier.
- `title` | String | Form title.
- `description` | Nullable String | Form description.
- `formType` | `FormType` | Form category.
- `audience` | `AudienceType` | Intended audience.
- `timerMinutes` | Nullable Integer | Optional time limit.
- `isActive` | Boolean | Activation flag.
- `allowMultipleResponses` | Boolean | Submission policy.
- `startsAt` | Nullable DateTime-style string | Open time.
- `endsAt` | Nullable DateTime-style string | Close time.
- `createdByManagerId` | Nullable UUID/String | Manager creator reference.
- `createdByTeacherId` | Nullable UUID/String | Teacher creator reference.
- `halaqaId` | Nullable UUID/String | Optional class link.
- `courseId` | Nullable UUID/String | Optional course link.
- `accessToken` | String | Public access token.
- `questions` | Array of `FormQuestionDto` | Nested question tree.
- `primaryColor` | Nullable String | UI theme token.
- `backgroundColor` | Nullable String | UI theme token.
- `fontFamily` | Nullable String | UI theme token.

#### `CreateFormDto`
- Same structure as `FormDto` without `id`, `accessToken`, and nested read-only values.
- Key create fields: `title`, `description`, `formType`, `audience`, `timerMinutes`, `isActive`, `allowMultipleResponses`, `startsAt`, `endsAt`, `createdByManagerId`, `createdByTeacherId`, `halaqaId`, `courseId`, `primaryColor`, `backgroundColor`, `fontFamily`.

#### `UpdateFormDto`
- Same editable structure as `CreateFormDto`.
- Relationships: used to edit a stored form while preserving the nested question tree.

#### `FormQuestionDto`
- `id` | UUID/String | Identifier.
- `formId` | UUID/String | Parent form reference.
- `text` | String | Question text.
- `description` | Nullable String | Optional helper text.
- `questionType` | `QuestionType` | Input type.
- `order` | Integer | Display order.
- `isRequired` | Boolean | Validation flag.
- `points` | Nullable Number | Scoring value.
- `columnSpan` | Integer | Layout width.
- `labelColor` | Nullable String | Theme token.
- `fontSize` | Nullable String | Theme token or CSS value.
- `fontFamily` | Nullable String | Theme token or CSS value.
- `options` | Array of `FormQuestionOptionDto` | Option list.

#### `CreateFormQuestionDto`
- `formId` | UUID/String | Parent form reference.
- `text` | String | Question text.
- `description` | Nullable String | Optional helper text.
- `questionType` | `QuestionType` | Input type.
- `order` | Integer | Display order.
- `isRequired` | Boolean | Validation flag.
- `points` | Nullable Number | Scoring value.
- `columnSpan` | Integer | Layout width.
- `labelColor` | Nullable String | Theme token.
- `fontSize` | Nullable String | Theme token or CSS value.
- `fontFamily` | Nullable String | Theme token or CSS value.

#### `UpdateFormQuestionDto`
- Same editable fields as `CreateFormQuestionDto`.

#### `FormQuestionOptionDto`
- `id` | UUID/String | Identifier.
- `questionId` | UUID/String | Parent question reference.
- `text` | String | Option label.
- `order` | Integer | Display order.
- `isCorrect` | Boolean | Correctness flag.

#### `CreateFormQuestionOptionDto`
- `questionId` | UUID/String | Parent question reference.
- `text` | String | Option label.
- `order` | Integer | Display order.
- `isCorrect` | Boolean | Correctness flag.

#### `UpdateFormQuestionOptionDto`
- Same editable fields as `CreateFormQuestionOptionDto`.

#### `FormResponseDto`
- `id` | UUID/String | Identifier.
- `formId` | UUID/String | Parent form reference.
- `submittedAt` | DateTime-style string | Submission timestamp.
- `isCompleted` | Boolean | Completion flag.
- `totalScore` | Nullable Number | Computed score.
- `answers` | Array of `FormAnswerDto` | Answer rows.

#### `FormAnswerDto`
- `id` | UUID/String | Identifier.
- `responseId` | UUID/String | Parent response reference.
- `questionId` | UUID/String | Question reference.
- `textAnswer` | Nullable String | Free-text answer.
- `isCorrect` | Nullable Boolean | Auto-graded result.
- `pointsAwarded` | Nullable Number | Scored points.
- `selectedOptionIds` | Array of UUID/String | Chosen options.

#### `SubmitFormResponseDto`
- `formId` | UUID/String | Form reference.
- `respondedByStudentId` | Nullable UUID/String | Student respondent.
- `respondedByTeacherId` | Nullable UUID/String | Teacher respondent.
- `timeSpentSeconds` | Nullable Integer | Completion duration.
- `answers` | Array of `SubmitFormAnswerDto` | Submission payload.

#### `SubmitFormAnswerDto`
- `questionId` | UUID/String | Question reference.
- `textAnswer` | Nullable String | Free-text answer.
- `selectedOptionIds` | Array of UUID/String | Chosen options.

### 2.12 Report and Aggregation DTOs

#### `AttendanceOverviewReportDto`
- `fromDate` | DateTime-style string | Range start.
- `toDate` | DateTime-style string | Range end.
- `overallSummary` | `AttendanceSummaryDto` | Aggregate attendance totals.
- `studentAttendanceDetails` | Array of `StudentAttendanceDetailDto` | Student rows.
- `teacherAttendanceDetails` | Array of `TeacherAttendanceDetailDto` | Teacher rows.

#### `AttendanceSummaryDto`
- `totalDays` | Integer | Measured days.
- `studentAverageAttendance` | Number | Average student attendance.
- `teacherAverageAttendance` | Number | Average teacher attendance.
- `totalStudentAbsences` | Integer | Student absence count.
- `totalTeacherAbsences` | Integer | Teacher absence count.

#### `ClassAttendanceSummary`
- `totalDays` | Integer | Measured days.
- `presentDays` | Integer | Present count.
- `absentDays` | Integer | Absent count.
- `attendancePercentage` | Number | Attendance ratio.

#### `ClassPointsSummary`
- `totalPoints` | Number | Total points.
- `quranPoints` | Number | Quran points.
- `hadithPoints` | Number | Hadith points.
- `attendancePoints` | Number | Attendance points.
- `behaviorPoints` | Number | Behavior points.

#### `ClassMemorizationSummary`
- `quranPagesMemorized` | Integer | Quran memorization count.
- `hadithsMemorized` | Integer | Hadith memorization count.

#### `ClassSummaryDto`
- `classId` | UUID/String | Class reference.
- `className` | String | Class display name.
- `studentCount` | Integer | Enrollment count.
- `averageAttendance` | Number | Attendance ratio.
- `totalPoints` | Number | Total points.

#### `ClassDailyReportDto`
- `classId` | UUID/String | Class reference.
- `className` | String | Class display name.
- `reportDate` | DateTime-style string | Day bucket.
- `attendanceSummary` | `ClassAttendanceSummary` | Attendance metrics.
- `pointsSummary` | `ClassPointsSummary` | Point metrics.
- `memorizationSummary` | `ClassMemorizationSummary` | Memorization metrics.
- `students` | Array of `StudentBriefDto` | Student list.

#### `ClassWeeklyReportDto`
- `classId`, `className`, `weekStart`, `weekEnd`, `attendanceSummary`, `pointsSummary`, `memorizationSummary`, `students`.

#### `ClassMonthlyReportDto`
- `classId`, `className`, `month`, `attendanceSummary`, `pointsSummary`, `memorizationSummary`, `students`.

#### `ClassSemesterReportDto`
- `classId`, `className`, `semesterId`, `semesterName`, `attendanceSummary`, `pointsSummary`, `memorizationSummary`, `students`.

#### `SemesterOverviewReportDto`
- `semesterId` | UUID/String | Semester reference.
- `semesterName` | String | Semester display name.
- `startDate` | DateTime-style string | Semester start.
- `endDate` | DateTime-style string | Semester end.
- `statistics` | `SemesterStatisticsDto` | Semester totals.
- `classSummaries` | Array of `ClassSummaryDto` | Class summary rows.
- `topStudents` | Array of `TopStudentDto` | Ranked students.
- `topTeachers` | Array of `TopTeacherDto` | Ranked teachers.

#### `SemesterStatisticsDto`
- `totalStudents` | Integer | Student count.
- `totalTeachers` | Integer | Teacher count.
- `totalClasses` | Integer | Class count.
- `totalQuranPagesMemorized` | Integer | Quran memorization total.
- `totalHadithsMemorized` | Integer | Hadith memorization total.
- `totalPointsGiven` | Number | Total points.
- `averageAttendancePercentage` | Number | Attendance average.

#### `TopStudentDto`
- `studentId` | UUID/String | Student reference.
- `studentName` | String | Student display name.
- `totalPoints` | Number | Total points.
- `averageAttendance` | Number | Attendance ratio.
- `quranPagesMemorized` | Integer | Quran memorization total.
- `hadithsMemorized` | Integer | Hadith memorization total.

#### `TopTeacherDto`
- `teacherId` | UUID/String | Teacher reference.
- `teacherName` | String | Teacher display name.
- `totalPointsGiven` | Number | Total points issued.
- `averageAttendance` | Number | Attendance ratio.
- `studentsCount` | Integer | Distinct student count.

#### Student report DTOs

##### `StudentDailyReportDto`
- `studentId`, `studentName`, `reportDate`, `attendanceSummary`, `memorizationSummary`, `pointsSummary`, `teacherNotes`.

##### `StudentWeeklyReportDto`
- `studentId`, `studentName`, `weekStart`, `weekEnd`, `attendanceSummary`, `memorizationSummary`, `pointsSummary`, `teacherNotes`.

##### `StudentMonthlyReportDto`
- `studentId`, `studentName`, `month`, `attendanceSummary`, `memorizationSummary`, `pointsSummary`, `teacherNotes`.

##### `StudentSemesterReportDto`
- `studentId`, `studentName`, `semesterId`, `semesterName`, `attendanceSummary`, `memorizationSummary`, `pointsSummary`, `teacherNotes`.

#### Teacher report DTOs

##### `TeacherDailyReportDto`
- `teacherId`, `teacherName`, `reportDate`, `attendanceSummary`, `pointsSummary`, `studentProgress`.

##### `TeacherWeeklyReportDto`
- `teacherId`, `teacherName`, `weekStart`, `weekEnd`, `attendanceSummary`, `pointsSummary`, `studentProgress`.

##### `TeacherMonthlyReportDto`
- `teacherId`, `teacherName`, `month`, `attendanceSummary`, `pointsSummary`, `studentProgress`.

##### `TeacherSemesterReportDto`
- `teacherId`, `teacherName`, `semesterId`, `semesterName`, `attendanceSummary`, `pointsSummary`, `studentProgress`.

### 2.13 Pagination Wrappers

All paged wrapper schemas use the same envelope:

```json
{
  "items": [],
  "totalItems": 0,
  "page": 1,
  "pageSize": 10,
  "totalPages": 0
}
```

#### Wrapper list
- `PagedListOfAllowableExtensionDto`
- `PagedListOfBookDto`
- `PagedListOfClassTeacherEnrollmentDto`
- `PagedListOfFormDto`
- `PagedListOfHadithDto`
- `PagedListOfPointCategoryBreakdownDto`
- `PagedListOfPointCategoryDto`
- `PagedListOfPointDto`
- `PagedListOfRoleDto`
- `PagedListOfSemesterDto`
- `PagedListOfStudentAttendanceDetailDto`
- `PagedListOfStudentAttendanceDto`
- `PagedListOfStudentPointsDetailDto`
- `PagedListOfStudentProgressUnderTeacherDto`
- `PagedListOfTeacherAttendanceDetailDto`
- `PagedListOfTeacherAttendanceDto`
- `PagedListOfTeacherPointsGivenDto`

## 3. Endpoint / Resource Logic

### Auth
- `POST /api/Auth/login` -> authenticate and obtain token material.
- `POST /api/Auth/refresh` -> exchange refresh token for a new access token.
- Use these endpoints before any resource traversal that requires a session.

### Reference and catalog resources
- `AllowableExtensions`, `Books`, `Semesters`, `PointCategories`, `Roles`, `courses`, and `halaqas` follow CRUD conventions.
- Traversal hierarchy:
  - `Semesters` contain `courses` via `semesterId`.
  - `courses` contain `halaqas` via `courseId`.
  - `PointCategories` classify `Points`.
  - `Roles` attach `PermissionDto` collections.

### Manager resources
- `managers` expose CRUD plus `/attachments` and `/password`.
- Use `id` to move from list -> detail -> update/delete -> attachments/password.

### Teacher resources
- `teachers` expose CRUD plus filtered listing, attachments, attendance, enrollments, halaqas, points given, students, password, and student assessment history.
- Parent-child traversal is anchored by `teacherId`.
- Nested attendance confirmation uses both `teacherId` and `halaqaId`.

### Student resources
- `students` expose CRUD plus filtered listing, attachments, zip export, attendance, memorization, points, and password.
- Parent-child traversal is anchored by `studentId`.
- Use semester/date filters when retrieving report-style student activity.

### Core academic records
- `Points`, `StudentAttendances`, `TeacherAttendances`, and `ClassTeacherEnrollments` are the main operational write/read tables.
- `StudentEnrollment` is the join resource used to enroll a student into a class.
- `ConfirmAttendanceDto` is used to confirm teacher attendance over a period.

### Forms engine
- `Forms` is the root form resource.
- `FormQuestions` and `FormQuestionOptions` are nested beneath forms and questions.
- `FormResponses` stores completed submissions.
- `GET /api/Forms/access/{accessToken}` enables token-based access to a form without traversing the internal ID.
- `POST /api/FormResponses/submit` is the submission entry point.

### Reports
- Attendance, points, class, semester, student, and teacher reports are read-only aggregation resources.
- They generally follow the pattern: `overview/summary -> time bucket -> detail rows -> top-N breakdowns`.
- Most report endpoints are derived from IDs plus an optional date range or time period.

## 4. Implementation Patterns for Agents

### Common Query Patterns
- Resolve collection first, then filter by parent key.
- Prefer parent traversal endpoints when available instead of fetching the entire collection and filtering client-side.
- Use `page` / `pageSize` for the standard paged resources.
- Use `pageNumber` / `pageSize` for the filtered teacher/student listing endpoints if the backend expects that naming.
- For report endpoints, always normalize dates to ISO 8601 strings.
- For forms, walk the tree top-down: `FormDto -> questions -> options -> responses -> answers`.
- For attendance and points, preserve the foreign-key chain rather than flattening IDs away.

### UI Component Mapping
- `items` arrays in paged wrappers map cleanly to `Table`, `DataTable`, `List`, or `Grid` components.
- `Summary` DTOs map to statistic cards, KPI rows, or compact dashboard tiles.
- Time-bucketed `ReportDto` shapes map well to tabs, accordions, or sections grouped by day/week/month/semester.
- `FormDto.questions` and `FormQuestionDto.options` map to a nested form builder or editor tree.
- `answers` collections map to expandable response detail rows.
- `studentProgress`, `teacherNotes`, and similar detail arrays map to timeline or feed components.
- `permissions` and similar role arrays map to checkbox matrices or permission tables.
- `attachments` endpoints map to upload components, file pickers, and attachment galleries.

### Codegen / Client Strategy
- Treat nullable strings, dates, and IDs as optional in generated clients.
- Preserve numeric-string unions if the backend emits them.
- Prefer typed response helpers for 200-only endpoints with no explicit response schema.
- Keep relation IDs in request payloads so the client can call traversal endpoints without extra lookups.

## 5. Edge Cases & Nullability

The following patterns are important for safe generated code:

- `nullable` values appear in many create/update and report schemas, especially `email`, `description`, `notes`, `bookId`, `chapter`, `timerMinutes`, `startsAt`, `endsAt`, `semesterId`, `semesterName`, `lastMemorizationDate`, `memorizedAt`, and `teacherId`/`teacherName` in progress rows.
- `FormDto`, `CreateFormDto`, and related question schemas contain several optional theme and metadata fields that may be absent even when the parent object is present.
- Report DTOs frequently contain optional filter metadata such as `semesterId`, `fromDate`, and `toDate`, meaning the UI should not assume a fixed report range.
- `RoleDto.permissions` and `FormDto.questions` can be nested arrays and should be guarded before mapping.
- Some endpoints return success without a detailed schema. Generated code should tolerate `void`, `unknown`, or minimally typed responses.
- The spelling `smesterId` is used in the points schema. Do not normalize it in client code unless the backend changes.
- The spec often models timestamps as general strings rather than strict `date-time`, so robust parsing should be defensive.

## 6. Quick Schema Examples

### Paginated collection
```json
{
  "items": [
    { "id": "...", "name": "..." }
  ],
  "totalItems": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

### Form submission
```json
{
  "formId": "...",
  "respondedByStudentId": null,
  "respondedByTeacherId": "...",
  "timeSpentSeconds": 120,
  "answers": [
    {
      "questionId": "...",
      "textAnswer": "...",
      "selectedOptionIds": ["..."]
    }
  ]
}
```

### Points record
```json
{
  "studentId": "...",
  "eventId": "...",
  "classId": "...",
  "smesterId": "...",
  "pointValue": 10,
  "categoryId": "...",
  "givenByTeacherId": "..."
}
```
