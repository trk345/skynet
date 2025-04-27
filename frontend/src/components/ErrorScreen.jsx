import { Link } from 'react-router-dom'
import PropTypes from 'prop-types';


const ErrorScreen = ({ message = "Something went wrong...", homeLink = '/' }) => (
<div className="min-h-screen flex justify-center items-center bg-gray-50">
    <div className="text-center text-red-600 p-6 bg-white shadow-md rounded-lg">
    <h2 className="text-xl font-bold mb-2">Error</h2>
    <p>{message}</p>
    <Link to={homeLink} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Return to Home
    </Link>
    </div>
</div>
);   

ErrorScreen.propTypes = {
    message: PropTypes.string,
    homeLink: PropTypes.string,
  }

export default ErrorScreen;