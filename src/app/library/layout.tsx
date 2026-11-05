import { EB_Garamond } from 'next/font/google';

/** The Library's own face for the originals: EB Garamond carries polytonic Greek
 *  (its `greek-ext` subset), the Garamond cousin of the body face. Loaded only
 *  under /library, so the rest of the atlas pays nothing for it. */
const greek = EB_Garamond({
  variable: '--font-ebgaramond',
  subsets: ['greek', 'greek-ext', 'latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
});

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${greek.variable} contents`}>{children}</div>;
}
