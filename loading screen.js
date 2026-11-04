import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import "./styles.css";
import { Icon, IconSprite } from "./Icons";
import {
  AMENITY_LABEL,
  CATS,
  CURRENCIES,
  STAYS,
  THEMES,
  type Stay,
} from "./data";

type Tab = "home" | "map" | "spot" | "saved" | "me";

const NAV: [Tab, string, string][] = [
  ["home", "home", "Explore"],
  ["map", "map", "Map"],
  ["spot", "star", "Spotlight"],
  ["saved", "bm", "Saved"],
  ["me", "user", "Profile"],
];

/* Scenic placeholder art. Replace with real photos later. */
function Art({ h, v = 0 }: { h: Stay; v?: number }) {
  const [a, b, g, r] = h.sky;
  const id = `g${h.id}-${v}`;
  const x = 60 + ((h.id * 53) % 190);

  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>

      <rect width="300" height="200" fill={`url(#${id})`} />

      <circle
        cx={x}
        cy={50 + v * 8}
        r="22"
        fill="#fff"
        opacity=".75"
      />

      <path
        d={`M0 150Q80 ${112 + v * 10} 150 140T300 ${
          125 - v * 8
        }V200H0z`}
        fill={g}
      />

      <path
        d="M110 152v-30l40-26 40 26v30z"
        fill="#fff"
        opacity=".93"
      />

      <path
        d="M103 123l47-31 47 31"
        stroke={r}
        strokeWidth="9"
        fill="none"
        strokeLinejoin="round"
      />

      <rect x="143" y="134" width="15" height="18" fill={r} />
      <rect x="118" y="128" width="12" height="10" fill={b} />
    </svg>
  );
}

const Stars = ({ h }: { h: Stay }) => (
  <span className="str">
    <Icon n="star" />
    <b>{h.rating || "New"}</b>
  </span>
);

export default function App() {
  /*
   * STARTUP STATES
   *
   * showSplash controls the blue application splash screen.
   * isLoading controls the grey skeleton accommodation cards.
   */
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("home");
  const [theme, setTheme] = useState("cream");
  const [user, setUser] = useState<string | null>(null);

  /*
   * Set this to false during splash/loading testing.
   * Guests will land on the Explore page after loading.
   */
  const [showLogin, setShowLogin] = useState(false);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [cur, setCur] = useState("BWP");
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [email, setEmail] = useState("demo@micasa.app");
  const [pw, setPw] = useState("password123");
  const [err, setErr] = useState("");

  const appRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>();

  const t = THEMES[theme];

  const fmt = (price: number) =>
    CURRENCIES[cur].s +
    Math.round(price * CURRENCIES[cur].r).toLocaleString();

  const toast = (message: string) => {
    setToastMsg(message);

    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setToastMsg("");
    }, 2000);
  };

  /*
   * SPLASH AND LOADING TIMERS
   *
   * Splash screen: 0 to 2.2 seconds
   * Skeleton loading screen: 2.2 to 5 seconds
   * Main content: after 5 seconds
   *
   * The longer five-second loading time makes it easier to test.
   * Change 5000 to 3000 after testing.
   */
  useEffect(() => {
    const splashTimer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    const loadingTimer = window.setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      window.clearTimeout(splashTimer);
      window.clearTimeout(loadingTimer);
    };
  }, []);

  /* Theme to CSS variables on #app. */
  useEffect(() => {
    if (!appRef.current) return;

    const style = appRef.current.style;

    ["bg1", "bg2", "bg3"].forEach((variable, index) => {
      style.setProperty(`--${variable}`, t.c[index]);
    });

    style.setProperty("--acc", t.c[3]);

    (["atx", "tx", "tx2", "gl", "gb", "sh"] as const).forEach(
      (variable) => {
        style.setProperty(`--${variable}`, t[variable]);
      },
    );

    appRef.current.classList.toggle("dk", t.tx === "#f4f6f8");
  }, [t]);

  const list = useMemo(
    () =>
      STAYS.filter(
        (stay) =>
          (cat === "All" || stay.cat === cat) &&
          (stay.name + stay.city)
            .toLowerCase()
            .includes(q.toLowerCase()),
      ).sort((a, b) => b.rating - a.rating),
    [q, cat],
  );

  const openStay = STAYS.find((stay) => stay.id === openId) ?? null;

  const favourite = (id: number) => {
    if (!user) {
      toast("Log in to save stays");
      setShowLogin(true);
      return;
    }

    setSaved((currentSaved) => {
      const updatedSaved = new Set(currentSaved);

      if (updatedSaved.has(id)) {
        updatedSaved.delete(id);
      } else {
        updatedSaved.add(id);
      }

      return updatedSaved;
    });
  };

  const login = (social = false) => {
    const demoCredentialsAreCorrect =
      email === "demo@micasa.app" && pw === "password123";

    if (social || demoCredentialsAreCorrect) {
      setUser("demo@micasa.app");
      setShowLogin(false);
      setErr("");
      toast("Welcome 👋");
    } else {
      setErr("Wrong email or password");
    }
  };

  const logout = () => {
    setUser(null);
    setSaved(new Set());

    if (!THEMES[theme].free) {
      setTheme("cream");
    }

    toast("You have logged out");
  };

  const Row = ({ h }: { h: Stay }) => (
    <div
      className="li glass row"
      onClick={() => setOpenId(h.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          setOpenId(h.id);
        }
      }}
    >
      <div className="th">
        <Art h={h} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontSize: 14 }}>{h.name}</b>

        <div
          className="m row"
          style={{ gap: 3, margin: "3px 0" }}
        >
          <Icon n="pin" style={{ width: 13, height: 13 }} />
          {h.city}
        </div>

        <Stars h={h} />
      </div>

      <div className="pr">
        {fmt(h.price)}

        <div className="m" style={{ fontWeight: 400 }}>
          /night
        </div>
      </div>
    </div>
  );

  const bookmarkStyle = (id: number): CSSProperties => ({
    fill: saved.has(id) ? "currentColor" : "none",
  });

  const currentNavigationIndex = NAV.findIndex(
    ([navigationTab]) => navigationTab === tab,
  );

  return (
    <div id="app" ref={appRef}>
      <IconSprite />

      {/* APPLICATION SPLASH SCREEN */}
      {showSplash && (
        <div
          className="splash-screen"
          role="status"
          aria-live="polite"
          aria-label="Opening Mi Casa Es Su Casa"
        >
          <div className="splash-decoration splash-decoration-one" />
          <div className="splash-decoration splash-decoration-two" />

          <div className="splash-content">
            <div className="splash-logo" aria-hidden="true">
              <span className="splash-roof">⌂</span>
            </div>

            <h1>Mi Casa</h1>
            <p>Es Su Casa</p>

            <span className="splash-tagline">
              Find your perfect stay
            </span>

            <div className="splash-loader" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}

      <div className="blob b1" />
      <div className="blob b2" />

      {/* EXPLORE PAGE */}
      <section className={`page ${tab === "home" ? "on" : ""}`}>
        <div className="row sp">
          <div>
            <div className="m">Explore</div>
            <b>Gaborone</b>
          </div>

          <div className="row">
            <div
              className="chip glass on"
              onClick={() => setTab("me")}
            >
              {cur}
            </div>

            <div
              className="av"
              onClick={() => setTab("me")}
            >
              {user ? "D" : "?"}
            </div>
          </div>
        </div>

        <div className="search glass row">
          <Icon n="search" />

          <input
            placeholder="Find a stay or city"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>

        <div className="chips">
          {CATS.map((category) => (
            <div
              key={category}
              className={`chip glass ${
                category === cat ? "on" : ""
              }`}
              onClick={() => setCat(category)}
            >
              {category}
            </div>
          ))}
        </div>

        <div
          className="row sp"
          style={{ marginBottom: 10 }}
        >
          <h3>
            {isLoading ? "Finding stays..." : `${list.length} stays`}
          </h3>
        </div>

        {/* SKELETON LOADING CARDS */}
        {isLoading ? (
          <div
            className="skeleton-list"
            role="status"
            aria-live="polite"
            aria-label="Loading available stays"
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                className="li glass row skeleton-card"
                key={item}
              >
                <div className="skeleton skeleton-image" />

                <div className="skeleton-details">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-location" />
                  <div className="skeleton skeleton-rating" />
                </div>

                <div className="skeleton skeleton-price" />
              </div>
            ))}
          </div>
        ) : list.length ? (
          list.map((stay) => (
            <Row key={stay.id} h={stay} />
          ))
        ) : (
          <div
            className="glass li m"
            style={{ textAlign: "center" }}
          >
            No stays match your search.
          </div>
        )}
      </section>

      {/* SAVED PAGE */}
      <section className={`page ${tab === "saved" ? "on" : ""}`}>
        <h1 style={{ margin: "8px 0 14px" }}>Saved</h1>

        {!user ? (
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <h3 style={{ marginBottom: 6 }}>
              Your favourites start here.
            </h3>

            <p className="m" style={{ marginBottom: 18 }}>
              Log in to save your favourite guesthouses.
            </p>

            <button
              className="btn"
              onClick={() => setShowLogin(true)}
            >
              Log In
            </button>
          </div>
        ) : saved.size ? (
          STAYS.filter((stay) => saved.has(stay.id)).map((stay) => (
            <Row key={stay.id} h={stay} />
          ))
        ) : (
          <div className="glass li m">
            Tap the bookmark on a stay to save it.
          </div>
        )}
      </section>

      {/* PROFILE AND SETTINGS PAGE */}
      <section className={`page ${tab === "me" ? "on" : ""}`}>
        <h1 style={{ margin: "8px 0 16px" }}>Settings</h1>

        <div className="sh">Currency</div>

        <div className="grp glass">
          {Object.entries(CURRENCIES).map(([key, currency]) => (
            <div
              key={key}
              className="st"
              onClick={() => setCur(key)}
            >
              <div
                className="si"
                style={{
                  background: "var(--acc)",
                  color: "var(--atx)",
                  fontWeight: 700,
                }}
              >
                {currency.s}
              </div>

              <div>
                <b>{key}</b>
                <div className="m">{currency.n}</div>
              </div>

              <span className="v">
                {key === cur && (
                  <Icon
                    n="chk"
                    style={{
                      color: "var(--acc)",
                      strokeWidth: 3,
                    }}
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="sh">Themes</div>

        <div className="themes">
          {Object.entries(THEMES).map(([key, selectedTheme]) => {
            const locked = !selectedTheme.free && !user;

            return (
              <div
                key={key}
                className={`tc glass ${
                  key === theme ? "on" : ""
                }`}
                onClick={() =>
                  locked
                    ? toast("Log in to unlock themes")
                    : setTheme(key)
                }
              >
                <svg className="cc" viewBox="0 0 100 100">
                  {[
                    [48, 50],
                    [37, 61],
                    [26, 72],
                    [15, 83],
                  ].map(([radius, y], index) => (
                    <circle
                      key={index}
                      cx="50"
                      cy={y}
                      r={radius}
                      fill={selectedTheme.c[index]}
                      stroke={
                        index
                          ? "rgba(255,255,255,.85)"
                          : "rgba(128,128,128,.35)"
                      }
                      strokeWidth="1.2"
                    />
                  ))}
                </svg>

                <b style={{ fontSize: 13 }}>
                  {selectedTheme.name}
                </b>

                <div className="m">
                  {selectedTheme.free
                    ? "Free"
                    : locked
                      ? "Log in to unlock"
                      : "Unlocked"}
                </div>

                {locked && (
                  <span className="lk">
                    <Icon
                      n="lock"
                      style={{ width: 16, height: 16 }}
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="grp glass"
          style={{ marginTop: 18 }}
        >
          <div
            className="st"
            style={{
              justifyContent: "center",
              fontWeight: 600,
              color: user ? "#e5484d" : "var(--tx)",
            }}
            onClick={() =>
              user ? logout() : setShowLogin(true)
            }
          >
            {user ? "Log out" : "Log in"}
          </div>
        </div>
      </section>

      {/* MAP AND SPOTLIGHT PLACEHOLDERS */}
      {(["map", "spot"] as const).map((page) => (
        <section
          key={page}
          className={`page ${tab === page ? "on" : ""}`}
        >
          <h1 style={{ margin: "8px 0 14px" }}>
            {page === "map" ? "Map" : "Spotlight"}
          </h1>

          <div className="glass li m">
            Not ported yet. See the project notes.
          </div>
        </section>
      ))}

      {/* BOTTOM NAVIGATION */}
      <nav className="glass" id="nav">
        <div
          className="ind"
          style={{
            transform: `translateX(${
              currentNavigationIndex * 60
            }px)`,
          }}
        />

        {NAV.map(([navigationTab, icon, label]) => (
          <button
            key={navigationTab}
            className={navigationTab === tab ? "on" : ""}
            onClick={() => {
              setOpenId(null);
              setTab(navigationTab);
            }}
          >
            <Icon n={icon} />
            <span className="tip">{label}</span>
          </button>
        ))}
      </nav>

      {/* STAY DETAILS */}
      <div id="det" className={openStay ? "on" : ""}>
        {openStay && (
          <>
            <div className="hero">
              <Art h={openStay} />

              <div
                className="row sp"
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  right: 14,
                }}
              >
                <div
                  className="ib"
                  onClick={() => setOpenId(null)}
                >
                  <Icon n="back" />
                </div>

                <div
                  className="ib"
                  onClick={() => favourite(openStay.id)}
                >
                  <Icon
                    n="bm"
                    style={bookmarkStyle(openStay.id)}
                  />
                </div>
              </div>
            </div>

            <div className="sheet">
              <h1 style={{ fontSize: 23 }}>{openStay.name}</h1>

              <div
                className="row sp"
                style={{ margin: "8px 0 14px" }}
              >
                <div
                  className="pr"
                  style={{ fontSize: 22 }}
                >
                  {fmt(openStay.price)}

                  <span
                    className="m"
                    style={{ fontWeight: 400 }}
                  >
                    {" "}
                    /night
                  </span>
                </div>

                <Stars h={openStay} />
              </div>

              <h3>About</h3>

              <p
                className="m"
                style={{
                  lineHeight: 1.6,
                  fontSize: 13,
                  margin: "6px 0 16px",
                }}
              >
                {openStay.desc} Free cancellation up to 48 hours
                before check-in.
              </p>

              <h3>Amenities</h3>

              <div className="am">
                {openStay.amenities.map((amenity) => (
                  <div key={amenity} className="glass">
                    <Icon n={amenity} />
                    {AMENITY_LABEL[amenity]}
                  </div>
                ))}
              </div>
            </div>

            <div className="bar glass">
              <button
                className="btn"
                onClick={() => {
                  if (user) {
                    toast("Booked! Check your email ✓");
                  } else {
                    toast("Log in to book");
                    setShowLogin(true);
                  }
                }}
              >
                Book Now
              </button>
            </div>
          </>
        )}
      </div>

      {/* TOAST MESSAGE */}
      <div
        id="toast"
        className={`glass ${toastMsg ? "on" : ""}`}
      >
        {toastMsg}
      </div>

      {/* LOGIN SCREEN */}
      <div className={`scr ${showLogin ? "" : "off"}`}>
        <div className="card glass">
          <h1>Welcome back</h1>

          <p className="m" style={{ marginTop: 4 }}>
            Sign in to Mi Casa Es Su Casa
          </p>

          <input
            className="inp"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            className="inp"
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(event) => setPw(event.target.value)}
          />

          <div className="er">{err}</div>

          <button
            className="btn"
            onClick={() => login()}
          >
            Sign In
          </button>

          <div className="soc">
            <button
              className="glass"
              onClick={() => login(true)}
            >
              Google
            </button>

            <button
              className="glass"
              onClick={() => login(true)}
            >
              Apple
            </button>
          </div>

          <p
            className="m"
            style={{
              textAlign: "center",
              marginTop: 16,
              cursor: "pointer",
            }}
            onClick={() => setShowLogin(false)}
          >
            Continue as guest
          </p>
        </div>
      </div>
    </div>
  );
}