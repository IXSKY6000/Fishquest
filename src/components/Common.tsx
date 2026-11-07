import { AlertCircle, ArrowUpRight, Fish, LoaderCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SpeciesId } from '../domain/types';
import { byId } from '../data/species';
export function FishImage({ id, className = '' }: { id: SpeciesId; className?: string }) {
  return (
    <img
      className={`fish-art ${className}`}
      src={`/fish/${id}.svg`}
      alt={`Illustration originale : ${byId[id].name}`}
      draggable={false}
    />
  );
}
export function Notice({
  children,
  kind = 'info',
}: {
  children: ReactNode;
  kind?: 'info' | 'error';
}) {
  return (
    <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Loading({ children = 'Chargement des données…' }: { children?: ReactNode }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={19} />
      {children}
    </div>
  );
}
export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={12} />
    </a>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <Fish size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Close({ onClick, label = 'Fermer' }: { onClick: () => void; label?: string }) {
  return (
    <button className="icon-button close" aria-label={label} onClick={onClick}>
      <X size={19} />
    </button>
  );
}
export function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Europe/Paris' }).format(
        new Date(value),
      )
    : 'Date indisponible';
}
export function displayNumber(value: number | null, unit: string) {
  return value === null ? 'Données indisponibles' : `${Math.round(value * 10) / 10} ${unit}`;
}
