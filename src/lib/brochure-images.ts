import student from '@/assets/brochure/student.jpg.asset.json';
import audio from '@/assets/brochure/audio.jpg.asset.json';
import dj from '@/assets/brochure/dj.jpg.asset.json';
import content from '@/assets/brochure/content.jpg.asset.json';
import performance from '@/assets/brochure/performance.jpg.asset.json';
import visual from '@/assets/brochure/visual.jpg.asset.json';
import fashion from '@/assets/brochure/fashion.jpg.asset.json';
import tech from '@/assets/brochure/tech.jpg.asset.json';
import business from '@/assets/brochure/business.jpg.asset.json';
import type { FacultyId } from '@/data/courses';

// Node builds serve downloaded photos from the college's own host.
const source = (asset: { url: string; original_filename: string }) =>
  import.meta.env.VITE_CAC_LOCAL_IMAGES === 'true' ? `/brochure/${asset.original_filename}` : asset.url;
export const brochureStudent = source(student);
export const brochureDj = source(dj);
export const facultyImages: Record<FacultyId, { src: string; alt: string }> = {
  audio: { src: source(audio), alt: 'Sound recording equipment from the college prospectus' },
  content: { src: source(content), alt: 'A film camera recording a production' },
  performance: { src: source(performance), alt: 'An actor rehearsing with a theatre mask' },
  visual: { src: source(visual), alt: 'Graphic design with colour palettes and a drawing tablet' },
  fashion: { src: source(fashion), alt: 'Fashion models on the runway' },
  tech: { src: source(tech), alt: 'Software development on a laptop' },
  business: { src: source(business), alt: 'A communications professional at work' },
};