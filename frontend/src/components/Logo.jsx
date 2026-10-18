import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-bold tracking-tight" aria-label="ExamHall home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-700 text-white">
        <CheckCheck size={18} strokeWidth={3} />
      </span>
      <span className={`text-lg ${light ? 'text-white' : 'text-slate-900'}`}>ExamHall</span>
    </Link>
  );
}
