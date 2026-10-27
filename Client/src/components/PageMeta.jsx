import { setMeta } from '../helpers/pageMeta';
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
const pages = {
  '/privacy': ['Privacy policy', 'How CineLog handles your account and viewing information.'],
  '/terms': ['Terms of use', 'Using CineLog and sharing your reviews.'],
  '/forgot-password': ['Reset your password', 'Recover access to your CineLog account.'],
  '/reset-password': ['Choose a new password', 'Reset your CineLog password securely.'],
  '/verify-email': ['Verify your email', 'Verify your CineLog account email.'],
  '/tracking': [
    'Series progress',
    'Track your watched episodes and season progress.',
  ],
  '/upcoming': [
    'Upcoming movies and series',
    'Explore upcoming film releases and series premieres.',
  ],
  '/indian-cinema': [
    'Explore Indian cinema',
    'Discover films and series across Indian languages.',
  ],
  '/collections': [
    'Your collections',
    'Create private or public collections of films and series.',
  ],
  '/calendar': [
    'Your release calendar',
    'Keep track of releases and episodes from your saved titles.',
  ],
  '/': [
    'Discover your next great film',
    'Explore films and series, find streaming availability and keep your personal viewing journal with CineLog.',
  ],
  '/movies': [
    'Discover films',
    'Find your next film by genre, language, release year and audience rating. Explore popular cinema and new releases.',
  ],
  '/tv': [
    'Discover series',
    'Discover your next series. Filter by genre, language, year and rating, then explore seasons and streaming availability.',
  ],
  '/watchlist': [
    'My library',
    'Organize your watchlist, track what you watch and keep notes in your private CineLog viewing journal.',
  ],
  '/profile': [
    'Your profile',
    'Manage your CineLog profile and revisit your recent ratings, reviews and viewing history.',
  ],
  '/login': [
    'Sign in',
    'Sign in to CineLog to save films and series, rate your favourites and keep your viewing journal.',
  ],
  '/register': [
    'Join CineLog',
    'Create your CineLog account and make a home for the films and series you love.',
  ],
  '/search': [
    'Search films, series and people',
    'Search CineLog for films, series, actors and filmmakers. Find the stories and talent you want to explore.',
  ],
};
export default function PageMeta() {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => {
    const dynamic =
      /^\/(movie|tv|person|people)\/[^/]+$/.test(pathname) ||
      pathname.startsWith('/collections/');
    const page =
      pages[pathname] ||
      (pathname.startsWith('/admin')
        ? ['Catalogue management', 'Manage the CineLog catalogue.']
        : dynamic
          ? [
              'Explore the story',
              'Explore cast, details and filmography on CineLog.',
            ]
          : [
              'Page not found',
              'This page is unavailable. Return to CineLog to discover films and series.',
            ]);
    const query = new URLSearchParams(search).get('q');
    setMeta(
      pathname === '/search' && query
        ? `Search: ${query.slice(0, 80)}`
        : page[0],
      page[1],
    );
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        'content',
        pathname.startsWith('/people/') ||
          pathname.startsWith('/collections/') ||
          Boolean(search) ||
          (!pages[pathname] && !dynamic) ||
          [
            '/forgot-password', '/reset-password', '/verify-email',
            '/profile',
            '/watchlist',
            '/search',
            '/login',
            '/register',
            '/calendar',
            '/tracking',
            '/collections',
          ].includes(pathname)
          ? 'noindex,follow'
          : 'index,follow',
      );
  }, [pathname, search]);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
