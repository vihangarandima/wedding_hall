# Ransiri Grand — Weddings & Celebrations by the Sea (Negombo, Sri Lanka)

A clean, light, editorial one-page site for a Sri Lankan seaside venue. It's styled after Orbix Studio, with a StayGo-style booking bar. Static HTML/CSS/JS, so no build step is needed.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

## Sections

1. **Hero:** a seaside ceremony photo fading into an off-white sky, a Google-rating pill, a headline, and a floating booking bar (celebration, date, guests, space). The bar checks the date and pre-fills the enquiry form.
2. **Celebrations grid:** Poruwa, Nikah & Walima, Hindu, church, homecoming, engagement, mehndi, company events, birthdays and get-togethers.
3. **One team:** floating photo cards that bob, parallax and follow the mouse.
4. **Showreel band:** a huge "CELEBRATE" word that slides with scroll. It opens the gallery lightbox.
5. **Spaces:** a 3D coverflow carousel of five venues (drag, swipe, arrows, keyboard).
6. **Statement:** text that fills in as you scroll, pop-in stickers and a stats row.
7. **Traditions:** a segmented control for Sinhala, Muslim, Tamil Hindu, Christian and Functions.
8. **Packages:** a weekday/weekend toggle and a live LKR calculator.
9. **Reviews:** a review marquee.
10. **FAQ:** an accordion.
11. **Booking:** a calendar (booked and Poya days marked) and the enquiry form.
12. **Floating dock:** a bottom nav pill with live scroll % and a pop-up menu. It appears once you scroll past the hero.

## Replace before launch

- **Brand & contact:** "Ransiri Grand", the address, phone, WhatsApp number (`wa.me/94770000000`) and social links are placeholders.
- **Rating & reviews:** "4.9 from 860 Google reviews" and the review cards are samples. Use your real Google data.
- **Prices:** `PRICES` and `WEEKEND` in `js/main.js` and the `data-base` attributes in `index.html`.
- **Availability:** booked dates are generated for the demo (`status()` in `js/main.js`).
- **Poya days:** computed from a full-moon formula, so they're approximate.
- **Form:** it only shows a success state. Connect it to email, WhatsApp or a backend (see the `TODO` in `js/main.js`).
- **Photos:** free Unsplash images. Use your own venue photos, especially for the hero and the five spaces.
- After editing CSS or JS, bump `?v=` in `index.html` so browsers load the new files.
