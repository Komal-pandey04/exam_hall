import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { EmptyState } from '../components/StateViews.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      message="The page you are looking for doesn't exist or has moved."
      action={<Button as={Link} to="/">Back to home</Button>}
    />
  );
}
