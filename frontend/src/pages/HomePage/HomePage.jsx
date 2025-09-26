import React from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import HeroSlider from "../../components/HeroSlider/HeroSlider"
import { useAuth } from "../../context/AuthContext"
import onlinepharmacy from "../../assets/onlinepharmacy.jpg"
import doctorconsultion from "../../assets/doctorconsultion.jpg"
import prescriptions from "../../assets/prescriptions.jpg"
import illustration from "../../assets/illustration.jpg"

const HomePage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section with Slider */}
      <section>
        <div className="w-full">
          <HeroSlider />
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive healthcare solutions designed to meet all your medical needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Online Pharmacy */}
            <div 
              className="relative overflow-hidden p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex items-center justify-center min-h-[260px]"
              style={{
                backgroundImage: `url(${onlinepharmacy})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-70" />
              <div className="relative text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Online Pharmacy</h3>
              <p className="text-gray-600 mb-6">
                Wide range of medicines, health products, and medical supplies with fast delivery.
              </p>
              <Link to="/products" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Shop Now →
              </Link>
              </div>
            </div>

            {/* Doctor Consultations */}
            <div 
              className="relative overflow-hidden p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex items-center justify-center min-h-[260px]"
              style={{
                backgroundImage: `url(${doctorconsultion})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-70" />
              <div className="relative text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Doctor Consultations</h3>
              <p className="text-gray-600 mb-6">
                Connect with qualified healthcare professionals for online consultations and advice.
              </p>
              <Link to="/doctors" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Book Now →
              </Link>
              </div>
            </div>

            {/* Prescription Management */}
            <div 
              className="relative overflow-hidden p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow flex items-center justify-center min-h-[260px]"
              style={{
                backgroundImage: `url(${prescriptions})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-70" />
              <div className="relative text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Prescription Management</h3>
              <p className="text-gray-600 mb-6">
                Upload and manage your prescriptions digitally with our secure platform.
              </p>
              <Link to="/upload-prescription" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Upload Now →
              </Link>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">Why Choose MediCare?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">24/7 Availability</h3>
                    <p className="text-gray-600">Round-the-clock access to healthcare services and support</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
                    <p className="text-gray-600">Quick and reliable delivery of medicines and healthcare products</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Expert Care</h3>
                    <p className="text-gray-600">Qualified healthcare professionals and licensed pharmacists</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                    <p className="text-gray-600">Your health information is protected with industry-standard security</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 rounded-2xl overflow-hidden">
                <img 
                  src={illustration} 
                  alt="MediCare Features Illustration" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of satisfied customers who trust MediCare for their healthcare needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-base transition-colors">
              Get Started Today
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-base transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage
