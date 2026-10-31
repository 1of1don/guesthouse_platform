# Database schema (Cloud Firestore)

Firestore is a NoSQL document database. Data lives in collections of documents. The web portal (through the backend) and the mobile app share one project.

## Collections

```
guesthouses/{guesthouseId}
ratings/{guesthouseId}_{customerId}
customers/{customerId}
    favourites/{guesthouseId}
admins/{adminId}
```

`customerId` and `adminId` are Firebase Authentication `uid` values. All ids are strings. Entity diagram: [UML.md](UML.md).

Why this shape: a guesthouse is always read as a whole, so amenities and gallery images are arrays inside its document. That avoids the join tables a relational design needs.

## Suspended, not deleted

Nothing is deleted from Firestore. Guesthouses, ratings and staff records carry a `status` field, `active` or `suspended`. A document with no `status` counts as active. Suspending also sets `suspendedAt`. Customers never see suspended guesthouses or reviews, and restoring brings them back with their ratings intact.

## guesthouses/{guesthouseId}

Written by the backend (staff). Read by everyone.

| Field | Type | Notes |
|---|---|---|
| `name`, `description`, `city`, `country`, `contactDetails` | string | Required |
| `pricePerNight` | number | Required. Always BWP |
| `latitude`, `longitude` | number | Required |
| `amenities` | array of string | |
| `logoUrl` | string | |
| `galleryUrls` | array of string | First image is the list thumbnail |
| `ratingSum`, `ratingCount`, `averageRating` | number | Start at 0. Changed only by transactions |
| `status` | string | `active` or `suspended`. Missing means active |
| `createdBy` | string | Staff uid, or `seed` |
| `createdAt`, `updatedAt` | timestamp | `createdAt` feeds "added this month" |

## ratings/{guesthouseId}_{customerId}

Written by the mobile app. One document per customer per guesthouse, so rating again replaces the first rating.

| Field | Type | Notes |
|---|---|---|
| `guesthouseId`, `customerId` | string | Must match the document id |
| `customerName` | string | Copied so reviews show a name without another lookup |
| `score` | number | Whole number 1 to 5 |
| `comment` | string | Can be empty |
| `status` | string | `active` or `suspended`. Set by the backend only |
| `createdAt` | timestamp | Time of the last save |

## customers/{customerId} and customers/{customerId}/favourites/{guesthouseId}

Written by the mobile app. A customer reads and writes only their own.

| Collection | Fields |
|---|---|
| `customers/{uid}` | `name`, `email`, `createdAt` |
| `favourites/{guesthouseId}` | `createdAt` (the id is the guesthouse id, so it can only be saved once) |

## admins/{adminId}

Written by the backend. A document here is what makes a login "staff".

| Field | Type | Notes |
|---|---|---|
| `name`, `email` | string | |
| `role` | string | `superadmin`, `admin` or `moderator` |
| `status` | string | `active` or `suspended`. A suspended login is also disabled in Firebase Authentication |
| `createdBy` | string | Uid of whoever added them (absent for the first super admin) |
| `createdAt` | timestamp | |

Create the first super admin with `npm run create-superadmin` in `backend/`.

## Ratings maths

| Situation | Change |
|---|---|
| First rating from a customer | `ratingSum + score`, `ratingCount + 1` |
| Customer edits their rating | `ratingSum - oldScore + newScore`, `ratingCount` same |
| Staff suspend a review | `ratingSum - score`, `ratingCount - 1` |
| Staff restore a review | `ratingSum + score`, `ratingCount + 1` |

Always `averageRating = ratingSum / ratingCount`, or `0` when `ratingCount` is 0.

## Security rules

Full text: [../firestore.rules](../firestore.rules).

| Collection | Public | Signed-in customer | Backend (Admin SDK) |
|---|---|---|---|
| `guesthouses` | read | update only the three rating totals | everything |
| `ratings` | read | create and edit their own (id and score checked, not once suspended) | suspend and restore |
| `customers`, `favourites` | none | own documents only | none |
| `admins` | none | read own record | everything |

The Admin SDK bypasses rules, so the backend can write where customers cannot.

## Indexes

None required. Reviews are sorted after loading, not in the query.
