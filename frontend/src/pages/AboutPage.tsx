import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Users, Award, Briefcase } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col relative overflow-hidden">
      {/* Video Background - Optimized Loading */}
      <video
        key="about-video"
        autoPlay
        loop
        muted
        playsInline
        preload={typeof window !== 'undefined' && window.innerWidth < 768 ? 'metadata' : 'auto'}
        className="video-background"
        style={{ objectFit: 'cover' }}
        onLoadStart={(e) => {
          const isMobile = window.innerWidth < 768;

          // Skip video on slow connections
          if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g')) {
              e.currentTarget.style.display = 'none';
              return;
            }

            // On mobile with 4g, delay load slightly
            if (isMobile && conn.effectiveType === '4g') {
              setTimeout(() => {
                e.currentTarget.load();
              }, 500);
            }
          }
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      >
        <source src="/videos/Demo_Reel_New.mp4" type="video/mp4" />
      </video>

      {/* Video Overlay */}
      <div className="video-overlay"></div>

      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-handwritten text-4xl sm:text-5xl md:text-6xl text-black mb-4">
              About Black Bow Associates
            </h1>
            <p className="font-handwritten-script text-xl sm:text-2xl text-gray-700 mb-6">
              A Direct Subsidiary of Precious Pics Pro
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Our Story */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center mb-4">
                <Heart className="mr-3 text-black" size={28} strokeWidth={1.5} />
                <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Black Bow Associates was created as a direct subsidiary of <strong>Precious Pics Pro</strong>, 
                a premier wedding photography and videography company dedicated to capturing life's most precious moments. 
                Building on years of experience in the wedding industry, we recognized a critical need: connecting exceptional 
                wedding vendors with couples who truly value quality and professionalism.
              </p>
              <p className="text-gray-700 leading-relaxed">
                As part of the Precious Pics family, we bring the same commitment to excellence, attention to detail, 
                and passion for weddings that has made Precious Pics Pro a trusted name among couples planning their 
                special day.
              </p>
            </div>

            {/* Our Mission */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center mb-4">
                <Award className="mr-3 text-black" size={28} strokeWidth={1.5} />
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We exist to create meaningful connections between premium wedding vendors and engaged couples. 
                Our mission is to build a professional association where quality service providers can grow their 
                businesses while couples discover the perfect partners to bring their wedding vision to life. 
                We believe great weddings happen when talented vendors and appreciative clients come together.
              </p>
            </div>

            {/* How We Work */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center mb-4">
                <Briefcase className="mr-3 text-black" size={28} strokeWidth={1.5} />
                <h2 className="text-2xl font-bold text-gray-900">How We Work</h2>
              </div>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Wedding Vendors:</h3>
                  <p>
                    Join our professional association and access qualified leads matched to your
                    services and expertise. Purchase leads that match your criteria, quote your rates,
                    and connect with couples ready to book. Pay only for the leads you want - no monthly
                    fees, just targeted growth opportunities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">For Couples:</h3>
                  <p>
                    Get connected with vetted, professional wedding vendors who are committed to excellence. 
                    Browse portfolios, compare quotes, and make informed decisions with confidence. Our association 
                    ensures you're working with service providers who value quality and customer satisfaction.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Values */}
            <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/30">
              <div className="flex items-center mb-4">
                <Users className="mr-3 text-black" size={28} strokeWidth={1.5} />
                <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quality First</h3>
                  <p className="text-sm">We partner only with vendors who demonstrate exceptional skill and professionalism.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Transparency</h3>
                  <p className="text-sm">Clear communication, honest pricing, and straightforward processes for everyone.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Fair Partnership</h3>
                  <p className="text-sm">Pay-per-lead model ensures vendors only invest in opportunities they choose.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                  <p className="text-sm">Building a supportive network where wedding professionals thrive together.</p>
                </div>
              </div>
            </div>

            {/* Parent Company */}
            <div className="bg-black rounded-2xl p-8 shadow-2xl text-white">
              <h2 className="text-2xl font-bold mb-4">About Precious Pics Pro</h2>
              <p className="text-gray-200 leading-relaxed mb-4">
                Our parent company, <strong>Precious Pics Pro</strong>, is a full-service wedding photography and 
                videography studio that has been capturing precious moments for couples across the region. With a 
                commitment to artistic excellence and customer satisfaction, Precious Pics Pro brings years of 
                industry expertise and deep connections within the wedding community.
              </p>
              <a
                href="https://www.preciouspicspro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                <span>Visit Precious Pics Pro</span>
                <ArrowLeft className="rotate-180" size={18} />
              </a>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Join?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Become part of a professional association that values quality, supports your growth, 
              and connects you with couples who appreciate excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center space-x-2 bg-black text-white px-8 py-4 text-lg font-bold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg"
              >
                <span>Get Started Today</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-4 text-lg font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 border-2 border-gray-300"
              >
                <ArrowLeft size={18} />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

