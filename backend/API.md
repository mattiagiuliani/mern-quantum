# Backend API Reference

Base URL: `/api`

## Auth

### POST `/auth/register`
Create a new user and issue auth cookies.

Request body:
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "Abcdef1!"
}
```

### POST `/auth/login`
Authenticate user and issue auth cookies.

Request body:
```json
{
  "email": "alice@example.com",
  "password": "Abcdef1!"
}
```

### POST `/auth/logout`
Clear token and refreshToken cookies.

### POST `/auth/refresh`
Refresh access cookie using refreshToken cookie.

### GET `/auth/me` (protected)
Return authenticated user profile.

## Circuits

### POST `/circuits/run`
Run full simulation on a circuit matrix.

Request body:
```json
{
  "circuit": [["H", null, "M"], [null, "X", "M"]],
  "shots": 1024
}
```

### POST `/circuits/applyGate`
Apply one gate in pedagogical step mode.

Request body (single-qubit):
```json
{
  "qubitStates": [{"value": 0, "superposition": false}],
  "gate": "H",
  "qubitIndex": 0
}
```

Request body (CNOT):
```json
{
  "qubitStates": [
    {"value": 1, "superposition": false},
    {"value": 0, "superposition": false}
  ],
  "gate": "CNOT",
  "controlIndex": 0,
  "targetIndex": 1
}
```

### POST `/circuits` (protected)
Save a circuit.

### GET `/circuits/mine` (protected)
List current user circuits.

Query params:
- `page` default `1`
- `limit` default `20`, max `100`

### GET `/circuits/:id` (protected)
Get one circuit by id.

### PUT `/circuits/:id` (protected)
Update circuit name, matrix, or lastResult.

### DELETE `/circuits/:id` (protected)
Delete owned circuit.

## Templates

### GET `/templates/public`
List public templates.

Query params:
- `tag` optional
- `page` default `1`
- `limit` default `20`, max `100`

### GET `/templates/mine` (protected)
List templates owned by authenticated user.

### POST `/templates` (protected)
Create a template.

Request body:
```json
{
  "name": "Bell Demo",
  "description": "Simple entanglement template",
  "circuit": [["H", {"gate":"CNOT","role":"ctrl","partner":1}, "M"], [null, {"gate":"CNOT","role":"tgt","partner":0}, "M"]],
  "tags": ["education", "entanglement"],
  "isPublic": true
}
```

### PUT `/templates/:id` (protected)
Update owned template.

### DELETE `/templates/:id` (protected)
Delete owned template.

### GET `/templates/:id`
Get one template. Private templates are visible only to owner.

## Response Contract

Success shape:
```json
{
  "success": true
}
```

Error shape:
```json
{
  "success": false,
  "message": "Human readable error"
}
```
