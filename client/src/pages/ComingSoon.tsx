import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 45);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-[#111111] flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-12">
          <img 
            src="/isohub-logo.png" 
            alt="ISO Hub Logo" 
            className="h-20 w-auto mx-auto mb-8"
            data-testid="img-logo"
          />
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Something <span className="text-yellow-400">Amazing</span> is Coming
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            We're working hard to bring you an exceptional experience. Stay tuned for the launch of our revolutionary platform.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="bg-[#1a1a1a] border-2 border-yellow-400/30 rounded-xl p-6 hover:border-yellow-400 transition-all">
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2" data-testid="text-days">
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Days</div>
          </div>
          
          <div className="bg-[#1a1a1a] border-2 border-yellow-400/30 rounded-xl p-6 hover:border-yellow-400 transition-all">
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2" data-testid="text-hours">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Hours</div>
          </div>
          
          <div className="bg-[#1a1a1a] border-2 border-yellow-400/30 rounded-xl p-6 hover:border-yellow-400 transition-all">
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2" data-testid="text-minutes">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Minutes</div>
          </div>
          
          <div className="bg-[#1a1a1a] border-2 border-yellow-400/30 rounded-xl p-6 hover:border-yellow-400 transition-all">
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2" data-testid="text-seconds">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Seconds</div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-[#1a1a1a] border border-yellow-400/20 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">What to Expect</h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🚀</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Lightning Fast</h4>
              <p className="text-sm text-gray-400">Optimized performance for seamless experience</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Beautiful Design</h4>
              <p className="text-sm text-gray-400">Modern interface crafted for excellence</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Secure & Reliable</h4>
              <p className="text-sm text-gray-400">Enterprise-grade security standards</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button 
              variant="outline"
              size="lg"
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-yellow-400/10">
          <p className="text-gray-600 text-sm">
            © 2025 ISOHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
