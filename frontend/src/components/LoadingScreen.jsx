import PropTypes from "prop-types";

const LoadingScreen = ({ message = "Loading..." }) => (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );

  LoadingScreen.propTypes = {
    message: PropTypes.string,
  }

  export default LoadingScreen;