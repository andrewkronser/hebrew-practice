import TransliterationPage from "./features/transliteration/TransliterationPage.jsx";
import VocabularyPage from "./features/vocabulary/VocabularyPage.jsx";
import TypingPage from "./features/typing/TypingPage.jsx";
import GenderNumberPage from "./features/gender-number/GenderNumberPage.jsx";
import StubPage from "./shared/StubPage.jsx";

/* One source of truth for the sections. The header nav, the mobile navbar and
   the router all read this array, so a new page can't appear in the menu while
   404ing, or route correctly while being invisible.

   To add a section: write the page, import it, add a line. */

const stub = (title) => () => <StubPage title={title} />;

export const SECTIONS = [
  { path: "/", label: "Transliteration", Component: TransliterationPage },
  { path: "/vocabulary", label: "Vocabulary", Component: VocabularyPage },
  { path: "/typing", label: "Learn to Type", Component: TypingPage },
  { path: "/roots", label: "Roots", Component: stub("Roots") },
  { path: "/gender-and-number", label: "Gender and Number", Component: GenderNumberPage },
];
