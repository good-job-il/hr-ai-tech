import { useLocation } from 'react-router-dom';

export default function PlaceholderPlatform({ title }) {
  const location = useLocation();
  const derived = title || location.pathname.split('/').filter(Boolean).slice(1).map(s =>
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  ).join(' › ');
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">{derived}</h2>
      <p className="text-slate-400 font-semibold">בבנייה — Phase C</p>
      <code className="mt-3 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">{location.pathname}</code>
    </div>
  );
}