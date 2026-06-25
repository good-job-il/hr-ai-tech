import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const LOGO_URL = "https://media.base44.com/images/public/6a00f4b05ae5180d66425437/7cbe87349_232B9533-1BE6-4299-80F9-1B99BFDA97E1.png";

const SIZES = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '56px',
  xl: '80px',
};

function getHomeRoute(role) {
  switch (role) {
    case 'admin':        return '/admin/dashboard';
    case 'recruitment_manager': return '/recruitment/jobs';
    case 'team_manager': return '/recruitment/jobs';
    case 'recruiter':    return '/recruiter/dashboard';
    case 'employer':     return '/employer/dashboard';
    case 'candidate':    return '/candidate/dashboard';
    default:             return '/';
  }
}

export default function Logo({ size = 'md', href, className = '' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const height = SIZES[size] || SIZES.md;
  const destination = href !== undefined ? href : getHomeRoute(user?.role);

  const handleClick = (e) => {
    e.preventDefault();
    if (destination) navigate(destination);
  };

  return (
    <a
      href={destination || '/'}
      onClick={handleClick}
      className="inline-flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
      style={{ textDecoration: 'none' }}
    >
      <div className="relative">
        <img
          src={LOGO_URL}
          alt="HeadHunter"
          style={{
            height,
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
          }}
          className={className}
        />
      </div>
      <span className="hidden md:block text-lg font-black bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
        HeadHunter
      </span>
    </a>
  );
}