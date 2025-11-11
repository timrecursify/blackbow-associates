import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  return (
    <section
      className="relative py-32 px-6 md:px-12 bg-gray-50"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-24 transform -rotate-1">
          <h2
            id="how-it-works-heading"
            className="font-handwritten text-5xl md:text-7xl text-black mb-6"
          >
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your tireless AI employee
          </p>
        </div>

        <div className="space-y-32">

          {/* Feature 1 */}
          <article className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 transform -rotate-1">
              <div className="bg-black text-white px-5 py-2 rounded-full inline-block mb-6 text-sm font-semibold">
                Instant Response
              </div>
              <h3 className="text-5xl font-bold text-black mb-6">Never Miss Another Inquiry</h3>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Leads get personalized responses in under 2 minutes—even while you're shooting, sleeping, or on vacation.
              </p>
              <ul className="space-y-4" role="list">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">AI responds the moment someone fills out your form</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">Asks about vision, budget, and date</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">Books calls automatically</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-4 transform rotate-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-white/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rounded-full -mr-12 -mt-12" aria-hidden="true"></div>
                <div className="space-y-3 relative z-10">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div className="bg-gray-100 rounded-xl p-3 flex-1 shadow-sm">
                      <p className="text-sm text-gray-900">Hi! What style are you envisioning?</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-3 shadow-sm">
                      <p className="text-sm text-white">Romantic, natural light</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Feature 2 */}
          <article className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 order-2 lg:order-1 transform -rotate-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-white/60 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12" aria-hidden="true"></div>
                <div className="space-y-4 relative z-10">
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="text-sm font-semibold text-gray-500">Before AI</p>
                    <p className="text-gray-900 mt-1">5-10 hours/week on paperwork</p>
                  </div>
                  <div className="border-l-4 border-black pl-4">
                    <p className="text-sm font-semibold text-black">With AI</p>
                    <p className="text-gray-900 mt-1 font-semibold">30 minutes/week reviewing</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-4 rounded-xl text-center shadow-sm">
                    <p className="font-bold text-black text-lg">8+ hours back every week</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 order-1 lg:order-2 transform rotate-1">
              <div className="bg-black text-white px-5 py-2 rounded-full inline-block mb-6 text-sm font-semibold">
                Automation
              </div>
              <h3 className="text-5xl font-bold text-black mb-6">AI Handles Paperwork</h3>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Stop spending evenings on admin work. AI generates contracts and follows up automatically.
              </p>
              <ul className="space-y-4" role="list">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">AI fills in details from conversations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">Gentle reminders for contracts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-lg text-gray-700">Builds wedding day timelines</span>
                </li>
              </ul>
            </div>
          </article>

          {/* Feature 3 */}
          <article className="max-w-5xl mx-auto transform -rotate-1">
            <div className="text-center mb-8">
              <div className="bg-black text-white px-5 py-2 rounded-full inline-block mb-6 text-sm font-semibold">
                Simple Setup
              </div>
              <h3 className="text-5xl font-bold text-black mb-6">60-Second Integration</h3>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Keep your existing website. Add one line of code and every inquiry flows into your CRM.
              </p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-8 font-mono text-sm shadow-2xl">
              <div className="text-green-400">{`<script>
  window.BlackBowCRM = { apiKey: "your_key_here" };
</script>`}</div>
              <div className="text-gray-500 mt-3">// That's it!</div>
            </div>
          </article>

        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
