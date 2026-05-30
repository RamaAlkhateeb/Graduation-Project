# Student Domain Frontend Contract

The student frontend is wired for the expanded Student domain contract. The current generated OpenAPI files may lag behind these backend changes, so treat this note as the frontend integration reference.

## Lookups

- `GET /api/academic-stages`
  - Used by create and edit forms.
  - Expected item shape: `{ id, grade, displayName? }`.
- `GET /api/memorized-quran-parts`
  - Used only by the memorized parts management dialog.
  - Expected item shape: `{ id, memorizedQuranPart, displayName? }`.

## Student Create

`POST /api/students`

```json
{
  "name": "string",
  "fatherName": "string",
  "lastName": "string",
  "fatherWork": "string",
  "parentPhoneNumber": "string",
  "schoolName": "string",
  "parentWhatsAppPhoneNumber": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "landlineNumber": "string or null",
  "userName": "string",
  "password": "string",
  "academicStageId": "uuid"
}
```

## Student Update

`PUT /api/students/{id}`

```json
{
  "name": "string",
  "fatherName": "string",
  "lastName": "string",
  "fatherWork": "string",
  "parentPhoneNumber": "string",
  "schoolName": "string",
  "parentWhatsAppPhoneNumber": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "landlineNumber": "string or null",
  "academicStageId": "uuid"
}
```

Do not send `memorizedQuranParts`, `userName`, or `password` in the normal update request.

## Student Detail

`GET /api/students/{id}?include=academicStage,memorizedParts`

The detail view displays the academic stage label and memorized Quran parts. The list view requests only `include=academicStage` to avoid loading memorized parts for every row.

## Memorized Parts Update

`PUT /api/students/{id}/memorized-parts`

```json
{
  "parts": ["part-id-1", "part-id-2"]
}
```

This dedicated request is the only frontend flow that mutates memorized Quran parts.
