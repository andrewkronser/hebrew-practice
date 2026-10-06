import TransliterationPage from "./features/transliteration/TransliterationPage.jsx";
import VocabularyPage from "./features/vocabulary/VocabularyPage.jsx";
import TypingPage from "./features/typing/TypingPage.jsx";
import GenderNumberPage from "./features/gender-number/GenderNumberPage.jsx";
import RootsPage from "./features/roots/RootsPage.jsx";
import ArticlePage from "./features/article/ArticlePage.jsx";
import StubPage from "./shared/StubPage.jsx";

/* One source of truth for the sections. The header nav, the mobile navbar and
   the router all read this array, so a new page can't appear in the menu while
   404ing, or route correctly while being invisible.

   `width` is the content container for that section. Most pages are a single
   column of prose and prompts and read best narrow; one with a syllabus beside
   the drill needs more room. Omit it for the default.

   To add a section: write the page, import it, add a line. */

const stub = (title) => () => <StubPage title={title} />;

export const SECTIONS = [
  { path: "/", label: "Transliteration", Component: TransliterationPage },
  { path: "/vocabulary", label: "Vocabulary", Component: VocabularyPage },
  { path: "/typing", label: "Learn to Type", Component: TypingPage },
  { path: "/roots", label: "Roots", Component: RootsPage, width: 980 },
  { path: "/gender-and-number", label: "Gender and Number", Component: GenderNumberPage, width: 980 },
  { path: "/definite-article", label: "The Definite Article", Component: ArticlePage, width: 980 },
];
