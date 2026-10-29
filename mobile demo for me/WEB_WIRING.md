# Wiring the web portal and the mobile app

One Firebase project. Web and mobile never talk to each other. Both read and write Firestore and Storage, and the rules decide what is allowed.

## 1. Who owns what

| Data | Web portal (admin) | Mobile (customer) |
|---|---|---|
| `guesthouses` fields except counters | create, edit, delete | read |
| `guesthouses` counters (`ratingSum`, `ratingCount`, `averageRating`) | never write | update via rating transaction |
| `ratings` | delete | create, edit own; read (signed in) |
| `customers` profile | read | create, edit own |
| `customers.verificationStatus` | set `verified` or `none` | set `pending` once |
| `customers/{uid}/favourites` | none | own |
| `admins` | read, create, edit, delete | none |
| Storage `guesthouses/{id}/*` | upload, delete | read by URL |

## 2. Differences from DATABASE.md

| Change | Impact |
|---|---|
| `ratings` read requires sign-in (was public) | Matches the demo: guests cannot read comments. The public average stays on the guesthouse. Mobile must not query `ratings` for guests. |
| `ratings` write checks `customerName` is a string, `comment` is a string up to 500 characters, and the guesthouse exists | Old clients that omit `customerName` or `comment` are rejected. |
| `guesthouses` admin writes must include `name`, `pricePerNight`, `latitude`, `longitude`; customer counter updates must be well-typed | Web forms must send these on every save. |
| `customers`: admins can read and update; new field `verificationStatus` (`none`, `pending`, `verified`) with enforced transitions | Enables user management and verification on the web. Create without the field is treated as `none`. |
| `customers` delete is admin only (was owner) | No self-deletion in the mobile app. |
| `guesthouses.category` (optional string) | Needed for the Safari/City/Lodge/Budget chips. Mobile ignores unknown fields; default to `Lodge`. |
| `storage.rules` added | Web uploads only: admin, image type, under 5 MB. |

Update DATABASE.md to match before the next hand-in.

## 3. Customer profile fields

| Field | In v8 demo | Note |
|---|---|---|
| `name`, `email`, `phone` | yes | |
| `city` | yes | |
| `preferredName`, `address`, `emergencyContact` | no | Figma design only. Only `preferredName` should appear on reviews. |
| `verificationStatus` | no | Figma design only. |

## 4. Code the two sides need

Web: create a guesthouse with photos. Order matters: the document must exist with counters at 0 before photos are added.

```ts
// Web portal. db and storage come from your firebase.ts.
import { collection, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function createGuesthouse(input: GuesthouseInput, logo: File, gallery: File[]) {
  const docRef = doc(collection(db, "guesthouses"));   // new id, nothing written yet
  const id = docRef.id;
  // Counters start at 0. Rules require name, price and coordinates here.
  await setDoc(docRef, { ...input, logoUrl: "", galleryUrls: [], ratingSum: 0, ratingCount: 0, averageRating: 0, createdAt: serverTimestamp() });
  const upload = async (f: File, name: string) => {
    const r = ref(storage, `guesthouses/${id}/${name}`);
    await uploadBytes(r, f, { contentType: f.type });  // rules check type and size
    return getDownloadURL(r);
  };
  const logoUrl = await upload(logo, "logo");
  const galleryUrls = await Promise.all(gallery.map((f, i) => upload(f, `gallery-${i}`)));
  await updateDoc(docRef, { logoUrl, galleryUrls });
  return id;
}
```

Web edit rule: `updateDoc` with only the changed fields. Never send the three counters.
Web delete rule: the rules do not cascade. Delete the Storage files and the guesthouse document, then delete `ratings` where `guesthouseId` equals the id.

Web: create another admin. `createUserWithEmailAndPassword` also signs the new user in [1], which would log the current admin out. A community-documented workaround is a second Firebase app instance used only for creation [2]. After creating the user, write `admins/{newUid}` with the original (admin) session.

Mobile: rating transaction (replaces `submitRev`).

```ts
import { runTransaction, doc, serverTimestamp } from "firebase/firestore";

export async function rate(gid: string, uid: string, customerName: string, score: number, comment: string) {
  await runTransaction(db, async (tx) => {
    const gRef = doc(db, "guesthouses", gid);
    const rRef = doc(db, "ratings", `${gid}_${uid}`);     // same id = one rating per person
    const [g, r] = await Promise.all([tx.get(gRef), tx.get(rRef)]);
    const old = r.exists() ? (r.data().score as number) : null;
    const sum = g.data()!.ratingSum - (old ?? 0) + score;
    const count = g.data()!.ratingCount + (old === null ? 1 : 0);
    tx.set(rRef, { guesthouseId: gid, customerId: uid, customerName, score, comment, createdAt: serverTimestamp() });
    tx.update(gRef, { ratingSum: sum, ratingCount: count, averageRating: sum / count });
  });
}
```

Mobile: adapter from Firestore to the demo's short keys.

```ts
// Amenity label (Firestore) -> icon key (demo). Labels without an icon are dropped; add a <symbol> to support them.
const AMEN: Record<string, string> = { Wifi: "wifi", Pool: "pool", Breakfast: "cup", Pets: "paw", TV: "tv", Deals: "tag", "Card pay": "card" };
export const toDemo = (id: string, g: any) => ({
  id, n: g.name, c: g.city, co: g.country, cat: g.category ?? "Lodge", p: g.pricePerNight,
  r: g.averageRating, k: g.ratingCount, la: g.latitude, lo: g.longitude,
  a: (g.amenities ?? []).map((l: string) => AMEN[l]).filter(Boolean), d: g.description, imgs: g.galleryUrls ?? [],
});
```

Environment variables for the Expo app: see `backend/.env.example`. They are readable from the shipped app; keep secrets out of them [3].

## 5. Known limitation

The three counters are written by customers. A modified client can write false totals. The rules only check types and that nothing else changes. Fix: compute counters server-side (a deployed function triggered by rating writes). This adds a server component and was not built (YAGNI).

## Sources

1. https://firebase.google.cn/docs/reference/android/com/google/firebase/auth/FirebaseAuth (Android reference: sign-up also signs the user in)
2. https://community.flutterflow.io/c/community-custom-widgets/post/signup-user-without-signout-current-user-A9TkHc8KKktmSOB (community post, FlutterFlow)
3. https://docs.expo.dev/guides/environment-variables/
