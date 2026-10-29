# UML

GitHub renders these Mermaid blocks in Markdown files [1].

## 1. Components

```mermaid
flowchart LR
  subgraph Clients
    M[Mobile app<br/>Expo and React Native]
    W[Web portal<br/>React]
  end
  subgraph FB[Firebase project - one shared project]
    A[Authentication<br/>email and password]
    F[(Firestore)]
    S[(Storage<br/>images)]
    R{{Security rules}}
  end
  M -->|sign up, log in| A
  W -->|log in| A
  M -->|read stays, write ratings, favourites, profile| F
  W -->|write stays, read customers, manage admins| F
  W -->|upload images| S
  M -->|load images by URL| S
  R -.guards.-> F
  R -.guards.-> S
```

## 2. Data model

```mermaid
erDiagram
    ADMIN ||--o{ GUESTHOUSE : manages
    CUSTOMER ||--o{ RATING : writes
    GUESTHOUSE ||--o{ RATING : receives
    CUSTOMER ||--o{ FAVOURITE : saves
    GUESTHOUSE ||--o{ FAVOURITE : "is saved as"

    ADMIN {
        string uid PK
        string name
        string email
        string role
        timestamp createdAt
    }
    GUESTHOUSE {
        string id PK
        string name
        string description
        string city
        string country
        string category
        string contactDetails
        number pricePerNight
        number latitude
        number longitude
        array amenities
        string logoUrl
        array galleryUrls
        number ratingSum
        number ratingCount
        number averageRating
        timestamp createdAt
    }
    CUSTOMER {
        string uid PK
        string name
        string preferredName
        string email
        string phone
        string address
        string emergencyContact
        string verificationStatus
        timestamp createdAt
    }
    RATING {
        string id PK "guesthouseId_customerId"
        string guesthouseId FK
        string customerId FK
        string customerName
        number score
        string comment
        timestamp createdAt
    }
    FAVOURITE {
        string guesthouseId PK "inside customers/uid/favourites"
        timestamp createdAt
    }
```

## 3. Sequence: customer posts a review (mobile)

```mermaid
sequenceDiagram
  actor G as Customer
  participant M as Mobile app
  participant A as Firebase Auth
  participant F as Firestore
  participant R as Security rules
  G->>M: Tap Post review
  M->>A: Is a user signed in
  A-->>M: uid
  M->>F: Transaction read guesthouse and old rating
  M->>F: Write ratings guesthouseId_uid and update 3 counters
  F->>R: Check both writes
  R-->>F: Allow or deny
  F-->>M: Committed
  M->>M: Refresh screen with new average
```

## 4. Sequence: admin adds a guesthouse (web)

```mermaid
sequenceDiagram
  actor Ad as Admin
  participant W as Web portal
  participant F as Firestore
  participant S as Storage
  Ad->>W: Fill form and choose photos
  W->>F: Create guesthouses id with counters at 0
  W->>S: Upload guesthouses id file
  S-->>W: Download URL
  W->>F: Update logoUrl and galleryUrls
```

## 5. State: customer verification

```mermaid
stateDiagram-v2
  [*] --> none
  none --> pending: customer requests
  pending --> verified: admin approves
  pending --> none: admin rejects
```

The rules in `backend/firestore.rules` enforce these transitions. In the v8 demo this flow is not implemented (the Profile tab has no verification screen).

## 6. Mobile demo runtime

```mermaid
flowchart TD
  U[User tap or typing] --> A[Action function<br/>fav, pick, login, setCur, apply]
  A --> S[(State object S)]
  A --> RD[render]
  RD --> T1[home and lists]
  RD --> T2[map]
  RD --> T3[spot]
  RD --> T4[saved]
  RD --> T5[me]
  T1 --> D[(Data H, CUR, T)]
  T2 --> D
  T3 --> D
  T4 --> D
  T5 --> D
  T1 --> HTML[DOM innerHTML]
  T2 --> HTML
  T3 --> HTML
  T4 --> HTML
  T5 --> HTML
  S --> T1
```

## Source

1. https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks
