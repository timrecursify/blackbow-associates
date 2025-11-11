import React from 'react';
import { CheckCircle2, X, Mail, Calendar } from 'lucide-react';

interface CrmBetaSuccessModalProps {
  data: any;
  onClose: () => void;
}

const CrmBetaSuccessModal: React.FC<CrmBetaSuccessModalProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Success Icon */}
        <div className="pt-12 pb-6 px-8 text-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
            Welcome to the Beta!
          </h2>
          <p className="text-lg text-gray-700">
            We're reviewing your application for <strong>{data?.companyName}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            {/* What's Next Section */}
            <div>
              <h3 className="text-xl font-semibold text-black mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                What Happens Next
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold mr-3 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Check Your Email</p>
                    <p className="text-sm text-gray-600">We've sent a confirmation to <strong>{data?.email}</strong></p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold mr-3 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Application Review</p>
                    <p className="text-sm text-gray-600">Our team will review your application within 48 hours</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold mr-3 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Get Beta Access</p>
                    <p className="text-sm text-gray-600">If accepted, you'll receive an exclusive invitation with early access pricing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Keep an eye on your inbox
                  </p>
                  <p className="text-sm text-blue-700">
                    If you don't see our email within a few minutes, check your spam folder. You can also add us to your contacts to ensure you receive future updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Beta Benefits */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-3">
                Beta Participant Benefits
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Early access to all CRM features before public launch</span>
                </li>
                <li className="flex items-start text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Discounted pricing locked in permanently</span>
                </li>
                <li className="flex items-start text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Direct line to our development team for feature requests</span>
                </li>
                <li className="flex items-start text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Personalized onboarding and support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="/"
              className="flex-1 px-6 py-3 bg-black text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Return to Homepage
            </a>
            <a
              href="/marketplace"
              className="flex-1 px-6 py-3 bg-white border-2 border-black text-black text-center rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Browse Leads
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmBetaSuccessModal;
