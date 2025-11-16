export default function Footer() {
  return (
    <footer className="mt-10 py-6 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 text-center">

        <p className="text-sm text-gray-600">
          © {new Date().getFullYear()} 
          <span className="font-semibold text-[#00843D]"> AUI Feedback Portal</span>.
          All rights reserved.
        </p>

        <p className="text-xs text-gray-500 mt-2">
        Al Akhawayn University in Ifrane.
        </p>

      </div>
    </footer>
  );
}
