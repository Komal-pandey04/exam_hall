const VARIANTS = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800 disabled:bg-slate-300 disabled:text-slate-500',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300',
  ghost: 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
  violet: 'bg-violet-600 text-white hover:bg-violet-700',
  violetOutline: 'bg-white text-violet-700 border border-violet-300 hover:bg-violet-50',
};
const SIZES = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-base' };

export default function Button({ variant = 'primary', size = 'md', className = '', as: Tag = 'button', children, ...props }) {
  const type = Tag === 'button' ? { type: props.type || 'button' } : {};
  return (
    <Tag
      {...type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}
