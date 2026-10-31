# UML diagrams

Diagrams are Mermaid. GitHub draws them when you open this file.

## 1. Architecture: how mobile, web and the back end connect

```mermaid
flowchart LR
    subgraph Clients
        M["Mobile app<br/>Expo, React Native"]
        W["Web admin portal<br/>React"]
    end
    subgraph Firebase
        A["Authentication"]
        F[("Cloud Firestore")]
        S["Storage"]
    end
    B["Backend API<br/>Express + Admin SDK"]

    M -- "log in / sign up" --> A
    M -- "read guesthouses<br/>write own favourites and ratings<br/>(security rules apply)" --> F
    W -- "log in" --> A
    W -- "token + requests" --> B
    W -- "upload images" --> S
    B -- "verify token" --> A
    B -- "read and write<br/>(Admin SDK, bypasses rules)" --> F
```

## 2. Backend structure (classes and modules)

```mermaid
classDiagram
    class Routes {
        +GET /guesthouses
        +POST /guesthouses
        +PUT /guesthouses/:id
        +DELETE /guesthouses/:id
        +GET /dashboard
        +GET /reviews
        +DELETE /reviews/:id
        +GET /admins
        +POST /admins
        +DELETE /admins/:uid
        +POST /auth/verify
    }
    class Middleware {
        +requireRole(roles)
    }
    class AuthFunctions {
        +verifyAccount(req)
    }
    class GuesthouseFunctions {
        +list()
        +get(id)
        +create(body, uid)
        +update(id, body)
        +remove(id)
    }
    class ReviewFunctions {
        +list(guesthouseId)
        +remove(id)
    }
    class AdminFunctions {
        +list()
        +create(data, byUid)
        +remove(uid, byUid)
    }
    class StatsFunctions {
        +compute(guesthouses)
        +dashboard()
    }
    class GuesthouseModel {
        +collection()
        +clean(input)
        +requireFields(data)
    }
    class ReviewModel {
        +collection()
    }
    class AdminModel {
        +collection()
    }
    class FirebaseConfig {
        +auth
        +db
        +FieldValue
    }

    Routes --> Middleware
    Routes --> GuesthouseFunctions
    Routes --> ReviewFunctions
    Routes --> AdminFunctions
    Routes --> StatsFunctions
    Middleware --> AuthFunctions
    AuthFunctions --> AdminModel
    GuesthouseFunctions --> GuesthouseModel
    GuesthouseFunctions --> ReviewModel
    ReviewFunctions --> ReviewModel
    ReviewFunctions --> GuesthouseModel
    AdminFunctions --> AdminModel
    StatsFunctions --> GuesthouseFunctions
    GuesthouseModel --> FirebaseConfig
    ReviewModel --> FirebaseConfig
    AdminModel --> FirebaseConfig
    AuthFunctions --> FirebaseConfig
    AdminFunctions --> FirebaseConfig
    ReviewFunctions --> FirebaseConfig
```

## 3. Data model

```mermaid
erDiagram
    ADMIN ||--o{ GUESTHOUSE : "creates (createdBy)"
    CUSTOMER ||--o{ RATING : writes
    GUESTHOUSE ||--o{ RATING : receives
    CUSTOMER ||--o{ FAVOURITE : saves
    GUESTHOUSE ||--o{ FAVOURITE : "is saved as"

    ADMIN {
        string uid PK
        string name
        string email
        string role "superadmin, admin or moderator"
        string createdBy
        timestamp createdAt
    }
    GUESTHOUSE {
        string id PK
        string name
        string description
        string city
        string country
        string contactDetails
        number pricePerNight "BWP"
        number latitude
        number longitude
        array amenities
        string logoUrl
        array galleryUrls
        number ratingSum
        number ratingCount
        number averageRating
        string createdBy FK
        timestamp createdAt
        timestamp updatedAt
    }
    CUSTOMER {
        string uid PK
        string name
        string email
        timestamp createdAt
    }
    RATING {
        string id PK "guesthouseId_customerId"
        string guesthouseId FK
        string customerId FK
        string customerName
        number score "1 to 5"
        string comment
        timestamp createdAt
    }
    FAVOURITE {
        string guesthouseId PK "under customers/uid/favourites"
        timestamp createdAt
    }
```

## 4. Sequences

### 4.1 Customer rates a guesthouse (mobile to Firestore, no backend)

```mermaid
sequenceDiagram
    actor C as Customer
    participant M as Mobile app
    participant A as Firebase Auth
    participant F as Firestore

    C->>M: Open guesthouse, tap 4 stars, Save
    M->>A: Is someone logged in?
    A-->>M: Yes (uid)
    M->>F: Transaction: read guesthouse and ratings/{id}_{uid}
    F-->>M: Current totals, old rating if any
    M->>F: Write rating, update ratingSum, ratingCount, averageRating
    F-->>M: OK (rules check uid, id format and score 1 to 5)
    M-->>C: "Your review is saved"
```

### 4.2 Staff member adds a guesthouse (web to backend to Firestore)

```mermaid
sequenceDiagram
    actor S as Staff
    participant W as Web portal
    participant A as Firebase Auth
    participant B as Backend
    participant F as Firestore

    S->>W: Log in
    W->>A: signInWithEmailAndPassword
    A-->>W: ID token
    W->>B: POST /auth/verify (Bearer token)
    B->>A: verifyIdToken
    B->>F: Read admins/{uid}
    B-->>W: { uid, name, role }
    S->>W: Fill the form, Save
    W->>B: POST /guesthouses (Bearer token)
    B->>B: requireRole(admin, superadmin)
    B->>B: clean() and requireFields()
    B->>F: Write guesthouses/{newId} with zero ratings
    B-->>W: 201 created guesthouse
    Note over F: The mobile app now shows it
```

### 4.3 Moderator deletes a review

```mermaid
sequenceDiagram
    actor Mo as Moderator
    participant W as Web portal
    participant B as Backend
    participant F as Firestore

    Mo->>W: Delete review
    W->>B: DELETE /reviews/:id (Bearer token)
    B->>B: requireRole(any staff role allowed for moderation)
    B->>F: Transaction: read review and its guesthouse
    B->>F: Subtract score, decrease ratingCount, recompute averageRating
    B->>F: Delete review
    B-->>W: 200 { id }
```

### 4.4 Super admin creates a staff account

```mermaid
sequenceDiagram
    actor SA as Super admin
    participant W as Web portal
    participant B as Backend
    participant A as Firebase Auth
    participant F as Firestore

    SA->>W: Add staff (name, email, password, role)
    W->>B: POST /admins (Bearer token)
    B->>B: requireRole(superadmin)
    B->>A: createUser (Admin SDK, no sign-out of the super admin)
    A-->>B: new uid
    B->>F: Write admins/{uid} with role
    B-->>W: 201 { id, name, email, role }
```
