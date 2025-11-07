import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, BookOpen, Instagram, Facebook, Youtube, UserX } from 'lucide-react';
import { blogArticles } from '../data/blogArticles';

export const BlogPage: React.FC = () => {
  useEffect(() => {
    // Update document metadata for SEO
    document.title = 'Wedding Vendor Resources & Lead Generation Tips | BlackBow Associates Blog';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Expert advice for wedding vendors on lead generation, marketing strategies, sales tactics, and business growth. Learn how to get more wedding leads and close more bookings.');
    }

    // Add canonical URL
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.setAttribute('href', 'https://blackbowassociates.com/blog');
    } else {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = 'https://blackbowassociates.com/blog';
      document.head.appendChild(canonical);
    }
  }, []);
  
  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col relative overflow-hidden lg:overflow-hidden">
      {/* Video Background */}
      <video
        key="blog-video"
        autoPlay
        loop
        muted
        playsInline
        preload={typeof window !== 'undefined' && window.innerWidth < 768 ? 'metadata' : 'auto'}
        className="video-background"
        style={{ objectFit: 'cover' }}
        onLoadStart={(e) => {
          const isMobile = window.innerWidth < 768;
          if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g')) {
              e.currentTarget.style.display = 'none';
              return;
            }
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

      {/* Header */}
      <header className="absolute top-0 right-0 z-20 p-3 sm:p-4 md:p-6">
        <div className="flex gap-1.5 sm:gap-3 flex-wrap">
          <Link
            to="/"
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-2 text-xs sm:text-sm md:text-base font-medium text-gray-700 hover:text-black transition-colors min-h-[44px] flex items-center bg-white/60 backdrop-blur-sm rounded-lg"
          >
            Home
          </Link>
          <Link
            to="/marketplace"
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-2 text-xs sm:text-sm md:text-base font-medium text-gray-700 hover:text-black transition-colors min-h-[44px] flex items-center bg-white/60 backdrop-blur-sm rounded-lg"
          >
            Marketplace
          </Link>
          <Link
            to="/blog"
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-2 text-xs sm:text-sm md:text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors shadow-md rounded-lg min-h-[44px] flex items-center"
          >
            Blog
          </Link>
        </div>
      </header>

      {/* Floating Shapes */}
      <div className="floating-shapes" style={{zIndex: 2}}>
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      {/* Wave Animation */}
      <div className="wave-container" style={{zIndex: 2}}>
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

      {/* Main Content - Screen Adaptive, No Scroll */}
      <div className="flex-1 flex flex-col justify-start lg:justify-center px-4 sm:px-4 py-20 sm:py-12 md:py-8 lg:py-4 relative z-10 pt-24 sm:pt-20 lg:pt-12 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-6xl mx-auto py-4 sm:py-0">
          {/* Title */}
          <div className="text-center mb-6 sm:mb-6 lg:mb-4">
            <h1 className="font-handwritten text-4xl sm:text-6xl md:text-7xl lg:text-5xl text-black mb-3 sm:mb-3 lg:mb-2 leading-tight px-2">
              Wedding Vendor Resources
            </h1>
            <p className="text-base sm:text-base md:text-base lg:text-sm text-gray-600 max-w-2xl mx-auto px-4">
              Expert strategies for generating qualified wedding leads
            </p>
          </div>

          {/* Articles Grid - Compact Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4 lg:gap-3 mb-6 sm:mb-6 lg:mb-4 px-2 sm:px-4">
            {blogArticles.map((article) => (
              <article 
                key={article.id}
                className="bg-white/30 backdrop-blur-lg rounded-lg p-4 sm:p-4 lg:p-3 shadow-xl border border-white/30 flex flex-col hover:border-white/50 hover:shadow-2xl transition-all duration-200"
                itemScope 
                itemType="https://schema.org/BlogPosting"
              >
                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-block bg-black/80 text-white text-xs sm:text-xs font-semibold px-3 py-1 sm:px-2.5 sm:py-1 rounded-full">
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base sm:text-base lg:text-sm mb-2 sm:mb-2 text-gray-900 glass-text-shadow leading-tight" itemProp="headline">
                  <Link to={`/blog/${article.slug}`} className="no-underline hover:text-black transition-colors">
                    {article.title}
                  </Link>
                </h3>

                {/* Excerpt */}
                <p className="text-gray-900 text-sm sm:text-sm lg:text-xs leading-relaxed mb-3 sm:mb-3 flex-1" itemProp="description">
                  {article.excerpt}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs sm:text-xs text-gray-700 pt-3 border-t border-white/20">
                  <div className="flex items-center space-x-1.5">
                    <Clock size={14} className="sm:w-3 sm:h-3" />
                    <span itemProp="timeRequired">{article.readTime} min</span>
                  </div>
                  <Link 
                    to={`/blog/${article.slug}`}
                    className="inline-flex items-center space-x-1.5 text-black font-semibold hover:underline text-xs sm:text-xs"
                  >
                    <span>Read</span>
                    <ArrowRight size={14} className="sm:w-3 sm:h-3" />
                  </Link>
                </div>

                {/* Hidden Schema.org metadata */}
                <meta itemProp="author" content={article.author} />
                <meta itemProp="dateModified" content={article.lastModified} />
                <time itemProp="datePublished" dateTime={article.publishDate} style={{display: 'none'}}>
                  {article.publishDate}
                </time>
              </article>
            ))}
          </div>

          {/* CTA Box - Compact */}
          <div className="bg-white/35 backdrop-blur-lg rounded-lg p-4 sm:p-4 lg:p-3 max-w-2xl mx-auto border border-white/40 shadow-xl mb-6 sm:mb-6 lg:mb-0">
            <p className="text-gray-900 text-sm sm:text-sm lg:text-xs leading-relaxed text-center mb-3 sm:mb-3">
              <strong className="text-black">Ready to get qualified wedding leads?</strong> Join thousands of vendors. Pay only for leads you want.
            </p>
            <div className="flex justify-center">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center space-x-2 bg-black text-white px-6 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-sm font-bold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Get Started</span>
                <ArrowRight size={16} className="sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Homepage Style */}
      <footer className="relative z-10 bg-white/25 backdrop-blur-md border-t border-white/30 py-2 sm:py-3 md:py-4 lg:py-2">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Mobile Layout */}
          <div className="flex flex-col items-center gap-3 sm:hidden">
            <div className="flex items-center space-x-4">
              <a href="https://www.instagram.com/preciouspicspro/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Instagram">
                <Instagram size={14} />
              </a>
              <a href="https://www.facebook.com/PreciousPicsPro/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Facebook">
                <Facebook size={14} />
              </a>
              <a href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="YouTube">
                <Youtube size={14} />
              </a>
              <a href="https://www.pinterest.com/preciouspicsproduction/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Pinterest">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.713-1.227l.388-.731s.296.564 1.167.564c2.442 0 4.133-2.239 4.133-5.229 0-2.257-1.912-4.4-4.818-4.4-3.619 0-5.45 2.592-5.45 4.75 0 1.305.497 2.466 1.567 2.903.175.072.333.003.384-.19.037-.142.125-.498.164-.647.053-.202.033-.272-.114-.449-.324-.389-.531-.892-.531-1.607 0-2.067 1.547-3.918 4.028-3.918 2.194 0 3.402 1.34 3.402 3.133 0 2.359-1.043 4.347-2.591 4.347-.853 0-1.491-.705-1.287-1.57.244-.103.244-.103.244-.103z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@preciouspicspro" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="TikTok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://vimeo.com/preciouspicsproduction/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Vimeo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                </svg>
              </a>
            </div>
            <a href="https://www.preciouspicspro.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200 text-center text-sm no-underline">
              © 2025 Precious Pics Production Inc
            </a>
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-1.5 text-gray-600 hover:text-black transition-colors duration-200 text-sm min-h-[44px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>
              <Link to="/unsubscribe" className="flex items-center space-x-1.5 text-gray-600 hover:text-black transition-colors duration-200 text-sm min-h-[44px]">
                <UserX size={16} />
                <span>Unsubscribe</span>
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>
              <Link to="/unsubscribe" className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200">
                <UserX size={16} />
                <span>Unsubscribe</span>
              </Link>
            </div>
            <a href="https://www.preciouspicspro.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200 text-center flex-1 no-underline">
              © 2025 Precious Pics Production Inc
            </a>
            <div className="flex items-center space-x-3">
              <a href="https://www.instagram.com/preciouspicspro/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://www.facebook.com/PreciousPicsPro/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://www.youtube.com/channel/UCNcntW64E1euXG95mCSeLbQ/videos" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="YouTube">
                <Youtube size={16} />
              </a>
              <a href="https://www.pinterest.com/preciouspicsproduction/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Pinterest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.713-1.227l.388-.731s.296.564 1.167.564c2.442 0 4.133-2.239 4.133-5.229 0-2.257-1.912-4.4-4.818-4.4-3.619 0-5.45 2.592-5.45 4.75 0 1.305.497 2.466 1.567 2.903.175.072.333.003.384-.19.037-.142.125-.498.164-.647.053-.202.033-.272-.114-.449-.324-.389-.531-.892-.531-1.607 0-2.067 1.547-3.918 4.028-3.918 2.194 0 3.402 1.34 3.402 3.133 0 2.359-1.043 4.347-2.591 4.347-.853 0-1.491-.705-1.287-1.57.244-.103.244-.103.244-.103z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@preciouspicspro" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://vimeo.com/preciouspicsproduction/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors duration-200" aria-label="Vimeo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
