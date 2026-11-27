import { DedicationDoor } from '@/components/dedication/DedicationDoor';

/** The door of Thalia's dedication (src/features/galaxy/dedication.ts): her
 *  star, a question, and a gift that opens to its answer. Nothing of the gift
 *  is in this page; it arrives sealed and is opened in the visitor's browser. */

export const metadata = {
  title: 'For Talia — Icarus Atlas',
  description: 'A star of the atlas, given as a gift.',
  robots: { index: false, follow: false },
};

export default function TaliaPage() {
  return <DedicationDoor starId="thalia-muse" />;
}
