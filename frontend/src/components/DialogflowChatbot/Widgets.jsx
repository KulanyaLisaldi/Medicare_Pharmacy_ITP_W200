import React from 'react';

// Welcome Buttons Widget
export const WelcomeButtons = (props) => {
  const handleClick = (action) => {
    props.actionProvider.handleButtonClick(action);
  };

  return (
    <div className="welcome-buttons-container">
      <div className="button-grid">
        <button className="welcome-btn primary" onClick={() => handleClick('Book appointment')}>
          <span className="btn-icon">📅</span>
          <span className="btn-text">Book Appointment</span>
        </button>
        <button className="welcome-btn" onClick={() => handleClick('View my bookings')}>
          <span className="btn-icon">📋</span>
          <span className="btn-text">View Bookings</span>
        </button>
        <button className="welcome-btn" onClick={() => handleClick('Find a doctor')}>
          <span className="btn-icon">👨‍⚕️</span>
          <span className="btn-text">Find Doctor</span>
        </button>
        <button className="welcome-btn" onClick={() => handleClick('Medicine recommendation')}>
          <span className="btn-icon">💊</span>
          <span className="btn-text">Medicine</span>
        </button>
        <button className="welcome-btn" onClick={() => handleClick('Track delivery')}>
          <span className="btn-icon">📦</span>
          <span className="btn-text">Track Delivery</span>
        </button>
      </div>
    </div>
  );
};

// Appointment Booking Widget
export const AppointmentBooking = (props) => {
  const handleBookAppointment = () => {
    props.actionProvider.handleButtonClick('Book new appointment');
  };

  const handleBookingSteps = () => {
    props.actionProvider.handleBookingSteps();
  };

  return null;
};

// Doctor Search Widget
export const DoctorSearch = (props) => {
  return (
    <div className="doctor-search-widget">
      <div className="search-options">
        <button className="search-btn" onClick={() => props.actionProvider.handleButtonClick('Find a doctor')}>
          🔍 Find a Doctor
        </button>
      </div>
    </div>
  );
};

// View Appointments Widget
export const ViewAppointments = (props) => {
  const handleYes = () => {
    props.actionProvider.handleHelpOptions('yes');
  };

  const handleNo = () => {
    props.actionProvider.handleHelpOptions('no');
  };

  return null;
};

// Help Options Widget
export const HelpOptions = (props) => {
  const handleYes = () => {
    props.actionProvider.handleHelpOptions('yes');
  };

  const handleNo = () => {
    props.actionProvider.handleHelpOptions('no');
  };
};

// Doctor Finder Widget
export const DoctorFinder = (props) => {
  const handleFindSpecialist = (specialty) => {
    // directly call API via action and render list
    if (props?.actionProvider?.findSpecialist) {
      props.actionProvider.findSpecialist(specialty);
    } else {
      props.actionProvider.handleButtonClick(`Find ${specialty} specialist`);
    }
  };


  const handleViewAllDoctors = () => {
    props.actionProvider.handleButtonClick('Show all available doctors');
  };


  return (
    <div className="doctor-finder-widget">
      <div className="doctor-finder-options">
        <button className="doctor-finder-btn primary" onClick={handleViewAllDoctors}>
          👥 View All Doctors
        </button>
        <button className="doctor-finder-btn" onClick={() => props.actionProvider.handleButtonClick('Describe symptoms')}>
          🩺 Describe Symptoms
        </button>
      </div>
      
      <div className="specialist-options">
        <h4>Or choose a specialty:</h4>
        <div className="specialist-grid">
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Cardiologist')}>
            ❤️ Cardiologist
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Neurologist')}>
            🧠 Neurologist
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Dermatologist')}>
            🩺 Dermatologist
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Pediatrician')}>
            👶 Pediatrician
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Gynecologist')}>
            👩‍⚕️ Gynecologist
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('General Practitioner')}>
            💉 General Practitioner
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Endocrinologist')}>
            🩸 Endocrinologist
          </button>
          <button className="specialist-btn" onClick={() => handleFindSpecialist('Psychiatrist')}>
            🧠 Psychiatrist
          </button>
        </div>
      </div>
    </div>
  );
};

// Symptom Selector Widget
export const SymptomSelector = (props) => {
  const action = props?.actionProvider;
  const symptoms = [
    'Headache', 'Migraine', 'Dizziness', 'Chest pain', 'Shortness of breath',
    'Cough', 'Wheezing', 'Skin rash', 'Acne', 'Itching',
    'Stomach pain', 'Nausea', 'Diarrhea', 'Constipation',
    'Tooth pain', 'Gum pain', 'Eye problem', 'Blurred vision',
    'Ear pain', 'Sore throat', 'Sinus',
    'Anxiety', 'Depression', 'Back pain', 'Joint pain',
    'Fever', 'Flu'
  ];

  return (
    <div className="symptom-selector-widget">
      <div className="symptom-grid">
        {symptoms.map((s) => (
          <button key={s} className="symptom-btn" onClick={() => action.handleSymptomChoice(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// Medicine Recommendation Widget
export const MedicineRecommendation = (props) => {
  const handleMedicineSearch = (category) => {
    if (props?.actionProvider?.handleMedicineCategory) {
      props.actionProvider.handleMedicineCategory(category);
    } else {
      props.actionProvider.handleButtonClick(`Find ${category} medicine`);
    }
  };

  return (
    <div className="medicine-widget">
      <div className="medicine-categories">
        <button className="medicine-btn" onClick={() => handleMedicineSearch('pain relief')}>
          💊 Pain Relief
        </button>
        <button className="medicine-btn" onClick={() => handleMedicineSearch('cold and flu')}>
          🤧 Cold & Flu
        </button>
        <button className="medicine-btn" onClick={() => handleMedicineSearch('vitamins')}>
          💊 Vitamins
        </button>
        <button className="medicine-btn" onClick={() => handleMedicineSearch('prescription')}>
          📋 Prescription
        </button>
      </div>
    </div>
  );
};

// Medicine Symptoms Widget (shown after selecting a category)
export const MedicineSymptoms = (props) => {
  const category = (props?.payload?.category || '').toLowerCase();

  const CATEGORY_SYMPTOMS = {
    'pain relief': ['Headache', 'Muscle pain', 'Back pain', 'Toothache', 'Menstrual cramps'],
    'cold and flu': ['Fever', 'Cough', 'Sore throat', 'Nasal congestion', 'Runny nose'],
    'vitamins': ['Low energy', 'Immunity support', 'Bone health', 'Anemia', 'Hair & nail health'],
    'prescription': ['Hypertension', 'Diabetes', 'High cholesterol', 'Thyroid', 'Asthma']
  };

  const symptoms = CATEGORY_SYMPTOMS[category] || [];

  const onSelectSymptom = (symptom) => {
    if (props?.actionProvider?.handleMedicineSymptomSelect) {
      props.actionProvider.handleMedicineSymptomSelect(category, symptom);
    }
  };

  if (!category) return null;

  return (
    <div className="medicine-symptoms-widget">
      <div className="symptoms-header">Select the symptom you want to address:</div>
      <div className="symptoms-grid">
        {symptoms.map((s) => (
          <button key={s} className="symptom-btn" onClick={() => onSelectSymptom(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// Delivery Tracking Widget
export const DeliveryTracking = (props) => {
  const handleTrackOrder = () => {
    props.actionProvider.handleButtonClick('Track my order');
  };

  return (
    <div className="delivery-widget">
      <div className="tracking-options">
        <button className="track-btn" onClick={handleTrackOrder}>
          📦 Track Order
        </button>
        <button className="track-btn" onClick={() => props.actionProvider.handleButtonClick('Delivery status')}>
          📊 Check Status
        </button>
        <button className="track-btn" onClick={() => props.actionProvider.handleButtonClick('Delivery history')}>
          📋 Order History
        </button>
      </div>
    </div>
  );
};

// Doctor List Widget
export const DoctorList = (props) => {
  const results = props?.payload || props?.state?.doctorResults;
  const doctors = results?.doctors || [];
  const message = results?.message;
  const specialty = results?.specialty;

  return (
    <div className="doctor-list-widget">
      {specialty && !message && <div className="notice" style={{fontWeight:600, marginBottom:6}}>{`Here are available ${specialty} doctors:`}</div>}
      {message && <div className="notice">{message}</div>}
      {doctors.length > 0 ? (
        <ul className="doctor-list">
          {doctors.map((d) => (
            <li key={d.id} className="doctor-item">
              <div className="doctor-name">{d.name}</div>
              <div className="doctor-spec">{d.specialization}</div>
            </li>
          ))}
        </ul>
      ) : (!message && <div>No doctors to display.</div>)}
    </div>
  );
};

// Order Tracking Widget
export const OrderTracking = (props) => {
  const { order, statusMessage, estimatedDelivery } = props.payload || {};
  
  if (!order) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-error">
          <h4>❌ Order Not Found</h4>
          <p>Please check your order number and try again.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#28a745';
      case 'out_for_delivery': return '#17a2b8';
      case 'ready': return '#ffc107';
      case 'preparing': return '#fd7e14';
      case 'confirmed': return '#6f42c1';
      case 'pending': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="order-tracking-container">
      <div className="order-header">
        <h4>📦 Order Details</h4>
        <div className="order-number">Order #: {order.orderNumber}</div>
      </div>
      
      <div className="order-status">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
          {order.status.replace('_', ' ').toUpperCase()}
        </div>
        <p className="status-message">{statusMessage}</p>
        {estimatedDelivery && (
          <p className="estimated-delivery">📅 Estimated Delivery: {estimatedDelivery}</p>
        )}
      </div>

      <div className="order-info">
        <div className="info-section">
          <h5>👤 Customer Information</h5>
          <p><strong>Name:</strong> {order.customer.name}</p>
          <p><strong>Email:</strong> {order.customer.email}</p>
          <p><strong>Phone:</strong> {order.customer.phone}</p>
        </div>

        <div className="info-section">
          <h5>📅 Order Information</h5>
          <p><strong>Order Date:</strong> {formatDate(order.orderDate)}</p>
          <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
          <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
        </div>

        <div className="info-section">
          <h5>📍 Delivery Address</h5>
          <p>{order.deliveryAddress}</p>
        </div>

        <div className="info-section">
          <h5>💊 Products Ordered</h5>
          <div className="products-list">
            {order.products.map((product, index) => (
              <div key={index} className="product-item">
                <span className="product-name">{product.name}</span>
                <span className="product-quantity">Qty: {product.quantity}</span>
                <span className="product-price">${product.total}</span>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className="info-section">
            <h5>📝 Notes</h5>
            <p>{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
