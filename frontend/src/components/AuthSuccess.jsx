import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          credentials: 'include'
        });        

        if (!response.ok) {
          throw new Error('User not authenticated');
        }

        const userData = await response.json();
        setUser(userData);

        // ✅ Redirect to home page after successful authentication
        setTimeout(() => {
          navigate('/');
        }, 500);
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  return <h1>Welcome {user ? user.username : 'User'}!</h1>;
};

export default AuthSuccess;
