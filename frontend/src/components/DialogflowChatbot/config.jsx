import { createChatBotMessage } from 'react-chatbot-kit';
import { 
  WelcomeButtons, 
  AppointmentBooking, 
  DoctorFinder, 
  MedicineRecommendation, 
  DeliveryTracking,
  DoctorSearch,
  ViewAppointments,
  HelpOptions
} from './Widgets';

const config = {
  initialMessages: [
    createChatBotMessage("👋 Hello! I'm your Medicare Assistant. How can I help you today?", {
      widget: 'welcomeButtons'
    })
  ],
  widgets: [
    {
      widgetName: 'welcomeButtons',
      widgetFunc: (props) => <WelcomeButtons {...props} />,
    },
    {
      widgetName: 'appointmentBooking',
      widgetFunc: (props) => <AppointmentBooking {...props} />,
    },
    {
      widgetName: 'doctorFinder',
      widgetFunc: (props) => <DoctorFinder {...props} />,
    },
    {
      widgetName: 'medicineRecommendation',
      widgetFunc: (props) => <MedicineRecommendation {...props} />,
    },
          {
            widgetName: 'deliveryTracking',
            widgetFunc: (props) => <DeliveryTracking {...props} />,
          },
          {
            widgetName: 'doctorSearch',
            widgetFunc: (props) => <DoctorSearch {...props} />,
          },
          {
            widgetName: 'viewAppointments',
            widgetFunc: (props) => <ViewAppointments {...props} />,
          },
          {
            widgetName: 'helpOptions',
            widgetFunc: (props) => <HelpOptions {...props} />,
          }
        ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#3b82f6',
    },
    chatButton: {
      backgroundColor: '#3b82f6',
    },
  },
  customComponents: {
    header: () => null
  }
};

export default config;
