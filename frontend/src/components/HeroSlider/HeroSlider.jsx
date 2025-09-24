import React, { useState, useEffect } from 'react';
import slide1 from '../../assets/slide1.jpg';
import slide2 from '../../assets/slide2.jpg';
import slide3 from '../../assets/slide3.jpg';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: slide1,
      title: "Your Health, Our Priority",
      subtitle: "Experience seamless healthcare with MediCare. Get quality medicines, expert consultations, and reliable healthcare services delivered to your doorstep.",
      buttonText: "Get Started",
      buttonSecondary: "Learn More"
    },
    {
      id: 2,
      image: slide2,
      title: "Quality Healthcare Delivered",
      subtitle: "Professional medical care and pharmaceutical services at your convenience. Trust our experienced team for all your healthcare needs.",
      buttonText: "Shop Medicines",
      buttonSecondary: "Book Consultation"
    },
    {
      id: 3,
      image: slide3,
      title: "24/7 Healthcare Support",
      subtitle: "Round-the-clock access to healthcare services, emergency support, and medical consultations whenever you need them.",
      buttonText: "Emergency Care",
      buttonSecondary: "Contact Us"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 15000); // Change slide every 8 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                index === currentSlide ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {/* Background Image */}
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                     <div className="space-y-6 text-white">
                       <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                         {slide.title}
                       </h1>
                       <p className="text-lg leading-relaxed text-gray-100">
                         {slide.subtitle}
                       </p>
                       <div className="flex flex-col sm:flex-row gap-3">
                         <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-base transition-colors shadow-lg hover:shadow-xl">
                           {slide.buttonText}
                         </button>
                         <button className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-lg font-semibold text-base transition-colors">
                           {slide.buttonSecondary}
                         </button>
                       </div>
                    </div>
                    <div className="hidden lg:block">
                      {/* Optional: Add some visual element here */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 z-20"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 z-20"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default HeroSlider;
