/**
 * Spinner Component
 * Full-screen loading overlay with a spinning animation.
 * Uses Tailwind CSS for styling.
 */
function Spinner() {
  return (
    <div className='fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-40 flex justify-center items-center z-[100000]'>
      <div className='h-10 w-10 border-solid border-4 border-t-transparent border-gray-200 rounded-full animate-spin'></div>
    </div>
  );
}

export default Spinner;
