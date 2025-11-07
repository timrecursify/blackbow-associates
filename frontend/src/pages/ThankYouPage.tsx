import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Mail, Clock } from 'lucide-react';

export const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        {/* White Overlay for Better Readability */}
        <div className="white-overlay"></div>

        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>

        <div className="wave-container">
          <svg className="wave wave-1" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
          </svg>
          <svg className="wave wave-2" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
          </svg>
          <svg className="wave wave-3" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl w-full bg-white/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8 md:p-12 relative z-10 text-center">
        <div className="mb-6">
          <CheckCircle className="mx-auto text-green-600 mb-6" size={72} strokeWidth={1.5} />
          <h1 className="font-handwritten text-4xl md:text-5xl text-black mb-4">
            Thank You!
          </h1>
          <h2 className="font-handwritten-script text-xl md:text-2xl text-gray-900 mb-6">
            Welcome to Black Bow Associates
          </h2>
          <p className="text-lg text-gray-900 mb-2">
            We've received your application and are excited to have you join our professional association!
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-8 mb-8 text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">What Happens Next?</h3>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Mail className="mr-2 text-black" size={20} />
                  <h4 className="font-semibold text-gray-900">Application Review</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Our team will review your business and portfolio to ensure quality standards.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Clock className="mr-2 text-black" size={20} />
                  <h4 className="font-semibold text-gray-900">Welcome Communication</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  You'll receive communication back <strong>shortly</strong> with next steps and onboarding information.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <CheckCircle className="mr-2 text-black" size={20} />
                  <h4 className="font-semibold text-gray-900">Start Receiving Leads</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Once approved, you'll begin receiving qualified leads matched to your services.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <p className="text-blue-900 font-medium text-sm">
            <strong>Important:</strong> Please check your email (including spam folder) for our communication. 
            We typically respond within 24-48 hours.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center space-x-2 bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-bold"
          >
            <span>Back to Home</span>
          </Link>
          
          <Link
            to="/about"
            className="inline-flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border-2 border-gray-300 font-medium"
          >
            <span>Learn More About Us</span>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions? Visit{' '}
            <a 
              href="https://www.preciouspicspro.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black font-medium hover:underline"
            >
              Precious Pics Pro
            </a>
            {' '}or email us directly.
          </p>
        </div>
      </div>
    </div>
  );
};

