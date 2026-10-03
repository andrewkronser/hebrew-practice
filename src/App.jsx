import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Shell from "./Shell.jsx";
import { SECTIONS } from "./routes.jsx";

/* HashRouter, not BrowserRouter, and that's a GitHub Pages decision rather than
   a preference.

   Pages serves static files with no rewrite rule, so with BrowserRouter a
   reload or a shared link to /roots asks GitHub for a file that isn't there and
   gets a 404. The usual workaround — committing a 404.html copy of index.html —
   collides with the second constraint: vite.config.js uses `base: "./"` so the
   build works at any path, but relative asset URLs resolve against the *current*
   path, so /hebrew-practice/roots/ would look for its JS under
   /hebrew-practice/roots/assets/. Fixing that means hardcoding
   `base: "/hebrew-practice/"`, which re-couples the build to the repository name.

   Hashes sidestep all of it: the browser never asks the server for /roots, so
   deep links, refresh and the back button all work from any base path, and
   renaming the repo again costs nothing. The price is a # in the URL. */

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          {SECTIONS.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
