import { AudioLines, Clapperboard, Drama, Monitor, Shirt, Cpu, MessagesSquare, Layers } from 'lucide-react';
import type { FacultyId } from '@/data/courses';
import { facultyImages } from '@/lib/brochure-images';
import { cn } from '@/lib/utils';

const icons = { audio: AudioLines, content: Clapperboard, performance: Drama, visual: Monitor, fashion: Shirt, tech: Cpu, business: MessagesSquare };

export function FacultyBar({ faculty, title }: { faculty?: FacultyId; title: string }) {
  const Icon = faculty ? icons[faculty] : Layers;
  return <div className="brochure-faculty-bar"><span className="brochure-icon"><Icon aria-hidden="true" /></span><h2>{title}</h2></div>;
}

export function NumberedBar({ number, title, dual = false }: { number: number; title: string; dual?: boolean }) {
  return <div className={cn('brochure-course-bar', dual && 'brochure-course-bar-dual')}><span className="brochure-number">{String(number).padStart(2, '0')}</span><h3>{title}</h3></div>;
}

export function FacultyPhoto({ faculty, className }: { faculty: FacultyId; className?: string }) {
  const photo = facultyImages[faculty];
  return <div className={cn('brochure-photo', className)}><img src={photo.src} alt={photo.alt} loading="lazy" width="600" height="600" /></div>;
}