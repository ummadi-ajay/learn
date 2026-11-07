# MakerWorks Learn

A learning platform for MakerWorks Lab students, built with React, Vite and Firebase.

**Live:** https://makerworkslab.in/learn/

## What it has

- Login and signup, with separate **student** and **instructor** dashboards
- **Courses and lessons** (3D printing, Arduino, micro:bit, Raspberry Pi)
- **Messages**, **notifications** and a global chat
- Profile and change-password pages
- An **admin** page and a public **news** page
- PDF export with jsPDF

## Tech

React, React Router, Firebase (authentication, database, storage) and jsPDF, bundled with Vite.

## Run it

```bash
npm install
npm run dev
```

The Firebase project settings live in `src/firebase/firebase.js`. Replace them with your own Firebase project and keep your Firestore security rules locked down.

Built by [Ajay Ummadi](https://makerworkslab.in/ajayummadi/) at [MakerWorks Lab](https://makerworkslab.in/), Mumbai.

## License

The code is MIT licensed, see [LICENSE](LICENSE). Copyright (c) 2026 Ajay Ummadi. Photos, logos, names and written content belong to MakerWorks Lab and are not covered by the MIT license.
